import { describe, expect, it } from "vitest";
import type { TriageCache } from "../domain/workspace";
import { renderTriage } from "./triage";

const cache: TriageCache = {
  owner: "octocat",
  lastSyncedAt: "2026-10-15T10:30:00Z",
  items: [{
    kind: "issue",
    id: 1,
    number: 7,
    title: "Repair navigation",
    url: "https://github.com/octocat/devpulse/issues/7",
    repositoryFullName: "octocat/devpulse",
    labels: ["bug"],
    comments: 2,
    draft: false,
    createdAt: "2026-10-01T10:00:00Z",
    updatedAt: "2026-10-14T10:00:00Z",
    priority: 29,
    reasons: ["bug label", "active discussion"],
  }],
};

describe("triage view", () => {
  it("renders a ranked, linked queue and sync owner", () => {
    const html = renderTriage(cache, "");
    expect(html).toContain('value="octocat"');
    expect(html).toContain("Repair navigation");
    expect(html).toContain("Priority score 29");
    expect(html).toContain("bug label · active discussion");
  });

  it("escapes remote content and blocks non-GitHub links", () => {
    const html = renderTriage({
      ...cache,
      owner: '"><script>',
      items: [{ ...cache.items[0], title: "<img src=x>", url: "javascript:alert(1)" }],
    }, "<b>failed</b>");
    expect(html).toContain('href="#"');
    expect(html).toContain("&lt;img src=x&gt;");
    expect(html).toContain("&lt;b&gt;failed&lt;/b&gt;");
    expect(html).not.toContain("<script>");
  });

  it("renders a useful empty state", () => {
    const html = renderTriage({ owner: null, items: [], lastSyncedAt: null }, "");
    expect(html).toContain("No open work in the queue");
    expect(html).toContain("Not synced yet");
  });
});
