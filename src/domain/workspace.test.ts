import { describe, expect, it } from "vitest";
import {
  CURRENT_SCHEMA_VERSION,
  LEGACY_FOCUS_STORAGE_KEY,
  WORKSPACE_STORAGE_KEY,
  createEmptyWorkspace,
  loadWorkspace,
  saveWorkspace,
  type StorageAdapter,
} from "./workspace";

function memoryStorage(initial: Record<string, string> = {}): StorageAdapter & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => { data.delete(key); },
  };
}

describe("workspace persistence", () => {
  it("round-trips the current schema", () => {
    const storage = memoryStorage();
    const workspace = createEmptyWorkspace();
    workspace.preferences.weekStartsOn = "sunday";
    saveWorkspace(storage, workspace);

    expect(loadWorkspace(storage)).toEqual(workspace);
  });

  it("migrates focus items from the legacy key", () => {
    const legacyItem = { id: "1", title: "Ship migration", done: false, createdAt: "2026-09-23" };
    const storage = memoryStorage({ [LEGACY_FOCUS_STORAGE_KEY]: JSON.stringify([legacyItem]) });

    const workspace = loadWorkspace(storage);

    expect(workspace.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(workspace.focusItems).toEqual([legacyItem]);
    expect(workspace.repositories).toEqual({ items: [], lastSyncedAt: null });
    expect(storage.data.has(LEGACY_FOCUS_STORAGE_KEY)).toBe(false);
    expect(storage.data.has(WORKSPACE_STORAGE_KEY)).toBe(true);
  });

  it("migrates a version 1 workspace and persists the upgraded schema", () => {
    const versionOne = {
      schemaVersion: 1,
      focusItems: [{ id: "1", title: "Keep task", done: false, createdAt: "now" }],
      preferences: { weekStartsOn: "monday" },
    };
    const storage = memoryStorage({ [WORKSPACE_STORAGE_KEY]: JSON.stringify(versionOne) });

    const workspace = loadWorkspace(storage);

    expect(workspace.schemaVersion).toBe(2);
    expect(workspace.focusItems).toEqual(versionOne.focusItems);
    expect(workspace.repositories).toEqual({ items: [], lastSyncedAt: null });
    expect(JSON.parse(storage.data.get(WORKSPACE_STORAGE_KEY)!)).toEqual(workspace);
  });

  it("keeps valid legacy records and drops malformed ones", () => {
    const valid = { id: "1", title: "Keep me", done: true, createdAt: "now" };
    const storage = memoryStorage({ [LEGACY_FOCUS_STORAGE_KEY]: JSON.stringify([valid, { id: "broken" }]) });

    expect(loadWorkspace(storage).focusItems).toEqual([valid]);
  });

  it("falls back safely when stored data is corrupt or from an unknown schema", () => {
    expect(loadWorkspace(memoryStorage({ [WORKSPACE_STORAGE_KEY]: "not-json" }))).toEqual(createEmptyWorkspace());
    expect(loadWorkspace(memoryStorage({
      [WORKSPACE_STORAGE_KEY]: JSON.stringify({ schemaVersion: 99, focusItems: [], preferences: { weekStartsOn: "monday" } }),
    }))).toEqual(createEmptyWorkspace());
  });
});
