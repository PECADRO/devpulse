import type { FocusItem } from "./focus";
import { createEmptyRepositoryCache, isRepositoryCache, type RepositoryCache } from "./repositories";
import type { TriageItem } from "./triage";

export const WORKSPACE_STORAGE_KEY = "devpulse.workspace";
export const LEGACY_FOCUS_STORAGE_KEY = "devpulse.focus.v1";
export const CURRENT_SCHEMA_VERSION = 3 as const;

export interface TriageCache {
  owner: string | null;
  items: TriageItem[];
  lastSyncedAt: string | null;
}

export interface Workspace {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  focusItems: FocusItem[];
  repositories: RepositoryCache;
  triage: TriageCache;
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
    repositories: createEmptyRepositoryCache(),
    triage: { owner: null, items: [], lastSyncedAt: null },
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

interface ParsedWorkspace {
  workspace: Workspace;
  migrated: boolean;
}

function hasValidCore(value: Record<string, unknown>): boolean {
  return Array.isArray(value.focusItems) && value.focusItems.every(isFocusItem) &&
    typeof value.preferences === "object" && value.preferences !== null &&
    ((value.preferences as Workspace["preferences"]).weekStartsOn === "monday" ||
      (value.preferences as Workspace["preferences"]).weekStartsOn === "sunday");
}

function isTriageItem(value: unknown): value is TriageItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<TriageItem>;
  return (item.kind === "issue" || item.kind === "pull-request") &&
    typeof item.id === "number" && typeof item.number === "number" &&
    typeof item.title === "string" && typeof item.url === "string" &&
    typeof item.repositoryFullName === "string" && Array.isArray(item.labels) &&
    item.labels.every(label => typeof label === "string") && typeof item.comments === "number" &&
    typeof item.draft === "boolean" && typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string" && typeof item.priority === "number" &&
    Array.isArray(item.reasons) && item.reasons.every(reason => typeof reason === "string");
}

function isTriageCache(value: unknown): value is TriageCache {
  if (typeof value !== "object" || value === null) return false;
  const cache = value as Partial<TriageCache>;
  return (cache.owner === null || typeof cache.owner === "string") &&
    Array.isArray(cache.items) && cache.items.every(isTriageItem) &&
    (cache.lastSyncedAt === null || typeof cache.lastSyncedAt === "string");
}

function parseWorkspace(raw: string): ParsedWorkspace | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const candidate = value as Record<string, unknown>;
    if (!hasValidCore(candidate)) return null;

    if (candidate.schemaVersion === 1) {
      return {
        workspace: {
          schemaVersion: CURRENT_SCHEMA_VERSION,
          focusItems: candidate.focusItems as FocusItem[],
          repositories: createEmptyRepositoryCache(),
          triage: { owner: null, items: [], lastSyncedAt: null },
          preferences: candidate.preferences as Workspace["preferences"],
        },
        migrated: true,
      };
    }


    if (candidate.schemaVersion === 2 && isRepositoryCache(candidate.repositories)) {
      return {
        workspace: {
          schemaVersion: CURRENT_SCHEMA_VERSION,
          focusItems: candidate.focusItems as FocusItem[],
          repositories: candidate.repositories,
          triage: { owner: null, items: [], lastSyncedAt: null },
          preferences: candidate.preferences as Workspace["preferences"],
        },
        migrated: true,
      };
    }

    if (candidate.schemaVersion !== CURRENT_SCHEMA_VERSION || !isRepositoryCache(candidate.repositories) ||
        !isTriageCache(candidate.triage)) return null;
    return { workspace: candidate as unknown as Workspace, migrated: false };
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
    if (parsed) {
      if (parsed.migrated) saveWorkspace(storage, parsed.workspace);
      return parsed.workspace;
    }
  }

  return migrateLegacyFocusItems(storage) ?? createEmptyWorkspace();
}

export function saveWorkspace(storage: Pick<StorageAdapter, "setItem">, workspace: Workspace): void {
  storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
}
