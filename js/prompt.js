/* Prompt detail — edit instructions with {{variables}}, fill them in, preview,
   test run (demo provider), run in chat.  Edits saved in the browser. */
(() => {
  const init = () => {
    const { data, esc, icon, toast } = window.aiwApp;
    const ai = window.aiService;
    const $ = (s) => document.querySelector(s);
    const id = new URLSearchParams(location.search).get("id");
    const base = data.prompts.find((p) => p.id === id);

    if (!base) {
      $("[data-notfound]").hidden = false;
      return;
    }
    $("[data-found]").hidden = false;

    let saved = {
      title: base.title,
      description: base.description,
      category: base.category,
      visibility: base.visibility,
      instructions: base.instructions,
    };
    try {
      Object.assign(
        saved,
        JSON.parse(localStorage.getItem("aiw-prompt-" + id)) || {},
      );
    } catch (e) {}

    const f = {
      name: $("#pr-name"),
      desc: $("#pr-desc"),
      cat: $("#pr-cat"),
      vis: $("#pr-vis"),
      ins: $("#pr-ins"),
    };
    const samples = {
      company: data.workspace,
      audience: "Product leadership",
      tone: "clear and direct",
      document: "Interview synthesis.pdf",
    };
    const values = {};

    const cats = [
      "Business",
      "Writing",
      "Research",
      "Marketing",
      "Product",
      "Coding",
      "Productivity",
      "Education",
    ];
    f.cat.innerHTML = cats.map((c) => `<option>${c}</option>`).join("");

    const apply = (p) => {
      f.name.value = p.title;
      f.desc.value = p.description || "";
      f.cat.value = p.category;
      f.vis.value = p.visibility;
      f.ins.value = p.instructions;
    };
    apply(saved);

    const current = () => ({
      title: f.name.value.trim(),
      description: f.desc.value.trim(),
      category: f.cat.value,
      visibility: f.vis.value,
      instructions: f.ins.value.trim(),
    });
    const isDirty = () => JSON.stringify(current()) !== JSON.stringify(saved);

    /* ---------- Variables + preview ---------- */
    const VAR = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;
    const vars = () => [
      ...new Set([...f.ins.value.matchAll(VAR)].map((m) => m[1])),
    ];
    let varKey = "";

    function renderVars() {
      const list = vars();
      const key = list.join("|");
      if (key === varKey) return;
      varKey = key;
      $("[data-vars]").innerHTML = list.length
        ? list
            .map((v) => {
              if (!(v in values)) values[v] = samples[v] || "";
              return `<div class="field"><label for="var-${v}">{{${esc(v)}}}</label><input class="input" id="var-${v}" data-var="${esc(v)}" type="text" value="${esc(values[v])}" autocomplete="off"></div>`;
            })
            .join("")
        : '<p class="pr-empty">No variables yet. Add placeholders like {{company}} or {{audience}} to reuse this prompt.</p>';
    }

    const filled = () => f.ins.value.replace(VAR, (m, v) => values[v] || m);
    const unresolved = () => vars().filter((v) => !values[v]);

    function renderPreview() {
      const html = esc(f.ins.value).replace(VAR, (m, v) =>
        values[v]
          ? `<mark>${esc(values[v])}</mark>`
          : `<mark class="is-empty">{{${v}}}</mark>`,
      );
      $("[data-preview]").innerHTML =
        html ||
        '<span class="pr-empty">Your instructions will appear here.</span>';
    }

    function refresh() {
      renderVars();
      renderPreview();
      $("[data-dirty]").textContent = isDirty()
        ? "Unsaved changes"
        : "All changes saved";
      $("[data-save]").disabled = !isDirty();
    }

    $("[data-vars]").addEventListener("input", (e) => {
      const v = e.target.dataset.var;
      if (v) {
        values[v] = e.target.value;
        refresh();
      }
    });
    Object.values(f).forEach((i) =>
      i.addEventListener("input", () => {
        clearErrors();
        refresh();
      }),
    );
    Object.values(f).forEach((i) => i.addEventListener("change", refresh));

    /* ---------- Validation + save ---------- */
    const fieldOf = (i) => i.closest(".field");
    function setError(i, m) {
      const fl = fieldOf(i);
      fl.classList.toggle("field--invalid", Boolean(m));
      i.setAttribute("aria-invalid", String(Boolean(m)));
      fl.querySelector("[data-error-text]").textContent = m || "";
    }
    function clearErrors() {
      setError(f.name, "");
      setError(f.ins, "");
    }
    function validate() {
      let ok = true;
      const n = f.name.value.trim().length;
      if (n < 2 || n > 60) {
        setError(
          f.name,
          "Give your prompt a name between 2 and 60 characters.",
        );
        ok = false;
      }
      if (f.ins.value.trim().length < 10) {
        setError(f.ins, "Add the instructions (at least 10 characters).");
        ok = false;
      }
      if (!ok)
        (fieldOf(f.name).classList.contains("field--invalid")
          ? f.name
          : f.ins
        ).focus();
      return ok;
    }

    $("[data-form]").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate()) return;
      saved = current();
      try {
        localStorage.setItem("aiw-prompt-" + id, JSON.stringify(saved));
      } catch (err) {}
      document.querySelector("#main h1").textContent = saved.title;
      document.title = `${saved.title} — AI Workspace`;
      refresh();
      toast("Prompt saved.");
    });

    /* ---------- Test run + run in chat ---------- */
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const result = $("[data-result]");
    const testBtn = $("[data-test]");

    testBtn.addEventListener("click", () => {
      const missing = unresolved();
      if (missing.length) {
        toast(`Fill in ${missing.map((m) => `{{${m}}}`).join(", ")} first.`, {
          tone: "error",
        });
        return;
      }
      testBtn.disabled = true;
      result.innerHTML = "<p>Running a test…</p>";
      setTimeout(
        () => {
          const out = ai.compose(
            filled(),
            {
              project:
                data.projects.find((p) => p.id === "website-redesign") ||
                data.projects[0],
            },
            0,
          );
          const lead = out.blocks.find((b) => b.kind === "p");
          const items = out.blocks.filter((b) => b.kind === "li");
          result.innerHTML = `<strong>Test result</strong><p>${esc(lead.text)}</p><ul>${items.map((i) => `<li>${esc(i.text)}</li>`).join("")}</ul><small>Test runs use the demo provider, so this output is illustrative.</small>`;
          testBtn.disabled = false;
        },
        reduce ? 0 : 900,
      );
    });

    $("[data-run]").addEventListener("click", () => {
      const missing = unresolved();
      if (missing.length) {
        toast(`Fill in ${missing.map((m) => `{{${m}}}`).join(", ")} first.`, {
          tone: "error",
        });
        return;
      }
      location.href = `chat.html?new=1&prompt=${encodeURIComponent(filled())}`;
    });

    document.querySelector("#main h1").textContent = saved.title;
    document.title = `${saved.title} — AI Workspace`;
    refresh();
  };
  if (window.aiwApp) init();
  else document.addEventListener("aiwapp:ready", init, { once: true });
})();
