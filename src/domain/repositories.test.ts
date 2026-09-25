import { describe, expect, it } from "vitest";
import { createEmptyRepositoryCache, synchronizeRepositories, type RepositoryRecord } from "./repositories";

function repository(id: number, updatedAt: string, name = `repo-${id}`): RepositoryRecord {
  return {
    id,
    name,
    fullName: `octocat/${name}`,
    private: false,
    url: `https://github.com/octocat/${name}`,
    defaultBranch: "main",
    updatedAt,
  };
}

describe("repository synchronization", () => {
  it("sorts repositories by activity and records the sync time", async () => {
    const source = { listRepositories: async () => [
      repository(1, "2026-09-20T10:00:00Z"),
      repository(2, "2026-09-24T10:00:00Z"),
    ] };

    const result = await synchronizeRepositories(source, createEmptyRepositoryCache(), "2026-09-25T08:00:00Z");

    expect(result.cache.items.map(item => item.id)).toEqual([2, 1]);
    expect(result.cache.lastSyncedAt).toBe("2026-09-25T08:00:00Z");
    expect(result.summary).toEqual({ added: [2, 1], updated: [], removed: [] });
  });

  it("reports added, updated, and removed repositories", async () => {
    const previous = {
      items: [repository(1, "2026-09-20T10:00:00Z"), repository(2, "2026-09-20T10:00:00Z")],
      lastSyncedAt: "2026-09-20T11:00:00Z",
    };
    const source = { listRepositories: async () => [
      repository(1, "2026-09-24T10:00:00Z", "renamed"),
      repository(3, "2026-09-23T10:00:00Z"),
    ] };

    const result = await synchronizeRepositories(source, previous, "2026-09-25T08:00:00Z");

    expect(result.summary).toEqual({ added: [3], updated: [1], removed: [2] });
  });

  it("deduplicates repeated API records by repository id", async () => {
    const source = { listRepositories: async () => [
      repository(1, "2026-09-20T10:00:00Z", "old-name"),
      repository(1, "2026-09-24T10:00:00Z", "new-name"),
    ] };

    const result = await synchronizeRepositories(source, createEmptyRepositoryCache(), "2026-09-25T08:00:00Z");
    expect(result.cache.items).toHaveLength(1);
    expect(result.cache.items[0].name).toBe("new-name");
  });

  it("rejects invalid sync timestamps without calling the source", async () => {
    let called = false;
    const source = { listRepositories: async () => { called = true; return []; } };

    await expect(synchronizeRepositories(source, createEmptyRepositoryCache(), "not-a-date"))
      .rejects.toThrow("valid ISO date");
    expect(called).toBe(false);
  });
});
