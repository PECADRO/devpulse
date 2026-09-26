import type { GitHubIssue, GitHubPullRequest } from "../integrations/github";

export type TriageItemKind = "issue" | "pull-request";

export interface TriageItem {
  kind: TriageItemKind;
  id: number;
  number: number;
  title: string;
  url: string;
  repositoryFullName: string;
  labels: string[];
  comments: number;
  draft: boolean;
  createdAt: string;
  updatedAt: string;
  priority: number;
  reasons: string[];
}

const IMPORTANT_LABELS = new Map([
  ["security", 50],
  ["critical", 40],
  ["bug", 25],
  ["regression", 25],
  ["high priority", 20],
  ["priority: high", 20],
]);

function ageInDays(createdAt: string, now: Date): number {
  const created = new Date(createdAt);
  if (!Number.isFinite(created.getTime())) return 0;
  return Math.max(0, Math.floor((now.getTime() - created.getTime()) / 86_400_000));
}

function scoreItem(item: GitHubIssue, kind: TriageItemKind, draft: boolean, now: Date) {
  let priority = 0;
  const reasons: string[] = [];

  for (const label of item.labels) {
    const weight = IMPORTANT_LABELS.get(label.name.trim().toLowerCase());
    if (weight) {
      priority += weight;
      reasons.push(`${label.name} label`);
    }
  }

  if (kind === "pull-request" && !draft) {
    priority += 15;
    reasons.push("ready for review");
  }

  const discussionWeight = Math.min(item.comments, 10);
  if (discussionWeight > 0) {
    priority += discussionWeight;
    reasons.push("active discussion");
  }

  const ageWeight = Math.min(Math.floor(ageInDays(item.createdAt, now) / 7), 12);
  if (ageWeight > 0) {
    priority += ageWeight;
    reasons.push("waiting for attention");
  }

  if (draft) priority -= 10;

  return { priority, reasons };
}

function toTriageItem(
  item: GitHubIssue,
  kind: TriageItemKind,
  draft: boolean,
  now: Date,
): TriageItem {
  const score = scoreItem(item, kind, draft, now);
  return {
    kind,
    id: item.id,
    number: item.number,
    title: item.title,
    url: item.url,
    repositoryFullName: item.repositoryFullName,
    labels: item.labels.map(label => label.name),
    comments: item.comments,
    draft,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    priority: score.priority,
    reasons: score.reasons,
  };
}

export function buildTriageQueue(
  issues: readonly GitHubIssue[],
  pullRequests: readonly GitHubPullRequest[],
  now = new Date(),
): TriageItem[] {
  if (!Number.isFinite(now.getTime())) throw new Error("Triage requires a valid current date.");

  return [
    ...issues.map(issue => toTriageItem(issue, "issue", false, now)),
    ...pullRequests.map(pullRequest => toTriageItem(pullRequest, "pull-request", pullRequest.draft, now)),
  ].sort((left, right) =>
    right.priority - left.priority ||
    Date.parse(right.updatedAt) - Date.parse(left.updatedAt) ||
    left.id - right.id
  );
}
