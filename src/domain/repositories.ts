export interface RepositoryRecord {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  url: string;
  defaultBranch: string;
  updatedAt: string;
}

export interface RepositoryCache {
  items: RepositoryRecord[];
  lastSyncedAt: string | null;
}

export interface RepositorySource {
  listRepositories(signal?: AbortSignal): Promise<RepositoryRecord[]>;
}

export interface RepositorySyncSummary {
  added: number[];
  updated: number[];
  removed: number[];
}

export interface RepositorySyncResult {
  cache: RepositoryCache;
  summary: RepositorySyncSummary;
}

export function createEmptyRepositoryCache(): RepositoryCache {
  return { items: [], lastSyncedAt: null };
}

export function isRepositoryRecord(value: unknown): value is RepositoryRecord {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RepositoryRecord>;
  return typeof candidate.id === "number" && Number.isSafeInteger(candidate.id) &&
    typeof candidate.name === "string" && typeof candidate.fullName === "string" &&
    typeof candidate.private === "boolean" && typeof candidate.url === "string" &&
    typeof candidate.defaultBranch === "string" && typeof candidate.updatedAt === "string";
}

export function isRepositoryCache(value: unknown): value is RepositoryCache {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RepositoryCache>;
  return Array.isArray(candidate.items) && candidate.items.every(isRepositoryRecord) &&
    (candidate.lastSyncedAt === null || typeof candidate.lastSyncedAt === "string");
}

function hasRemoteChanges(previous: RepositoryRecord, current: RepositoryRecord): boolean {
  return previous.name !== current.name || previous.fullName !== current.fullName ||
    previous.private !== current.private || previous.url !== current.url ||
    previous.defaultBranch !== current.defaultBranch || previous.updatedAt !== current.updatedAt;
}

function normalizedRepositories(items: RepositoryRecord[]): RepositoryRecord[] {
  const byId = new Map<number, RepositoryRecord>();
  for (const item of items) {
    if (!isRepositoryRecord(item)) throw new Error("Repository source returned an invalid record.");
    byId.set(item.id, { ...item });
  }

  return [...byId.values()].sort((left, right) => {
    const byUpdatedAt = Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
    return Number.isNaN(byUpdatedAt) || byUpdatedAt === 0
      ? left.fullName.localeCompare(right.fullName)
      : byUpdatedAt;
  });
}

export async function synchronizeRepositories(
  source: RepositorySource,
  previous: RepositoryCache,
  syncedAt: string,
  signal?: AbortSignal,
): Promise<RepositorySyncResult> {
  if (Number.isNaN(Date.parse(syncedAt))) throw new Error("Repository sync time must be a valid ISO date.");

  const items = normalizedRepositories(await source.listRepositories(signal));
  const previousById = new Map(previous.items.map(item => [item.id, item]));
  const currentIds = new Set(items.map(item => item.id));
  const summary: RepositorySyncSummary = { added: [], updated: [], removed: [] };

  for (const item of items) {
    const oldItem = previousById.get(item.id);
    if (!oldItem) summary.added.push(item.id);
    else if (hasRemoteChanges(oldItem, item)) summary.updated.push(item.id);
  }
  for (const item of previous.items) {
    if (!currentIds.has(item.id)) summary.removed.push(item.id);
  }

  return { cache: { items, lastSyncedAt: syncedAt }, summary };
}
