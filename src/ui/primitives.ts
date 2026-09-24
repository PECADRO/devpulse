import type { FocusItem } from "../domain/focus";

export type Tone = "accent" | "success" | "warning";

export interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  detail: string;
  tone: Tone;
}

export interface WorkspacePointProps {
  index: string;
  title: string;
  detail: string;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export function renderBadge(label: string, tone: Tone = "accent"): string {
  return `<span class="badge badge--${tone}">${escapeHtml(label)}</span>`;
}

export function renderMetricCard({ icon, label, value, detail, tone }: MetricCardProps): string {
  return `<article class="metric">
    <span class="metric-icon ${tone}" aria-hidden="true">${escapeHtml(icon)}</span>
    <p>${escapeHtml(label)}</p>
    <strong>${escapeHtml(String(value))}</strong>
    <small>${escapeHtml(detail)}</small>
  </article>`;
}

export function renderFocusItem(item: FocusItem): string {
  const title = escapeHtml(item.title);
  const stateClass = item.done ? " is-done" : "";
  const actionLabel = item.done ? "Mark incomplete" : "Mark complete";

  return `<li class="task${stateClass}">
    <button class="check" type="button" data-action="toggle" data-id="${escapeHtml(item.id)}" aria-label="${actionLabel}: ${title}">${item.done ? "✓" : ""}</button>
    <span>${title}</span>
    <button class="remove" type="button" data-action="remove" data-id="${escapeHtml(item.id)}" aria-label="Remove ${title}">×</button>
  </li>`;
}

export function renderEmptyState(): string {
  return `<div class="empty-state">
    <div class="empty-icon" aria-hidden="true">✦</div>
    <h3>Start with one clear step</h3>
    <p>Add a priority above. Your list stays on this device and is ready when you come back.</p>
  </div>`;
}

export function renderWorkspacePoint({ index, title, detail }: WorkspacePointProps): string {
  return `<div>
    <span>${escapeHtml(index)}</span>
    <strong>${escapeHtml(title)}</strong>
    <small>${escapeHtml(detail)}</small>
  </div>`;
}
