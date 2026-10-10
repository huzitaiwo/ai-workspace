/* Projects — skeleton → list → empty, plus a "New project" dialog.
   Add ?state=empty to preview the empty state; ?new=1 opens the dialog. */
(() => {
  const init = () => {
    const { data, esc, icon, toast } = window.aiwApp;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const params = new URLSearchParams(location.search);
    const $ = (s) => document.querySelector(s);

    const slot = $("[data-proj-list]");
    const dlg = $("#project-dialog");
    const form = $("[data-project-form]");
    const nameInput = form.elements.name;
    const field = nameInput.closest(".field");
    const status = $("[data-proj-status]");

    let items =
      params.get("state") === "empty"
        ? []
        : data.projects.map((p) => ({
            id: p.id,
            title: p.title,
            tag: p.tag,
            tint: p.rowTint,
          }));
    const tints = ["coral", "mint", "blue"];

    const skRow = () => `<li class="row" aria-hidden="true">
      <span class="skeleton" style="width:2.1rem;height:2.1rem;border-radius:.55rem"></span>
      <span class="row__body"><span class="skeleton" style="width:40%;height:.75rem"></span><span class="skeleton" style="width:60%;height:.6rem;margin-top:.5rem"></span></span></li>`;

    const row = (p) => `<li><a class="row" href="projects.html?id=${p.id}">
      <span class="tile tile--${p.tint}">${icon("folder")}</span>
      <span class="row__body"><strong>${esc(p.title)}</strong><span>Updated recently · Available in this demo</span></span>
      <span class="tag">${esc(p.tag)}</span>${icon("chevron-right", "row__go")}</a></li>`;

    const emptyBlock = () =>
      `<div class="empty" style="margin:.9rem"><span class="tile tile--mint">${icon("folder")}</span><h3>No projects yet</h3><p>Projects gather conversations, documents, and instructions so every answer has the right context.</p><button class="btn btn--primary btn--sm" type="button" data-new-project>New project ${icon("arrow", "icon--arrow")}</button></div>`;

    function render() {
      slot.innerHTML = items.length
        ? `<ul class="row-list">${items.map(row).join("")}</ul>`
        : emptyBlock();
      slot.removeAttribute("aria-busy");
    }

    slot.setAttribute("aria-busy", "true");
    slot.innerHTML = `<ul class="row-list">${skRow().repeat(3)}</ul>`;
    setTimeout(
      () => {
        render();
        if (params.get("new") === "1") openDialog();
      },
      reduceMotion ? 0 : 450,
    );

    /* ---------- New project dialog ---------- */
    function setError(message) {
      field.classList.toggle("field--invalid", Boolean(message));
      nameInput.setAttribute("aria-invalid", String(Boolean(message)));
      field.querySelector("[data-error-text]").textContent = message || "";
    }
    const check = () => {
      const len = nameInput.value.trim().length;
      const ok = len >= 2 && len <= 40;
      setError(
        ok ? "" : "Give your project a name between 2 and 40 characters.",
      );
      return ok;
    };
    function openDialog() {
      form.reset();
      setError("");
      if (!dlg.open) dlg.showModal();
      nameInput.focus();
    }

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-new-project]")) openDialog();
    });
    dlg
      .querySelectorAll("[data-dialog-close]")
      .forEach((b) => b.addEventListener("click", () => dlg.close()));
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) dlg.close();
    });
    nameInput.addEventListener("input", () => {
      if (field.classList.contains("field--invalid")) check();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!check()) {
        nameInput.focus();
        return;
      }
      const title = nameInput.value.trim();
      const id =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") +
        "-" +
        Date.now().toString(36);
      items.unshift({
        id,
        title,
        tag: "Active",
        tint: tints[items.length % tints.length],
      });
      render();
      dlg.close();
      toast(`Project “${title}” created.`);
      status.textContent = `Project ${title} created.`;
    });
  };

  if (window.aiwApp) init();
  else document.addEventListener("aiwapp:ready", init, { once: true });
})();
