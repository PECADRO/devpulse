import type { RepositoryCache, RepositoryRecord } from "../domain/repositories";
import { escapeHtml, renderBadge } from "./primitives";

function safeRepositoryUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com" ? url.href : "#";
  } catch {
    return "#";
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function renderRepository(repository: RepositoryRecord): string {
  const name = escapeHtml(repository.fullName);
  const visibility = repository.private ? "Private" : "Public";
  const tone = repository.private ? "warning" : "success";

  return `<li class="repository-item">
    <div class="repository-main">
      <a href="${escapeHtml(safeRepositoryUrl(repository.url))}" target="_blank" rel="noopener noreferrer" aria-label="Open ${name} on GitHub">${name}</a>
      <span class="repository-meta">${renderBadge(visibility, tone)}<span>${escapeHtml(repository.defaultBranch)}</span></span>
    </div>
    <time datetime="${escapeHtml(repository.updatedAt)}">Updated ${escapeHtml(formatDate(repository.updatedAt))}</time>
  </li>`;
}

export function repositorySyncLabel(cache: RepositoryCache): string {
  return cache.lastSyncedAt ? `Synced ${formatDate(cache.lastSyncedAt)}` : "Ready to sync";
}

export function renderRepositoryActivity(cache: RepositoryCache): string {
  const countLabel = `${cache.items.length} ${cache.items.length === 1 ? "repository" : "repositories"}`;
  const content = cache.items.length
    ? `<ul class="repository-list">${cache.items.slice(0, 6).map(renderRepository).join("")}</ul>`
    : `<div class="repository-empty">
        <span aria-hidden="true">⌁</span>
        <div><strong>No repositories cached yet</strong><p>Repository activity will appear here after the first authenticated sync.</p></div>
      </div>`;

  return `<section class="panel repository-panel" id="repositories" aria-labelledby="repositories-title">
    <div class="panel-header">
      <div><p class="eyebrow">REPOSITORY ACTIVITY</p><h2 id="repositories-title">Recently active</h2></div>
      <div class="repository-status">${renderBadge(countLabel)}<small>${escapeHtml(repositorySyncLabel(cache))}</small></div>
    </div>
    ${content}
  </section>`;
}
