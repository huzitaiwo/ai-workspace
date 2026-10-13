/* Profile — details, theme, notification switches, 2FA (UI only),
   change password (demo), export data, delete account. Saved in the browser. */
(() => {
  const init = () => {
    const { data, toast } = window.aiwApp;
    const $ = (s) => document.querySelector(s);
    const store = {
      get(k, d) {
        try {
          const v = JSON.parse(localStorage.getItem(k));
          return v == null ? d : v;
        } catch (e) {
          return d;
        }
      },
      set(k, v) {
        try {
          localStorage.setItem(k, JSON.stringify(v));
        } catch (e) {}
      },
    };

    /* ---------- Profile ---------- */
    const profile = store.get("aiw-profile", { name: data.owner, email: "" });
    const form = $("[data-profile-form]");
    const name = form.elements.name,
      email = form.elements.email;
    name.value = profile.name || data.owner;
    email.value = profile.email || "";
    const paintWho = () => {
      $("[data-who-name]").textContent = name.value.trim() || data.owner;
      $("[data-avatar]").textContent = (name.value.trim() || data.owner)
        .charAt(0)
        .toUpperCase();
    };
    paintWho();

    const fieldOf = (i) => i.closest(".field");
    const setError = (i, m) => {
      const f = fieldOf(i);
      f.classList.toggle("field--invalid", Boolean(m));
      i.setAttribute("aria-invalid", String(Boolean(m)));
      f.querySelector("[data-error-text]").textContent = m || "";
    };
    name.addEventListener("input", () => {
      paintWho();
      setError(name, "");
    });
    email.addEventListener("input", () => setError(email, ""));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const n = name.value.trim(),
        m = email.value.trim();
      let bad = null;
      if (!n || n.length > 40) {
        setError(name, "Enter your name (up to 40 characters).");
        bad = bad || name;
      }
      if (m && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m)) {
        setError(email, "Enter an email address like name@company.com.");
        bad = bad || email;
      }
      if (bad) return bad.focus();
      store.set("aiw-profile", { name: n, email: m });
      document.querySelectorAll(".profile-btn__text strong").forEach((s) => {
        s.textContent = n;
      });
      document.querySelectorAll(".profile-btn .avatar").forEach((a) => {
        a.textContent = n.charAt(0).toUpperCase();
      });
      toast("Profile saved.");
    });

    /* ---------- Theme ---------- */
    const themeForm = $("[data-theme-form]");
    const stored = (() => {
      try {
        return localStorage.getItem("aiw-theme");
      } catch (e) {
        return null;
      }
    })();
    themeForm.elements.theme.value = stored || "system";
    themeForm.addEventListener("change", () => {
      const v = themeForm.elements.theme.value;
      if (v === "system") {
        try {
          localStorage.removeItem("aiw-theme");
        } catch (e) {}
        document.documentElement.dataset.theme = matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches
          ? "dark"
          : "light";
        document.dispatchEvent(
          new CustomEvent("themechange", {
            detail: document.documentElement.dataset.theme,
          }),
        );
      } else window.aiwTheme.set(v);
      toast(`Theme set to ${v}.`);
    });
    document.addEventListener("themechange", () => {
      let s = null;
      try {
        s = localStorage.getItem("aiw-theme");
      } catch (e) {}
      themeForm.elements.theme.value = s || "system";
    });

    /* ---------- Switches ---------- */
    const prefs = store.get("aiw-prefs", {
      report: true,
      document: true,
      mentions: true,
      product: false,
      twofa: false,
    });
    document.querySelectorAll("[data-switch]").forEach((sw) => {
      const k = sw.dataset.switch;
      sw.setAttribute("aria-checked", String(Boolean(prefs[k])));
      sw.addEventListener("click", () => {
        prefs[k] = !prefs[k];
        sw.setAttribute("aria-checked", String(prefs[k]));
        store.set("aiw-prefs", prefs);
        const label = document.getElementById(
          sw.getAttribute("aria-labelledby"),
        ).textContent;
        toast(`${label} ${prefs[k] ? "on" : "off"}.`);
      });
    });

    /* ---------- Dialogs ---------- */
    document
      .querySelectorAll("dialog [data-dialog-close]")
      .forEach((b) =>
        b.addEventListener("click", () => b.closest("dialog").close()),
      );
    document.querySelectorAll("dialog").forEach((d) =>
      d.addEventListener("click", (e) => {
        if (e.target === d) d.close();
      }),
    );

    const pw = $("#password-dialog"),
      pwForm = $("[data-password-form]");
    $("[data-open-password]").addEventListener("click", () => {
      pwForm.reset();
      pwForm
        .querySelectorAll(".field")
        .forEach((f) => f.classList.remove("field--invalid"));
      pw.showModal();
      pwForm.elements.current.focus();
    });
    pwForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const { current, next, confirm } = pwForm.elements;
      const checks = [
        [current, current.value.length > 0, "Enter your current password."],
        [next, next.value.length >= 8, "Use at least 8 characters."],
        [
          confirm,
          confirm.value === next.value && confirm.value.length > 0,
          "The passwords don’t match.",
        ],
      ];
      let first = null;
      checks.forEach(([i, ok, msg]) => {
        setError(i, ok ? "" : msg);
        if (!ok && !first) first = i;
      });
      if (first) return first.focus();
      pw.close();
      toast("Password updated. This is a demo, so nothing was changed.");
    });

    $("[data-export]").addEventListener("click", () => {
      const out = {};
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (k.startsWith("aiw-")) {
          try {
            out[k] = JSON.parse(localStorage.getItem(k));
          } catch (e) {
            out[k] = localStorage.getItem(k);
          }
        }
      }
      const url = URL.createObjectURL(
        new Blob(
          [
            JSON.stringify(
              { exportedAt: new Date().toISOString(), data: out },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        ),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-workspace-export.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Your data was exported.");
    });

    const del = $("#delete-dialog"),
      confirmInput = $("[data-confirm-text]"),
      confirmBtn = $("[data-confirm-delete]");
    $("[data-open-delete]").addEventListener("click", () => {
      confirmInput.value = "";
      confirmBtn.disabled = true;
      del.showModal();
      confirmInput.focus();
    });
    confirmInput.addEventListener("input", () => {
      confirmBtn.disabled =
        confirmInput.value.trim().toLowerCase() !== "delete";
    });
    confirmBtn.addEventListener("click", () => {
      [localStorage, sessionStorage].forEach((s) => {
        Object.keys(s)
          .filter((k) => k.startsWith("aiw-"))
          .forEach((k) => s.removeItem(k));
      });
      del.close();
      toast("Your local data was deleted.");
      setTimeout(() => {
        location.href = "../index.html";
      }, 800);
    });
  };
  if (window.aiwApp) init();
  else document.addEventListener("aiwapp:ready", init, { once: true });
})();
