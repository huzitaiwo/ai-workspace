/* ==========================================================================
   Dashboard — greeting, lists (skeleton → content → empty), usage donut.
   Add ?state=empty to the URL to preview the empty states.
   ========================================================================== */
(() => {
  const init = () => {
    const { data, esc, icon, toast } = window.aiwApp;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const emptyDemo =
      new URLSearchParams(location.search).get("state") === "empty";
    const $ = (sel) => document.querySelector(sel);

    /* ---------- Header ---------- */
    const now = new Date();
    const hour = now.getHours();
    const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    $("[data-date]").textContent = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    $("[data-greeting]").textContent = `Good ${part}, ${data.owner}.`;

    /* ---------- Templates ---------- */
    const skRow = () => `<li class="row" aria-hidden="true">
      <span class="skeleton" style="width:2.25rem;height:2.25rem;border-radius:.65rem"></span>
      <span class="row__body"><span class="skeleton" style="width:55%;height:.75rem"></span><span class="skeleton" style="width:35%;height:.6rem;margin-top:.5rem"></span></span></li>`;
    const skCard = () =>
      `<div class="project-card" aria-hidden="true"><span class="skeleton" style="width:60%;height:2.1rem"></span><span class="skeleton" style="height:.4rem"></span></div>`;
    const skeletons = {
      sessions: `<ul class="row-list">${skRow().repeat(3)}</ul>`,
      documents: `<ul class="row-list">${skRow().repeat(3)}</ul>`,
      projects: `<div class="project-grid">${skCard().repeat(3)}</div>`,
    };

    const empty = (ic, tint, heading, text, label, href) => `
      <div class="empty"><span class="tile tile--${tint}">${icon(ic)}</span><h3>${heading}</h3><p>${text}</p>
      <a class="btn btn--primary btn--sm" href="${href}">${label} ${icon("arrow", "icon--arrow")}</a></div>`;

    const sessionRow = (s) => `<li><a class="row" href="chat.html?id=${s.id}">
      <span class="tile tile--${s.tint}">${icon("chat")}</span>
      <span class="row__body"><strong>${esc(s.title)}</strong><span>${esc(s.stage)} · ${data.ago(s.updated)}</span></span>
      <span class="tag">${esc(s.tag)}</span>${icon("chevron-right", "row__go")}</a></li>`;

    const docRow = (d) => `<li><a class="row" href="documents.html?id=${d.id}">
      <span class="file-chip" aria-hidden="true">${esc(d.ext)}</span>
      <span class="row__body"><strong>${esc(d.name)}</strong><span${d.status === "processing" ? ' class="is-processing"' : ""}>${d.status === "processing" ? "Processing source" : "Ready for analysis"}</span></span>
      ${icon("chevron-right", "row__go")}</a></li>`;

    const projectCard = (
      p,
    ) => `<a class="project-card" href="projects.html?id=${p.id}">
      <span class="project-card__top"><span class="tile tile--${p.tint}">${icon("folder")}</span><span><strong>${esc(p.title)}</strong><small>${esc(p.meta)}</small></span></span>
      <span class="project-card__progress"><span class="meter" role="img" aria-label="${p.progress}% complete" style="--value:${p.progress}%"><span></span></span><span aria-hidden="true">${p.progress}%</span></span></a>`;

    const content = {
      sessions: () =>
        emptyDemo || !data.sessions.length
          ? empty(
              "chat",
              "coral",
              "Nothing to continue yet",
              "Start a conversation and it will appear here, ready to pick up in one click.",
              "New conversation",
              "chat.html",
            )
          : `<ul class="row-list">${data.sessions.map(sessionRow).join("")}</ul>`,
      documents: () =>
        emptyDemo || !data.documents.length
          ? empty(
              "doc",
              "sand",
              "No documents yet",
              "Upload a PDF, Word file, or spreadsheet to summarize it and ask questions with sources.",
              "Upload a document",
              "documents.html?action=upload",
            )
          : `<ul class="row-list">${data.documents.slice(0, 3).map(docRow).join("")}</ul>`,
      projects: () =>
        emptyDemo || !data.projects.length
          ? empty(
              "folder",
              "mint",
              "No projects yet",
              "Projects gather conversations, files, and instructions so every answer has the right context.",
              "Create a project",
              "projects.html?new=1",
            )
          : `<div class="project-grid">${data.projects.map(projectCard).join("")}</div>`,
    };

    const slots = document.querySelectorAll("[data-list]");
    slots.forEach((slot) => {
      slot.setAttribute("aria-busy", "true");
      slot.innerHTML = skeletons[slot.dataset.list];
    });
    setTimeout(
      () => {
        slots.forEach((slot) => {
          slot.innerHTML = content[slot.dataset.list]();
          slot.removeAttribute("aria-busy");
        });
      },
      reduceMotion ? 0 : 450,
    );

    /* ---------- Activity ---------- */
    const activity = $("[data-activity]");
    if (emptyDemo || !data.activity.length) {
      activity.innerHTML =
        "<li><span>No activity yet. When teammates add sources, comment, or update drafts, it appears here.</span></li>";
    } else {
      activity.innerHTML = data.activity
        .map(
          (a) => `<li>
        <span class="tile tile--${a.tint}">${icon("clock")}</span>
        <div><strong>${esc(a.actor)} ${esc(a.action)}</strong><span>${esc(a.detail)}</span></div></li>`,
        )
        .join("");
    }

    /* ---------- Usage donut ---------- */
    const u = data.usage;
    const circ = 314.16;
    const ring = $("[data-ring]");
    const paint = () => {
      ring.style.setProperty("--offset", String(circ * (1 - u.percent / 100)));
      $("[data-percent]").textContent = u.percent;
      $("[data-responses]").textContent = u.responses;
      $("[data-documents-read]").textContent = u.documentsRead;
      $("[data-reports-made]").textContent = u.reportsMade;
      $("[data-donut]").setAttribute(
        "aria-label",
        `${u.percent} percent of this month's usage used`,
      );
    };
    paint();

    const refresh = $("[data-usage-refresh]");
    if (refresh)
      refresh.addEventListener("click", () => {
        ring.style.animation = "none";
        void ring.getBoundingClientRect();
        ring.style.animation = "";
        toast("Usage refreshed.");
      });
  };

  if (window.aiwApp) init();
  else document.addEventListener("aiwapp:ready", init, { once: true });
})();
