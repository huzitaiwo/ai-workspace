/* Settings — section list + "New setting" dialog. Preview: ?new=1 */
(() => {
  const init = () => {
    const { toast } = window.aiwApp;
    const $ = (s) => document.querySelector(s);

    const list = window.aiwList.mount({
      slot: $("[data-list]"),
      iconName: "gear",
      href: "settings.html?section=",
      items: [
        {
          id: "workspace-defaults",
          title: "Workspace defaults",
          tag: "Active",
          tint: "coral",
        },
        {
          id: "ai-preferences",
          title: "AI preferences",
          tag: "Shared",
          tint: "mint",
        },
        {
          id: "notifications-security",
          title: "Notifications & security",
          tag: "Active",
          tint: "blue",
        },
      ],
      emptyHtml: "",
    });

    const dlg = $("#setting-dialog");
    const form = $("[data-setting-form]");
    const name = form.elements.name;
    const field = name.closest(".field");
    const tints = ["coral", "mint", "blue"];
    let added = 0;

    const setError = (m) => {
      field.classList.toggle("field--invalid", Boolean(m));
      name.setAttribute("aria-invalid", String(Boolean(m)));
      field.querySelector("[data-error-text]").textContent = m || "";
    };
    const check = () => {
      const len = name.value.trim().length;
      const ok = len >= 2 && len <= 60;
      setError(
        ok ? "" : "Give the setting a name between 2 and 60 characters.",
      );
      return ok;
    };
    const open = () => {
      form.reset();
      setError("");
      if (!dlg.open) dlg.showModal();
      name.focus();
    };

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-new-setting]")) open();
    });
    dlg
      .querySelectorAll("[data-dialog-close]")
      .forEach((b) => b.addEventListener("click", () => dlg.close()));
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) dlg.close();
    });
    name.addEventListener("input", () => {
      if (field.classList.contains("field--invalid")) check();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!check()) return name.focus();
      const title = name.value.trim();
      added += 1;
      list.add({
        id: `custom-${added}`,
        title,
        tag: "Active",
        tint: tints[added % 3],
      });
      dlg.close();
      toast(`Setting “${title}” added.`);
      $("[data-status]").textContent = `Setting ${title} added.`;
    });

    if (new URLSearchParams(location.search).get("new") === "1")
      setTimeout(open, 500);
  };
  if (window.aiwApp) init();
  else document.addEventListener("aiwapp:ready", init, { once: true });
})();
