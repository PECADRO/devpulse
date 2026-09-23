import type { FocusItem } from "./focus";

export const WORKSPACE_STORAGE_KEY = "devpulse.workspace";
export const LEGACY_FOCUS_STORAGE_KEY = "devpulse.focus.v1";
export const CURRENT_SCHEMA_VERSION = 1 as const;

export interface Workspace {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  focusItems: FocusItem[];
  preferences: {
    weekStartsOn: "monday" | "sunday";
  };
}

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createEmptyWorkspace(): Workspace {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    focusItems: [],
    preferences: { weekStartsOn: "monday" },
  };
}

function isFocusItem(value: unknown): value is FocusItem {
  return typeof value === "object" && value !== null &&
    typeof (value as FocusItem).id === "string" &&
    typeof (value as FocusItem).title === "string" &&
    typeof (value as FocusItem).done === "boolean" &&
    typeof (value as FocusItem).createdAt === "string";
}

function parseWorkspace(raw: string): Workspace | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const candidate = value as Partial<Workspace>;
    if (candidate.schemaVersion !== CURRENT_SCHEMA_VERSION) return null;
    if (!Array.isArray(candidate.focusItems) || !candidate.focusItems.every(isFocusItem)) return null;
    if (candidate.preferences?.weekStartsOn !== "monday" && candidate.preferences?.weekStartsOn !== "sunday") return null;
    return candidate as Workspace;
  } catch {
    return null;
  }
}

function migrateLegacyFocusItems(storage: StorageAdapter): Workspace | null {
  const raw = storage.getItem(LEGACY_FOCUS_STORAGE_KEY);
  if (!raw) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return null;
    const workspace = createEmptyWorkspace();
    workspace.focusItems = value.filter(isFocusItem);
    saveWorkspace(storage, workspace);
    storage.removeItem(LEGACY_FOCUS_STORAGE_KEY);
    return workspace;
  } catch {
    return null;
  }
}

export function loadWorkspace(storage: StorageAdapter): Workspace {
  const current = storage.getItem(WORKSPACE_STORAGE_KEY);
  if (current) {
    const parsed = parseWorkspace(current);
    if (parsed) return parsed;
  }

  return migrateLegacyFocusItems(storage) ?? createEmptyWorkspace();
}

export function saveWorkspace(storage: Pick<StorageAdapter, "setItem">, workspace: Workspace): void {
  storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
}
