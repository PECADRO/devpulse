import { describe, expect, it } from "vitest";
import { escapeHtml, renderBadge, renderFocusItem, renderMetricCard } from "./primitives";

describe("UI primitives", () => {
  it("escapes text before inserting it into markup", () => {
    expect(escapeHtml(`<script data-value="x">'&'</script>`))
      .toBe("&lt;script data-value=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/script&gt;");
  });

  it("renders badges and metrics with semantic tone classes", () => {
    expect(renderBadge("4 open", "accent")).toContain('class="badge badge--accent"');
    const metric = renderMetricCard({ icon: "✓", label: "Completed", value: 4, detail: "Today", tone: "success" });
    expect(metric).toContain('class="metric-icon success"');
    expect(metric).toContain("<strong>4</strong>");
  });

  it("renders focus items safely with accessible actions", () => {
    const html = renderFocusItem({
      id: 'task"1',
      title: "Review <unsafe> change",
      done: true,
      createdAt: "2026-09-24T00:00:00Z",
    });

    expect(html).toContain('class="task is-done"');
    expect(html).toContain("Review &lt;unsafe&gt; change");
    expect(html).toContain("Mark incomplete");
    expect(html).not.toContain("<unsafe>");
  });
});
