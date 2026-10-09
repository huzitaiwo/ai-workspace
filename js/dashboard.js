/* ==========================================================================
   Dashboard — greeting, ask box, tabs with loading/empty states,
   usage, activity.  Add ?state=empty to the URL to preview the empty state.
   ========================================================================== */
(() => {
  const init = () => {
    const { data, esc, icon } = window.aiwApp;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const emptyDemo =
      new URLSearchParams(location.search).get("state") === "empty";

    /* ---------- Greeting ---------- */
    const hour = new Date().getHours();
    const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    document.querySelector("[data-greeting]").textContent =
      `Good ${part}, ${data.owner}.`;

    /* ---------- Ask box ---------- */
    const form = document.querySelector("[data-ask]");
    const box = form.elements.prompt;
    const error = form.querySelector("[data-ask-error]");
    const resize = () => {
      box.style.height = "auto";
      box.style.height = Math.min(box.scrollHeight, 192) + "px";
    };
    box.addEventListener("input", () => {
      resize();
      error.hidden = true;
    });
    box.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        form.requestSubmit();
      }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = box.value.trim();
      if (!text) {
        error.hidden = false;
        box.focus();
        return;
      }
      location.href = `chat.html?model=${encodeURIComponent(form.elements.model.value)}&prompt=${encodeURIComponent(text)}`;
    });

    /* ---------- Continue working ---------- */
    const list = document.querySelector("[data-work-list]");
    const status = document.querySelector("[data-work-status]");
    const tabs = [...document.querySelectorAll("[data-tab]")];
    const T = data.types;

    const source = emptyDemo
      ? { conversations: [], projects: [], documents: [], reports: [] }
      : data;
    const items = [
      ...source.conversations.map((i) => ({
        ...i,
        type: "conversation",
        meta: `${i.project} · ${data.ago(i.updated)}`,
      })),
      ...source.projects.map((i) => ({
        ...i,
        type: "project",
        meta: `${i.sources} sources · Updated ${data.ago(i.updated)}`,
      })),
      ...source.documents.map((i) => ({
        ...i,
        type: "document",
        meta: `${i.ext.toUpperCase()} · ${i.size} · ${data.ago(i.updated)}`,
        badge: i.status === "processing" ? ["warn", "Processing"] : null,
      })),
      ...source.reports.map((i) => ({
        ...i,
        type: "report",
        meta: `${i.project} · ${data.ago(i.updated)}`,
        badge: i.status === "draft" ? ["", "Draft"] : null,
      })),
    ].sort((a, b) => a.updated - b.updated);

    const emptyCopy = {
      all: [
        "Nothing to continue yet",
        "Start a conversation, upload a document, or create a project. Your recent work appears here so you can pick it up in one click.",
        "New conversation",
        "chat.html",
        "plus",
      ],
      conversation: [
        "No conversations yet",
        "Conversations keep questions and answers together with their sources, so you can return to them later.",
        "New conversation",
        "chat.html",
        "chat",
      ],
      project: [
        "No projects yet",
        "Projects gather conversations, files, and instructions for one piece of work, giving every answer the right context.",
        "Create a project",
        "projects.html?new=1",
        "folder",
      ],
      document: [
        "No documents yet",
        "Upload a PDF, Word file, or spreadsheet to summarize it, ask questions, and find risks with sources.",
        "Upload a document",
        "documents.html?action=upload",
        "upload",
      ],
      report: [
        "No reports yet",
        "Reports turn selected sources into a structured summary with findings and recommendations.",
        "Generate a report",
        "reports.html?new=1",
        "report",
      ],
    };

    const card = (i, showType) => {
      const t = T[i.type];
      const badge = i.badge
        ? `<span class="badge ${i.badge[0] ? "badge--" + i.badge[0] : ""}">${i.badge[1]}</span>`
        : showType
          ? `<span class="badge">${t.label}</span>`
          : "";
      return `<li><a class="work-card" href="${t.href(i.id)}">
        <span class="tile tile--${t.tint}">${icon(t.icon)}</span>
        <span class="work-card__body"><h3>${esc(i.title)}</h3><p>${esc(i.meta)}</p></span>${badge}
      </a></li>`;
    };
    const skeleton =
      () => `<li class="work-card work-card--skeleton" aria-hidden="true">
        <span class="skeleton" style="width:2.5rem;height:2.5rem;border-radius:.7rem"></span>
        <span class="work-card__body"><span class="skeleton" style="display:block;width:70%;height:.8rem"></span><span class="skeleton" style="display:block;width:45%;height:.65rem;margin-top:.55rem"></span></span>
      </li>`;

    function render(filter) {
      const shown = (
        filter === "all" ? items : items.filter((i) => i.type === filter)
      ).slice(0, 8);
      list.removeAttribute("aria-busy");
      if (!shown.length) {
        const [h, p, label, href, ic] = emptyCopy[filter];
        list.className = "";
        list.innerHTML = `<li class="empty"><span class="tile tile--mint">${icon(ic)}</span><h3>${h}</h3><p>${p}</p><a class="btn btn--primary btn--sm" href="${href}">${label} ${icon("arrow", "icon--arrow")}</a></li>`;
        status.textContent = h;
        return;
      }
      list.className = "work-grid";
      list.innerHTML = shown.map((i) => card(i, filter === "all")).join("");
      status.textContent = `${shown.length} item${shown.length === 1 ? "" : "s"}`;
    }

    function select(tab, focus = false) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", on);
        t.tabIndex = on ? 0 : -1;
      });
      if (focus) tab.focus();
      list.setAttribute("aria-labelledby", tab.id);
      render(tab.dataset.tab);
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (e) => {
        const move = {
          ArrowRight: i + 1,
          ArrowLeft: i - 1,
          Home: 0,
          End: tabs.length - 1,
        }[e.key];
        if (move === undefined) return;
        e.preventDefault();
        select(tabs[(move + tabs.length) % tabs.length], true);
      });
    });

    /* initial load: skeleton → content */
    list.className = "work-grid";
    list.setAttribute("aria-busy", "true");
    list.innerHTML = Array.from({ length: 6 }, skeleton).join("");
    tabs[0].tabIndex = 0;
    setTimeout(() => select(tabs[0]), reduceMotion ? 0 : 550);

    /* ---------- Usage ---------- */
    const u = data.usage;
    const used = u.creditsTotal - u.creditsLeft;
    document.querySelector("[data-credits-left]").textContent =
      (u.creditsLeft / 1000).toFixed(1).replace(".0", "") + "k";
    document.querySelector("[data-credits-caption]").textContent =
      `${used.toLocaleString()} of ${u.creditsTotal.toLocaleString()} credits used this cycle`;
    document
      .querySelector("[data-meter]")
      .style.setProperty("--value", `${(used / u.creditsTotal) * 100}%`);
    document.querySelector("[data-docs]").textContent = u.documents;
    document.querySelector("[data-reports]").textContent = u.reports;
    document.querySelector("[data-bars]").innerHTML = u.days
      .map(([, v], n) => `<span style="--h:${v}%;--n:${n}"></span>`)
      .join("");
    document.querySelector("[data-days]").innerHTML = u.days
      .map(([d]) => `<span>${d}</span>`)
      .join("");

    /* ---------- Activity ---------- */
    const activity = document.querySelector("[data-activity]");
    if (emptyDemo) {
      activity.outerHTML =
        '<p class="activity__empty">No activity yet. When you create projects, upload documents, or generate reports, a timeline of what happened appears here.</p>';
    } else {
      activity.innerHTML = data.activity
        .map(
          (a) => `<li>
        <span class="tile tile--${a.tint}">${icon(a.icon)}</span>
        <div><p>${esc(a.verb)} <strong>${esc(a.subject)}</strong></p><time>${data.ago(a.updated)}</time></div>
      </li>`,
        )
        .join("");
    }
  };

  if (window.aiwApp) init();
  else document.addEventListener("aiwapp:ready", init, { once: true });
})();
