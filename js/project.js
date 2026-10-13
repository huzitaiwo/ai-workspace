/* Project detail — conversations + documents tabs, editable instructions,
   rename / archive / delete.  Edits are saved in the browser (aiw-project-<id>). */
(() => {
  const init = () => {
    const { data, esc, icon, toast } = window.aiwApp;
    const $ = (s) => document.querySelector(s);
    const id = new URLSearchParams(location.search).get("id");
    const project = data.projects.find((p) => p.id === id);

    if (!project) {
      $("[data-notfound]").hidden = false;
      return;
    }
    $("[data-found]").hidden = false;

    const save = (patch) => {
      Object.assign(project, patch);
      let o = {};
      try {
        o = JSON.parse(localStorage.getItem("aiw-project-" + id)) || {};
      } catch (e) {}
      try {
        localStorage.setItem(
          "aiw-project-" + id,
          JSON.stringify({ ...o, ...patch }),
        );
      } catch (e) {}
    };

    /* ---------- Header ---------- */
    const head = () => {
      $("[data-title]") && 0;
      document.querySelector("#main h1").textContent = project.title;
      document.title = `${project.title} — AI Workspace`;
      $("[data-tag]").textContent = project.tag;
      $("[data-meta]").textContent = `${project.meta} · Updated recently`;
      $("[data-archive-label]").textContent = project.archived
        ? "Unarchive project"
        : "Archive project";
      $("[data-new-chat]").href = `chat.html?new=1&project=${project.id}`;
    };
    head();

    /* ---------- Tabs ---------- */
    const conv = [...data.sessions, ...data.conversations].filter(
      (c, i, a) => c.project === id && a.findIndex((x) => x.id === c.id) === i,
    );
    const docs = data.documents.filter((d) => d.project === id);
    const panel = $("[data-panel]");
    const tabs = [...document.querySelectorAll('[role="tab"]')];

    const rowConv = (c) =>
      `<li><a class="row" href="chat.html?id=${c.id}"><span class="tile tile--coral">${icon("chats")}</span><span class="row__body"><strong>${esc(c.title)}</strong><span>Updated recently</span></span>${icon("chevron-right", "row__go")}</a></li>`;
    const rowDoc = (d) =>
      `<li><a class="row" href="documents.html?id=${d.id}"><span class="file-chip" aria-hidden="true">${esc(d.ext)}</span><span class="row__body"><strong>${esc(d.name)}</strong><span>${d.status === "ready" ? "Ready for analysis" : "Processing source"} · ${esc(d.size)}</span></span>${icon("chevron-right", "row__go")}</a></li>`;
    const empty = (ic, h, p, label, href) =>
      `<div class="empty"><span class="tile tile--mint">${icon(ic)}</span><h3>${h}</h3><p>${p}</p><a class="btn btn--primary btn--sm" href="${href}">${label} ${icon("arrow", "icon--arrow")}</a></div>`;

    const views = {
      conversations: () =>
        conv.length
          ? `<ul class="row-list">${conv.map(rowConv).join("")}</ul>`
          : empty(
              "chats",
              "No conversations yet",
              "Start one and it will use this project’s instructions and sources.",
              "New conversation",
              `chat.html?new=1&project=${id}`,
            ),
      documents: () =>
        docs.length
          ? `<ul class="row-list">${docs.map(rowDoc).join("")}</ul>`
          : empty(
              "doc",
              "No documents yet",
              "Upload sources and assign them to this project so answers can cite them.",
              "Upload a document",
              "documents.html?action=upload",
            ),
    };
    $("[data-count-conv]").textContent = conv.length;
    $("[data-count-docs]").textContent = docs.length;

    function select(tab, focus) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panel.setAttribute("aria-labelledby", tab.id);
      panel.innerHTML = views[tab.dataset.tab]();
      if (focus) tab.focus();
    }
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        const n = {
          ArrowRight: i + 1,
          ArrowLeft: i - 1,
          Home: 0,
          End: tabs.length - 1,
        }[e.key];
        if (n === undefined) return;
        e.preventDefault();
        select(tabs[(n + tabs.length) % tabs.length], true);
      });
    });
    select(tabs[0]);

    /* ---------- Instructions ---------- */
    const box = $("[data-instructions]");
    const saveBtn = $("[data-save-ins]");
    const count = $("[data-ins-count]");
    box.value = project.instructions || "";
    let savedText = box.value;
    const sync = () => {
      saveBtn.disabled = box.value === savedText;
      count.textContent = `${box.value.length} characters`;
    };
    box.addEventListener("input", sync);
    saveBtn.addEventListener("click", () => {
      savedText = box.value.trim();
      box.value = savedText;
      save({ instructions: savedText });
      sync();
      toast(
        savedText
          ? "Instructions saved. New conversations in this project will use them."
          : "Instructions cleared.",
      );
    });
    $("[data-reset-ins]").addEventListener("click", () => {
      box.value = project.defaultInstructions || "";
      box.dispatchEvent(new Event("input"));
      box.focus();
    });
    sync();

    /* ---------- Menu actions: rename / archive / delete ---------- */
    const rename = $("#rename-dialog"),
      del = $("#delete-dialog");
    const nameInput = $("[data-rename-input]");
    const nameField = nameInput.closest(".field");
    document
      .querySelectorAll("dialog [data-dialog-close]")
      .forEach((b) =>
        b.addEventListener("click", () => b.closest("dialog").close()),
      );
    [rename, del].forEach((d) =>
      d.addEventListener("click", (e) => {
        if (e.target === d) d.close();
      }),
    );

    $("#menu-project").addEventListener("click", (e) => {
      const act = (e.target.closest("[data-act]") || {}).dataset;
      if (!act) return;
      if (act.act === "rename") {
        nameInput.value = project.title;
        nameField.classList.remove("field--invalid");
        rename.showModal();
        nameInput.select();
      } else if (act.act === "archive") {
        const archived = !project.archived;
        save({
          archived,
          tag: archived ? "Archived" : project.baseTag || "Active",
        });
        head();
        toast(archived ? "Project archived." : "Project restored.");
      } else if (act.act === "delete") {
        $("[data-delete-name]").textContent = project.title;
        del.showModal();
      }
    });

    $("[data-rename-form]").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = nameInput.value.trim();
      if (v.length < 2 || v.length > 40) {
        nameField.classList.add("field--invalid");
        nameField.querySelector("[data-error-text]").textContent =
          "Give the project a name between 2 and 40 characters.";
        return nameInput.focus();
      }
      save({ title: v });
      head();
      rename.close();
      toast("Project renamed.");
    });

    $("[data-confirm-delete]").addEventListener("click", () => {
      save({ deleted: true });
      del.close();
      toast(`${project.title} deleted.`);
      setTimeout(
        () => {
          location.href = "projects.html";
        },
        reduceMotion() ? 0 : 700,
      );
    });
    function reduceMotion() {
      return matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  };
  if (window.aiwApp) init();
  else document.addEventListener("aiwapp:ready", init, { once: true });
})();
