/* ==========================================================================
   Onboarding — multi-step flow.
   `service` is the only storage touchpoint; swap it for Firestore later
   (e.g. setDoc(doc(db, 'workspaces', id), data)) without touching the UI.
   ========================================================================== */
(() => {
  const form = document.querySelector("[data-onboarding]");
  if (!form) return;

  const OWNER = "Handsome";
  const TOTAL = 3; // question steps; index 3 is the completion screen
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Service (demo: localStorage) ---------- */
  const service = {
    KEY: "aiw-onboarding",
    load() {
      try {
        return JSON.parse(localStorage.getItem(this.KEY)) || {};
      } catch (e) {
        return {};
      }
    },
    async save(data) {
      await new Promise((resolve) =>
        setTimeout(resolve, reduceMotion ? 150 : 900),
      );
      try {
        localStorage.setItem(
          this.KEY,
          JSON.stringify({ ...data, completedAt: new Date().toISOString() }),
        );
      } catch (e) {}
      return data;
    },
  };

  /* ---------- Elements ---------- */
  const steps = [...form.querySelectorAll("[data-step]")];
  const actions = form.querySelector("[data-actions]");
  const back = form.querySelector("[data-back]");
  const skip = form.querySelector("[data-skip]");
  const next = form.querySelector("[data-next]");
  const nextLabel = next.querySelector("[data-label]");
  const nameInput = form.elements.workspace;
  const bar = document.querySelector("[data-progress]");
  const barFill = bar.querySelector(".progress__bar");
  const count = document.querySelector("[data-step-count]");
  const setupItems = [...document.querySelectorAll("[data-setup-step]")];

  /* ---------- State ---------- */
  const saved = service.load();
  const state = {
    uses: saved.uses || [],
    mode: saved.mode || "",
    workspace: saved.workspace || "",
  };
  let index = 0;

  form.querySelectorAll('input[name="uses"]').forEach((i) => {
    i.checked = state.uses.includes(i.value);
  });
  form.querySelectorAll('input[name="mode"]').forEach((i) => {
    i.checked = i.value === state.mode;
  });
  nameInput.value = state.workspace;

  const modeLabel = { personal: "Personally", team: "With a team" };
  const defaultName = () =>
    state.mode === "team" ? `${OWNER}’s team` : `${OWNER}’s workspace`;

  /* ---------- Read / validate ---------- */
  function readStep(i) {
    if (i === 0)
      state.uses = [...form.querySelectorAll('input[name="uses"]:checked')].map(
        (c) => c.value,
      );
    if (i === 1)
      state.mode =
        (form.querySelector('input[name="mode"]:checked') || {}).value || "";
    if (i === 2) state.workspace = nameInput.value.trim();
  }

  const rules = [
    () =>
      form.querySelectorAll('input[name="uses"]:checked').length > 0 ||
      "Choose at least one area, or skip for now.",
    () =>
      Boolean(form.querySelector('input[name="mode"]:checked')) ||
      "Choose how you plan to use it, or skip for now.",
    () => {
      const length = nameInput.value.trim().length;
      return (
        (length >= 2 && length <= 40) ||
        "Give your workspace a name between 2 and 40 characters."
      );
    },
  ];

  function validate(i) {
    const result = rules[i]();
    const ok = result === true;
    const field = steps[i].querySelector("[data-field]");
    field.classList.toggle("field--invalid", !ok);
    field.querySelector("[data-error-text]").textContent = ok ? "" : result;
    if (i === 2) nameInput.setAttribute("aria-invalid", String(!ok));
    return ok;
  }

  const clearError = (i) => {
    const field = steps[i] && steps[i].querySelector("[data-field]");
    if (!field) return;
    field.classList.remove("field--invalid");
    field.querySelector("[data-error-text]").textContent = "";
    if (i === 2) nameInput.removeAttribute("aria-invalid");
  };

  form.addEventListener("input", () => {
    const field = steps[index] && steps[index].querySelector("[data-field]");
    if (field && field.classList.contains("field--invalid")) validate(index);
  });

  /* ---------- Navigation ---------- */
  function updateNameCopy() {
    nameInput.placeholder = defaultName();
    form.querySelector("[data-name-hint]").textContent =
      state.mode === "team"
        ? "Your teammates will see this name. You can change it later in settings."
        : "You can change this later in settings.";
  }

  function show(i) {
    index = i;
    const done = i === TOTAL;

    steps.forEach((step, n) => {
      step.hidden = n !== i;
    });
    steps[i].classList.add("is-entering");

    actions.hidden = done;
    back.hidden = i === 0;
    skip.hidden = done;
    nextLabel.textContent = i === TOTAL - 1 ? "Create workspace" : "Continue";

    const position = Math.min(i + 1, TOTAL);
    barFill.style.setProperty(
      "--progress",
      `${(done ? 1 : position / TOTAL) * 100}%`,
    );
    bar.setAttribute("aria-valuenow", position);
    bar.setAttribute(
      "aria-valuetext",
      done ? "Setup complete" : `Step ${position} of ${TOTAL}`,
    );
    count.textContent = done ? "All set" : `Step ${position} of ${TOTAL}`;

    setupItems.forEach((item, n) => {
      item.classList.toggle("is-current", n === i && !done);
      item.classList.toggle("is-done", n < i);
      if (n === i && !done) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });

    if (i === 2) updateNameCopy();
    steps[i].querySelector("[data-heading]").focus();
  }

  function setLoading(loading) {
    next.classList.toggle("is-loading", loading);
    next.toggleAttribute("aria-busy", loading);
    nextLabel.textContent = loading
      ? "Creating your workspace…"
      : "Create workspace";
  }

  function renderSummary() {
    form.querySelector("[data-summary-name]").textContent = state.workspace;
    form.querySelector("[data-summary-uses]").textContent = state.uses.length
      ? state.uses.join(", ")
      : "Not set";
    form.querySelector("[data-summary-mode]").textContent =
      modeLabel[state.mode] || "Not set";
  }

  async function finish() {
    if (!state.workspace) state.workspace = defaultName();
    setLoading(true);
    try {
      await service.save(state);
      renderSummary();
      setLoading(false);
      show(TOTAL);
    } catch (error) {
      setLoading(false);
      const field = steps[2].querySelector("[data-field]");
      field.classList.add("field--invalid");
      field.querySelector("[data-error-text]").textContent =
        "We couldn’t create your workspace. Please try again.";
    }
  }

  /* ---------- Events ---------- */
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (next.classList.contains("is-loading") || index >= TOTAL) return;

    if (!validate(index)) {
      const target =
        index === 2 ? nameInput : steps[index].querySelector("input");
      target.focus();
      return;
    }
    readStep(index);
    if (index < TOTAL - 1) show(index + 1);
    else finish();
  });

  back.addEventListener("click", () => {
    readStep(index);
    clearError(index);
    show(index - 1);
  });

  skip.addEventListener("click", () => {
    readStep(index);
    clearError(index);
    if (index < TOTAL - 1) show(index + 1);
    else finish();
  });

  form.querySelector("[data-restart]").addEventListener("click", () => show(0));

  show(0);
})();
