import { describe, expect, it } from "vitest";
import { renderRepositoryActivity, repositorySyncLabel } from "./repository-activity";
import type { RepositoryCache } from "../domain/repositories";

const populatedCache: RepositoryCache = {
  lastSyncedAt: "2026-09-25T12:00:00Z",
  items: [{
    id: 1,
    name: "devpulse",
    fullName: "octocat/devpulse",
    private: false,
    url: "https://github.com/octocat/devpulse",
    defaultBranch: "main",
    updatedAt: "2026-09-24T10:00:00Z",
  }],
};

describe("repository activity view", () => {
  it("renders an informative empty state", () => {
    const html = renderRepositoryActivity({ items: [], lastSyncedAt: null });
    expect(html).toContain("No repositories cached yet");
    expect(html).toContain("0 repositories");
    expect(html).toContain("Ready to sync");
  });

  it("renders cached repository details and sync status", () => {
    const html = renderRepositoryActivity(populatedCache);
    expect(html).toContain("octocat/devpulse");
    expect(html).toContain("Public");
    expect(html).toContain("main");
    expect(html).toContain("Updated Sep 24, 2026");
    expect(repositorySyncLabel(populatedCache)).toBe("Synced Sep 25, 2026");
  });

  it("escapes repository content and blocks untrusted links", () => {
    const html = renderRepositoryActivity({
      lastSyncedAt: null,
      items: [{
        ...populatedCache.items[0],
        fullName: "octocat/<script>",
        url: "javascript:alert(1)",
        defaultBranch: '"><img src=x>',
      }],
    });

    expect(html).toContain("octocat/&lt;script&gt;");
    expect(html).toContain('href="#"');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
  });
});
