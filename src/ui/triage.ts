import type { TriageCache } from "../domain/workspace";
import type { TriageItem } from "../domain/triage";
import { escapeHtml, renderBadge } from "./primitives";

function safeGitHubUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com" ? url.href : "#";
  } catch {
    return "#";
  }
}

function renderItem(item: TriageItem): string {
  const kind = item.kind === "pull-request" ? "Pull request" : "Issue";
  const reasons = item.reasons.length ? item.reasons.join(" · ") : "Recently updated";
  return `<li class="triage-item">
    <div class="triage-score" aria-label="Priority score ${item.priority}">${item.priority}</div>
    <div class="triage-main">
      <div class="triage-kicker"><span>${escapeHtml(item.repositoryFullName)}</span><span>·</span><span>${kind} #${item.number}</span></div>
      <a href="${escapeHtml(safeGitHubUrl(item.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>
      <small>${escapeHtml(reasons)}</small>
    </div>
    ${renderBadge(item.draft ? "Draft" : kind, item.draft ? "warning" : "accent")}
  </li>`;
}

function formatSyncTime(value: string | null): string {
  if (!value) return "Not synced yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown sync time";
  return `Synced ${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)}`;
}

export function renderTriage(cache: TriageCache, status: string, isSyncing = false): string {
  const owner = escapeHtml(cache.owner ?? "");
  const content = cache.items.length
    ? `<ol class="triage-list">${cache.items.slice(0, 10).map(renderItem).join("")}</ol>`
    : `<div class="triage-empty"><strong>No open work in the queue</strong><p>Connect a GitHub account to rank open issues and pull requests from its recently active public repositories.</p></div>`;

  return `<section class="panel triage-panel" id="triage" aria-labelledby="triage-title">
    <div class="panel-header triage-header">
      <div><p class="eyebrow">GITHUB TRIAGE</p><h2 id="triage-title">What needs attention?</h2></div>
      ${renderBadge(`${cache.items.length} open`)}
    </div>
    <form id="github-form" class="github-form">
      <label for="github-owner">GitHub user or organization</label>
      <div><input id="github-owner" name="owner" value="${owner}" maxlength="39" autocomplete="off" placeholder="e.g. PECADRO" required /><button type="submit"${isSyncing ? " disabled" : ""}>${isSyncing ? "Syncing…" : "Sync GitHub"}</button></div>
      <p id="github-status" class="sync-status" aria-live="polite">${escapeHtml(status || formatSyncTime(cache.lastSyncedAt))}</p>
    </form>
    ${content}
  </section>`;
}
