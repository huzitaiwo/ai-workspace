/* Knowledge — skeleton → list → empty, plus a "New source" dialog.
   Preview: ?state=empty · ?new=1 */
(() => {
  const init = () => {
    const { data, esc, icon, toast } = window.aiwApp;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const params = new URLSearchParams(location.search);
    const $ = (s) => document.querySelector(s);

    const slot = $("[data-kb-list]");
    const dlg = $("#source-dialog");
    const form = $("[data-source-form]");
    const nameInput = form.elements.name;
    const field = nameInput.closest(".field");
    const status = $("[data-kb-status]");

    let items =
      params.get("state") === "empty"
        ? []
        : data.knowledge.map((k) => ({ ...k }));
    const tints = ["coral", "mint", "blue"];

    const skRow = () => `<li class="row" aria-hidden="true">
      <span class="skeleton" style="width:2.1rem;height:2.1rem;border-radius:.55rem"></span>
      <span class="row__body"><span class="skeleton" style="width:40%;height:.75rem"></span><span class="skeleton" style="width:60%;height:.6rem;margin-top:.5rem"></span></span></li>`;

    const row = (k) => `<li><a class="row" href="knowledge.html?id=${k.id}">
      <span class="tile tile--${k.tint}">${icon("book")}</span>
      <span class="row__body"><strong>${esc(k.title)}</strong><span>Updated recently · Available in this demo</span></span>
      <span class="tag">${esc(k.tag)}</span>${icon("chevron-right", "row__go")}</a></li>`;

    const emptyBlock = () =>
      `<div class="empty" style="margin:.9rem"><span class="tile tile--mauve">${icon("book")}</span><h3>No sources yet</h3><p>Add brand guidelines, research, and policies so every answer starts from what your team already trusts.</p><button class="btn btn--primary btn--sm" type="button" data-new-source>New source ${icon("arrow", "icon--arrow")}</button></div>`;

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

    function setError(message) {
      field.classList.toggle("field--invalid", Boolean(message));
      nameInput.setAttribute("aria-invalid", String(Boolean(message)));
      field.querySelector("[data-error-text]").textContent = message || "";
    }
    const check = () => {
      const len = nameInput.value.trim().length;
      const ok = len >= 2 && len <= 60;
      setError(
        ok ? "" : "Give your source a name between 2 and 60 characters.",
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
      if (e.target.closest("[data-new-source]")) openDialog();
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
      toast(`Source “${title}” added.`);
      status.textContent = `Source ${title} added.`;
    });
  };

  if (window.aiwApp) init();
  else document.addEventListener("aiwapp:ready", init, { once: true });
})();
