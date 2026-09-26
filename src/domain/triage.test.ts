import { describe, expect, it } from "vitest";
import type { GitHubIssue, GitHubPullRequest } from "../integrations/github";
import { buildTriageQueue } from "./triage";

const baseIssue: GitHubIssue = {
  id: 1,
  number: 12,
  title: "Fix keyboard navigation",
  url: "https://github.com/octocat/devpulse/issues/12",
  repositoryFullName: "octocat/devpulse",
  labels: [],
  comments: 0,
  createdAt: "2026-09-20T12:00:00Z",
  updatedAt: "2026-09-25T12:00:00Z",
};

describe("triage queue", () => {
  it("puts urgent labeled work ahead and explains the ranking", () => {
    const urgent = { ...baseIssue, id: 2, labels: [{ name: "security", color: "d73a4a" }] };
    const queue = buildTriageQueue([baseIssue, urgent], [], new Date("2026-09-26T12:00:00Z"));

    expect(queue.map(item => item.id)).toEqual([2, 1]);
    expect(queue[0]).toMatchObject({ priority: 50, reasons: ["security label"] });
  });

  it("prioritizes review-ready pull requests over drafts", () => {
    const ready: GitHubPullRequest = { ...baseIssue, id: 3, draft: false };
    const draft: GitHubPullRequest = { ...baseIssue, id: 4, draft: true };
    const queue = buildTriageQueue([], [draft, ready], new Date("2026-09-26T12:00:00Z"));

    expect(queue.map(item => item.id)).toEqual([3, 4]);
    expect(queue[0].reasons).toContain("ready for review");
  });

  it("uses discussion and waiting time as bounded tie breakers", () => {
    const older = { ...baseIssue, id: 5, comments: 30, createdAt: "2026-06-01T12:00:00Z" };
    const queue = buildTriageQueue([baseIssue, older], [], new Date("2026-09-26T12:00:00Z"));

    expect(queue[0]).toMatchObject({ id: 5, priority: 22 });
    expect(queue[0].reasons).toEqual(["active discussion", "waiting for attention"]);
  });

  it("rejects an invalid reference date", () => {
    expect(() => buildTriageQueue([], [], new Date("invalid"))).toThrow("valid current date");
  });
});
