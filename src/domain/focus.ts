export interface FocusItem {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
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
