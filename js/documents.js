/* ==========================================================================
   Documents — search, status/project filters, selection, row menu,
   upload (picker + drag & drop) with processing states, rename, delete.
   Preview: ?state=empty · ?action=upload · ?action=analyze
   ========================================================================== */
(() => {
  const init = () => {
    const { data, esc, icon, toast } = window.aiwApp;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const params = new URLSearchParams(location.search);
    const $ = (s) => document.querySelector(s);

    const projectName = (id) =>
      (data.projects.find((p) => p.id === id) || {}).title || "No project";
    let docs =
      params.get("state") === "empty"
        ? []
        : data.documents.map((d) => ({ ...d }));
    const state = {
      selected: docs[0] ? docs[0].id : null,
      query: "",
      status: "all",
      project: "all",
      open: null,
    };

    const wantedId = params.get("id");
    if (wantedId && docs.some((d) => d.id === wantedId))
      state.selected = wantedId;

    const el = {
      body: $("[data-rows]"),
      card: $("[data-docs-card]"),
      count: $("[data-count]"),
      live: $("[data-docs-status]"),
      search: $("[data-search]"),
      panel: $("[data-panel-body]"),
      upload: $("[data-upload]"),
      file: $("[data-file]"),
      statusMenu: $("#menu-status"),
      projectMenu: $("#menu-projects"),
      statusBtn: $("[data-status-btn]"),
      projectLabel: $("[data-project-label]"),
      rowMenu: $("#row-menu"),
      rename: $("#rename-dialog"),
      renameForm: $("[data-rename-form]"),
      del: $("#delete-dialog"),
    };

    /* ---------- Analysis (illustrative) ---------- */
    const analysis = (d) => {
      if (d.status === "processing")
        return {
          note: "This source is still being processed. Analysis is available as soon as it’s ready.",
        };
      if (d.status === "failed")
        return {
          note: "This source couldn’t be processed. Choose Retry in the row menu to try again.",
        };
      if (d.id === "interview-synthesis")
        return {
          summary:
            "Twelve interviews describe a consistent pattern: participants lose momentum when navigation offers too many equal choices, want a visible route back to the original source, and see research, drafts, and follow-ups drift apart after workshops.",
          risks: [
            "Most quotes come from three interviews, so some themes may be over-weighted.",
            "No interview covers mobile navigation.",
          ],
          actions: [
            "Reduce top-level choices in the next prototype.",
            "Link every summary to its source.",
            "Interview two mobile participants.",
          ],
        };
      return {
        summary: `${d.name} is stored in ${projectName(d.project)}. Open a conversation to ask questions about it, with answers linked back to the source.`,
        risks: [
          "Nothing is flagged yet. Ask AI to look for gaps or conflicts in this source.",
        ],
        actions: [
          "Nothing is extracted yet. Ask AI to list the decisions and next steps it contains.",
        ],
      };
    };

    /* ---------- Filtering ---------- */
    const visible = () => {
      const q = state.query.trim().toLowerCase();
      return docs.filter(
        (d) =>
          (state.status === "all" || d.status === state.status) &&
          (state.project === "all" || d.project === state.project) &&
          (!q ||
            `${d.name} ${projectName(d.project)} ${d.owner}`
              .toLowerCase()
              .includes(q)),
      );
    };

    /* ---------- Rendering ---------- */
    const statusCell = (d) =>
      d.status === "ready"
        ? `<span class="status status--ready">${icon("check-circle")}Ready</span>`
        : d.status === "processing"
          ? `<span class="status status--processing">${icon("circle-dashed")}Processing</span>`
          : `<span class="status status--failed">${icon("alert")}Failed</span>`;

    const rowHtml = (d) => `
      <tr data-id="${d.id}" class="${d.id === state.selected ? "is-selected" : ""}">
        <td><div class="doc-name"><span class="file-chip" aria-hidden="true">${esc(d.ext)}</span>
          <div><button class="doc-select" type="button" data-select="${d.id}"${d.id === state.selected ? ' aria-current="true"' : ""}>${esc(d.name)}</button><small>${esc(d.size)}</small></div></div></td>
        <td>${esc(projectName(d.project))}</td><td>${esc(d.owner)}</td><td>${statusCell(d)}</td>
        <td class="col-act"><button class="icon-btn" type="button" aria-label="Actions for ${esc(d.name)}" aria-haspopup="menu" aria-expanded="false" data-row-menu="${d.id}">${icon("dots-v")}</button></td>
      </tr>`;

    const skRow = () =>
      `<tr aria-hidden="true"><td><div class="doc-name"><span class="skeleton" style="width:2rem;height:2rem"></span><span class="skeleton" style="width:9rem"></span></div></td><td><span class="skeleton" style="width:5rem"></span></td><td><span class="skeleton" style="width:4rem"></span></td><td><span class="skeleton" style="width:3.5rem"></span></td><td></td></tr>`;

    function renderTable() {
      const list = visible();
      el.count.textContent = `${list.length} document${list.length === 1 ? "" : "s"}`;
      if (!list.length) {
        const none = docs.length === 0;
        el.body.innerHTML = `<tr><td colspan="5" class="docs-empty"><div class="empty"><span class="tile tile--sand">${icon("doc")}</span><h3>${none ? "No sources yet" : "No documents match"}</h3><p>${none ? "Upload a PDF, DOCX, TXT, or CSV file. Its extracted text becomes available to your workspace AI." : "Try a different search, or clear the filters."}</p>${none ? `<button class="btn btn--primary btn--sm" type="button" data-upload-trigger>Upload source ${icon("arrow", "icon--arrow")}</button>` : '<button class="btn btn--secondary btn--sm" type="button" data-clear>Clear filters</button>'}</div></td></tr>`;
      } else {
        el.body.innerHTML = list.map(rowHtml).join("");
      }
      el.live.textContent = `${list.length} document${list.length === 1 ? "" : "s"} shown`;
    }

    function renderPanel() {
      const d = docs.find((x) => x.id === state.selected);
      if (!d) {
        el.panel.innerHTML =
          '<p class="doc-panel__sub" style="color:var(--text-muted)">Select a document to see its details and run analysis.</p>';
        return;
      }
      const a = analysis(d);
      const sections = [
        [
          "summarize",
          "Summarize",
          a.note ? `<p>${esc(a.note)}</p>` : `<p>${esc(a.summary)}</p>`,
        ],
        [
          "risks",
          "Find risks",
          a.note
            ? `<p>${esc(a.note)}</p>`
            : `<ul>${a.risks.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>`,
        ],
        [
          "actions",
          "Find action items",
          a.note
            ? `<p>${esc(a.note)}</p>`
            : `<ul>${a.actions.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>`,
        ],
      ];
      el.panel.innerHTML = `
        <div class="doc-panel__head"><span class="file-chip file-chip--lg" aria-hidden="true">SRC</span>
          <div><h2>${esc(d.name)}</h2><p class="doc-panel__sub">Stored source with extractable workspace context</p></div></div>
        <div class="ai-box"><span class="eyebrow">AI context</span><p>Live AI uses extracted source text only when the source belongs to the active workspace context.</p></div>
        <ul class="accordion doc-acc">${sections
          .map(
            ([k, label, content]) => `
          <li class="accordion__item"><h3><button class="accordion__trigger" type="button" id="acc-${k}" aria-expanded="${state.open === k}" aria-controls="accp-${k}">${icon("doc")}${label}${icon("chevron")}</button></h3>
          <div class="accordion__panel${state.open === k ? " is-open" : ""}" id="accp-${k}" role="region" aria-labelledby="acc-${k}"><div>${content}</div></div></li>`,
          )
          .join("")}</ul>`;
    }

    const renderAll = () => {
      renderTable();
      renderPanel();
    };

    /* ---------- Selection + accordion ---------- */
    function select(id) {
      if (state.selected === id) return;
      state.selected = id;
      state.open = null;
      el.body.querySelectorAll("tr[data-id]").forEach((tr) => {
        const on = tr.dataset.id === id;
        tr.classList.toggle("is-selected", on);
        const b = tr.querySelector(".doc-select");
        if (on) b.setAttribute("aria-current", "true");
        else b.removeAttribute("aria-current");
      });
      renderPanel();
    }
    el.body.addEventListener("click", (e) => {
      if (e.target.closest("[data-upload-trigger]")) return el.file.click();
      if (e.target.closest("[data-clear]")) {
        state.query = "";
        state.status = "all";
        state.project = "all";
        el.search.value = "";
        syncMenus();
        return renderTable();
      }
      const menuBtn = e.target.closest("[data-row-menu]");
      if (menuBtn) return openRowMenu(menuBtn);
      const tr = e.target.closest("tr[data-id]");
      if (tr) select(tr.dataset.id);
    });
    el.panel.addEventListener("click", (e) => {
      const t = e.target.closest(".accordion__trigger");
      if (!t) return;
      const key = t.id.replace("acc-", "");
      state.open = state.open === key ? null : key;
      el.panel.querySelectorAll(".accordion__trigger").forEach((b) => {
        const open = b.id === `acc-${state.open}`;
        b.setAttribute("aria-expanded", String(open));
        document
          .getElementById(b.getAttribute("aria-controls"))
          .classList.toggle("is-open", open);
      });
    });

    /* ---------- Search + filters ---------- */
    el.search.addEventListener("input", () => {
      state.query = el.search.value;
      renderTable();
    });

    const statuses = [
      ["all", "All statuses"],
      ["ready", "Ready"],
      ["processing", "Processing"],
      ["failed", "Failed"],
    ];
    function syncMenus() {
      el.statusMenu.innerHTML =
        '<p class="menu__label" aria-hidden="true">Status</p>' +
        statuses
          .map(
            ([id, label]) =>
              `<button class="menu__item" type="button" role="menuitemradio" aria-checked="${state.status === id}" data-status="${id}">${label}${icon("check", "icon--end")}</button>`,
          )
          .join("");
      const projectsList = [
        ["all", "All projects"],
        ...data.projects.map((p) => [p.id, p.title]),
      ];
      el.projectMenu.innerHTML =
        '<p class="menu__label" aria-hidden="true">Project</p>' +
        projectsList
          .map(
            ([id, label]) =>
              `<button class="menu__item" type="button" role="menuitemradio" aria-checked="${state.project === id}" data-project="${id}">${esc(label)}${icon("check", "icon--end")}</button>`,
          )
          .join("");
      el.projectLabel.textContent = (projectsList.find(
        ([id]) => id === state.project,
      ) || [])[1];
      el.statusBtn.classList.toggle("is-active", state.status !== "all");
    }
    el.statusMenu.addEventListener("click", (e) => {
      const i = e.target.closest("[data-status]");
      if (!i) return;
      state.status = i.dataset.status;
      syncMenus();
      renderTable();
    });
    el.projectMenu.addEventListener("click", (e) => {
      const i = e.target.closest("[data-project]");
      if (!i) return;
      state.project = i.dataset.project;
      syncMenus();
      renderTable();
    });

    /* ---------- Row menu (shared, fixed-position) ---------- */
    let menuTrigger = null,
      menuDoc = null;
    const menuItems = () => [
      ...el.rowMenu.querySelectorAll('[role="menuitem"]'),
    ];
    function openRowMenu(trigger) {
      closeRowMenu(false);
      menuTrigger = trigger;
      menuDoc = docs.find((d) => d.id === trigger.dataset.rowMenu);
      el.rowMenu.innerHTML = `
        <a class="menu__item" role="menuitem" href="chat.html?prompt=${encodeURIComponent("Summarize " + menuDoc.name)}">${icon("chat")}Ask AI about this</a>
        ${menuDoc.status === "failed" ? `<button class="menu__item" type="button" role="menuitem" data-act="retry">${icon("refresh")}Retry processing</button>` : ""}
        <button class="menu__item" type="button" role="menuitem" data-act="rename">${icon("pen")}Rename</button>
        <div class="menu__sep" role="separator"></div>
        <button class="menu__item" type="button" role="menuitem" data-act="delete">${icon("close")}Delete</button>`;
      const r = trigger.getBoundingClientRect();
      el.rowMenu.classList.add("is-open");
      el.rowMenu.removeAttribute("inert");
      el.rowMenu.style.top = `${Math.min(r.bottom + 4, innerHeight - el.rowMenu.offsetHeight - 8)}px`;
      el.rowMenu.style.left = `${Math.max(8, r.right - el.rowMenu.offsetWidth)}px`;
      trigger.setAttribute("aria-expanded", "true");
      menuItems()[0].focus();
    }
    function closeRowMenu(refocus = true) {
      if (!menuTrigger) return;
      el.rowMenu.classList.remove("is-open");
      el.rowMenu.setAttribute("inert", "");
      menuTrigger.setAttribute("aria-expanded", "false");
      if (refocus && menuTrigger.isConnected) menuTrigger.focus();
      menuTrigger = null;
    }
    el.rowMenu.addEventListener("keydown", (e) => {
      const list = menuItems();
      const i = list.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        list[(i + 1) % list.length].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        list[(i - 1 + list.length) % list.length].focus();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeRowMenu();
      } else if (e.key === "Tab") closeRowMenu(false);
    });
    document.addEventListener("pointerdown", (e) => {
      if (
        menuTrigger &&
        !el.rowMenu.contains(e.target) &&
        !menuTrigger.contains(e.target)
      )
        closeRowMenu(false);
    });
    addEventListener("resize", () => closeRowMenu(false));
    addEventListener("scroll", () => closeRowMenu(false), true);

    el.rowMenu.addEventListener("click", (e) => {
      const item = e.target.closest('[role="menuitem"]');
      if (!item) return;
      const act = item.dataset.act;
      const doc = menuDoc;
      closeRowMenu(false);
      if (act === "rename") {
        el.renameForm.elements.name.value = doc.name;
        clearRenameError();
        el.rename.dataset.id = doc.id;
        el.rename.showModal();
        el.renameForm.elements.name.select();
      } else if (act === "delete") {
        $("[data-delete-name]").textContent = doc.name;
        el.del.dataset.id = doc.id;
        el.del.showModal();
      } else if (act === "retry") processDoc(doc, false);
    });

    /* ---------- Dialogs ---------- */
    document
      .querySelectorAll("dialog [data-dialog-close]")
      .forEach((b) =>
        b.addEventListener("click", () => b.closest("dialog").close()),
      );
    [el.rename, el.del].forEach((dlg) =>
      dlg.addEventListener("click", (e) => {
        if (e.target === dlg) dlg.close();
      }),
    );

    const renameField = el.renameForm.elements.name.closest(".field");
    const clearRenameError = () => {
      renameField.classList.remove("field--invalid");
      renameField.querySelector("[data-error-text]").textContent = "";
    };
    el.renameForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = el.renameForm.elements.name.value.trim();
      if (!value || value.length > 80) {
        renameField.classList.add("field--invalid");
        renameField.querySelector("[data-error-text]").textContent =
          "Enter a name up to 80 characters.";
        return el.renameForm.elements.name.focus();
      }
      const d = docs.find((x) => x.id === el.rename.dataset.id);
      d.name = value;
      el.rename.close();
      renderAll();
      toast("Document renamed.");
    });
    $("[data-confirm-delete]").addEventListener("click", () => {
      const d = docs.find((x) => x.id === el.del.dataset.id);
      docs = docs.filter((x) => x.id !== d.id);
      if (state.selected === d.id) {
        state.selected = docs[0] ? docs[0].id : null;
        state.open = null;
      }
      el.del.close();
      renderAll();
      toast(`${d.name} deleted.`);
    });

    /* ---------- Upload ---------- */
    const ALLOWED = ["pdf", "docx", "txt", "csv"];
    const fmt = (b) =>
      b < 1048576
        ? `${Math.max(1, Math.round(b / 1024))} KB`
        : `${(b / 1048576).toFixed(1)} MB`;

    function processDoc(d, canFail) {
      d.status = "processing";
      renderAll();
      el.live.textContent = `${d.name} is processing.`;
      const fail = canFail && /fail/i.test(d.name);
      setTimeout(
        () => {
          d.status = fail ? "failed" : "ready";
          renderAll();
          if (fail)
            toast(
              `${d.name} couldn’t be processed. Choose Retry in the row menu.`,
              { tone: "error" },
            );
          else {
            toast(`${d.name} is ready for analysis.`);
            el.live.textContent = `${d.name} is ready.`;
          }
        },
        reduce ? 200 : 2200 + Math.random() * 1000,
      );
    }

    function addFiles(list) {
      [...list].forEach((f) => {
        const ext = f.name.split(".").pop().toLowerCase();
        if (!ALLOWED.includes(ext))
          return toast(`${f.name}: use a PDF, DOCX, TXT, or CSV file.`, {
            tone: "error",
          });
        if (f.size > 10 * 1048576)
          return toast(`${f.name} is larger than 10 MB. Try a smaller file.`, {
            tone: "error",
          });
        const d = {
          id: `up-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          name: f.name,
          ext: ext.toUpperCase(),
          size: fmt(f.size),
          status: "processing",
          project: state.project === "all" ? "website-redesign" : state.project,
          owner: data.owner,
        };
        docs.unshift(d);
        state.selected = d.id;
        state.open = null;
        processDoc(d, true);
      });
      el.file.value = "";
    }
    el.upload.addEventListener("click", () => el.file.click());
    el.file.addEventListener("change", () => addFiles(el.file.files));
    ["dragenter", "dragover"].forEach((t) =>
      el.card.addEventListener(t, (e) => {
        e.preventDefault();
        el.card.classList.add("is-drop");
      }),
    );
    ["dragleave", "drop"].forEach((t) =>
      el.card.addEventListener(t, (e) => {
        e.preventDefault();
        if (t === "drop") addFiles(e.dataTransfer.files);
        el.card.classList.remove("is-drop");
      }),
    );

    /* ---------- Start ---------- */
    syncMenus();
    el.body.setAttribute("aria-busy", "true");
    el.body.innerHTML = skRow().repeat(4);
    renderPanel();
    setTimeout(
      () => {
        renderTable();
        el.body.removeAttribute("aria-busy");
        if (params.get("action") === "upload") el.upload.focus();
        if (params.get("action") === "analyze" && state.selected) {
          state.open = "summarize";
          renderPanel();
        }
      },
      reduce ? 0 : 450,
    );
  };

  if (window.aiwApp) init();
  else document.addEventListener("aiwapp:ready", init, { once: true });
})();
