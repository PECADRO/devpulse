import { addFocusItem, removeFocusItem, toggleFocusItem } from "./domain/focus";
import { loadWorkspace, saveWorkspace } from "./domain/workspace";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root is missing");

let workspace = loadWorkspace(window.localStorage);

function persist(): void {
  saveWorkspace(window.localStorage, workspace);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character] ?? character);
}

function render(): void {
  const completed = workspace.focusItems.filter(item => item.done).length;
  const open = workspace.focusItems.length - completed;

  app!.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <a class="brand" href="#home" aria-label="DevPulse home"><span class="brand-mark">D<span></span></span><span>DevPulse</span></a>
        <span class="topbar-note">A calmer way to ship software</span>
        <span class="local-badge"><span class="status-dot"></span> Local workspace</span>
      </header>
      <main id="home">
        <section class="hero" aria-labelledby="page-title">
          <div>
            <p class="eyebrow">YOUR DEVELOPMENT WORKSPACE</p>
            <h1 id="page-title">Make progress<br /><em>that matters.</em></h1>
            <p class="hero-copy">Keep the next useful step in sight. DevPulse gives your priorities a calm, private home and leaves room for the repository signals that shape your work.</p>
            <a class="hero-link" href="#focus">Plan your next move <span aria-hidden="true">↗</span></a>
          </div>
          <div class="hero-visual" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="pulse-core">D</div><div class="tiny-star star-one">✦</div><div class="tiny-star star-two">✦</div></div>
        </section>

        <section class="overview" aria-label="Workspace overview">
          <div class="section-heading"><div><p class="eyebrow">OVERVIEW</p><h2>Today, at a glance</h2></div><span class="date-label">${new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</span></div>
          <div class="metrics">
            <article class="metric"><span class="metric-icon purple">↗</span><p>Open priorities</p><strong>${open}</strong><small>Keep the list intentional</small></article>
            <article class="metric"><span class="metric-icon green">✓</span><p>Completed</p><strong>${completed}</strong><small>Every finished step counts</small></article>
            <article class="metric"><span class="metric-icon amber">◈</span><p>Connected repos</p><strong>—</strong><small>GitHub integration is next</small></article>
          </div>
        </section>

        <section class="workspace-grid">
          <div class="panel focus-panel" id="focus">
            <div class="panel-header"><div><p class="eyebrow">FOCUS BOARD</p><h2>What will you move forward?</h2></div><span class="pill">${open} open</span></div>
            <form id="focus-form" class="focus-form"><label class="sr-only" for="focus-title">New focus item</label><input id="focus-title" name="title" maxlength="120" placeholder="Add a meaningful next step…" required /><button type="submit">Add task <span aria-hidden="true">→</span></button></form>
            ${workspace.focusItems.length ? `<ul class="task-list">${workspace.focusItems.map(item => `<li class="task ${item.done ? "is-done" : ""}"><button class="check" type="button" data-action="toggle" data-id="${escapeHtml(item.id)}" aria-label="${item.done ? "Mark incomplete" : "Mark complete"}: ${escapeHtml(item.title)}">${item.done ? "✓" : ""}</button><span>${escapeHtml(item.title)}</span><button class="remove" type="button" data-action="remove" data-id="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.title)}">×</button></li>`).join("")}</ul>` : `<div class="empty-state"><div class="empty-icon">✦</div><h3>Start with one clear step</h3><p>Add a priority above. Your list stays on this device and is ready when you come back.</p></div>`}
          </div>
          <aside class="panel workspace-panel"><p class="eyebrow">WORKSPACE</p><h2>Built around the way you ship.</h2><p>A useful developer workspace starts with focus and brings supporting signals into view only when they help.</p><div class="workspace-points"><div><span>01</span><strong>Plan with intention</strong><small>Private focus board</small></div><div><span>02</span><strong>Understand your repos</strong><small>Activity and issue context</small></div><div><span>03</span><strong>See delivery clearly</strong><small>Health signals and insights</small></div></div><span class="workspace-note">Local-first by design</span></aside>
        </section>
      </main>
      <footer>DevPulse <span>·</span> Build steadily. Ship thoughtfully.</footer>
    </div>`;

  app!.querySelector<HTMLFormElement>("#focus-form")?.addEventListener("submit", event => {
    event.preventDefault();
    const input = app!.querySelector<HTMLInputElement>("#focus-title");
    if (!input) return;
    workspace.focusItems = addFocusItem(workspace.focusItems, input.value, crypto.randomUUID(), new Date().toISOString());
    persist();
    render();
    app!.querySelector<HTMLInputElement>("#focus-title")?.focus();
  });
  app!.querySelectorAll<HTMLButtonElement>("[data-action]").forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.id;
    if (!id) return;
    workspace.focusItems = button.dataset.action === "toggle"
      ? toggleFocusItem(workspace.focusItems, id)
      : removeFocusItem(workspace.focusItems, id);
    persist();
    render();
  }));
}

render();
