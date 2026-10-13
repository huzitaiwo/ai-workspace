/* Prompt Library — skeleton → list → empty, plus a "New prompt" dialog.
   Preview: ?state=empty · ?new=1 */
(() => {
  const init = () => {
    const { data, esc, icon, toast } = window.aiwApp;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const params = new URLSearchParams(location.search);
    const $ = (s) => document.querySelector(s);

    const slot = $("[data-pr-list]");
    const dlg = $("#prompt-dialog");
    const form = $("[data-prompt-form]");
    const status = $("[data-pr-status]");
    const fields = {
      name: form.elements.name,
      instructions: form.elements.instructions,
    };

    let items =
      params.get("state") === "empty"
        ? []
        : data.prompts.map((p) => ({ ...p }));
    const tints = ["coral", "mint", "blue"];

    const skRow = () => `<li class="row" aria-hidden="true">
      <span class="skeleton" style="width:2.1rem;height:2.1rem;border-radius:.55rem"></span>
      <span class="row__body"><span class="skeleton" style="width:40%;height:.75rem"></span><span class="skeleton" style="width:60%;height:.6rem;margin-top:.5rem"></span></span></li>`;

    const row = (p) => `<li><a class="row" href="prompt.html?id=${p.id}">
      <span class="tile tile--${p.tint}">${icon("search")}</span>
      <span class="row__body"><strong>${esc(p.title)}</strong><span>Updated recently · Available in this demo</span></span>
      <span class="tag">${esc(p.tag)}</span>${icon("chevron-right", "row__go")}</a></li>`;

    const emptyBlock = () =>
      `<div class="empty" style="margin:.9rem"><span class="tile tile--mauve">${icon("search")}</span><h3>No prompts yet</h3><p>Save the instructions you reuse most, so your team gets consistent, high-quality results every time.</p><button class="btn btn--primary btn--sm" type="button" data-new-prompt>New prompt ${icon("arrow", "icon--arrow")}</button></div>`;

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

    /* ---------- Dialog ---------- */
    const fieldOf = (input) => input.closest(".field");
    function setError(input, message) {
      const f = fieldOf(input);
      f.classList.toggle("field--invalid", Boolean(message));
      input.setAttribute("aria-invalid", String(Boolean(message)));
      f.querySelector("[data-error-text]").textContent = message || "";
    }
    const rules = {
      name: (v) =>
        (v.trim().length >= 2 && v.trim().length <= 60) ||
        "Give your prompt a name between 2 and 60 characters.",
      instructions: (v) =>
        v.trim().length >= 10 ||
        "Add the instructions (at least 10 characters).",
    };
    const check = (key) => {
      const r = rules[key](fields[key].value);
      setError(fields[key], r === true ? "" : r);
      return r === true;
    };

    function openDialog() {
      form.reset();
      Object.values(fields).forEach((i) => setError(i, ""));
      if (!dlg.open) dlg.showModal();
      fields.name.focus();
    }

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-new-prompt]")) openDialog();
    });
    dlg
      .querySelectorAll("[data-dialog-close]")
      .forEach((b) => b.addEventListener("click", () => dlg.close()));
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) dlg.close();
    });
    Object.keys(fields).forEach((k) =>
      fields[k].addEventListener("input", () => {
        if (fieldOf(fields[k]).classList.contains("field--invalid")) check(k);
      }),
    );

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const bad = Object.keys(fields).filter((k) => !check(k));
      if (bad.length) {
        fields[bad[0]].focus();
        return;
      }
      const title = fields.name.value.trim();
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
      toast(`Prompt “${title}” saved.`);
      status.textContent = `Prompt ${title} saved.`;
    });
  };

  if (window.aiwApp) init();
  else document.addEventListener("aiwapp:ready", init, { once: true });
})();
