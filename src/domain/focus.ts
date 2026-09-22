export interface FocusItem {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

const STORAGE_KEY = "devpulse.focus.v1";

export function loadFocusItems(storage: Pick<Storage, "getItem">): FocusItem[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is FocusItem =>
      typeof item === "object" && item !== null &&
      typeof item.id === "string" && typeof item.title === "string" &&
      typeof item.done === "boolean" && typeof item.createdAt === "string"
    );
  } catch {
    return [];
  }
}

export function saveFocusItems(storage: Pick<Storage, "setItem">, items: FocusItem[]): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addFocusItem(items: FocusItem[], title: string, id: string, now: string): FocusItem[] {
  const trimmed = title.trim();
  if (!trimmed || trimmed.length > 120) return items;
  return [{ id, title: trimmed, done: false, createdAt: now }, ...items];
}

export function toggleFocusItem(items: FocusItem[], id: string): FocusItem[] {
  return items.map(item => item.id === id ? { ...item, done: !item.done } : item);
}

export function removeFocusItem(items: FocusItem[], id: string): FocusItem[] {
  return items.filter(item => item.id !== id);
}
