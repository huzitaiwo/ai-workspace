/* ==========================================================================
   Reports — choose sources → configure → generate (7 stages, cancellable)
   → review (regenerate, export, copy).  All content is illustrative.
   ========================================================================== */
(() => {
  const init = () => {
    const { data, esc, icon, toast } = window.aiwApp;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = (s) => document.querySelector(s);

    const sources = [
      ...data.documents
        .slice(0, 2)
        .map((d) => ({ id: d.id, name: d.name, type: "Document" })),
      {
        id: "customer-insight-themes",
        name: "Customer insight themes",
        type: "Conversation",
      },
      {
        id: "website-redesign",
        name: "Website Redesign project",
        type: "Project",
      },
    ];
    const types = [
      ["research", "Research synthesis"],
      ["market", "Market research"],
      ["competitor", "Competitor analysis"],
      ["feedback", "Customer feedback"],
      ["status", "Project status"],
      ["meeting", "Meeting summary"],
      ["business", "Business analysis"],
    ];
    const audiences = [
      "Product leadership",
      "Executive team",
      "Project team",
      "Clients",
    ];
    const stages = [
      "Preparing sources",
      "Reading information",
      "Extracting insights",
      "Identifying patterns",
      "Generating analysis",
      "Structuring report",
      "Finalizing",
    ];

    const content = {
      research: {
        title: "Navigation research synthesis",
        summary:
          "The strongest opportunity is not to make the product feel simpler at a glance. It is to make the next decision feel more certain.",
        findings: [
          "Navigation choice is a confidence problem as much as an information problem.",
          "Participants rely on adjacent context to judge a route before taking it.",
          "Evidence should remain accessible within the decision flow.",
        ],
      },
      market: {
        title: "Market research brief",
        summary:
          "The category is crowded at the surface but thin where it matters: tools help people find information, and few help them trust what they found.",
        findings: [
          "Buyers compare tools on source visibility as much as on features.",
          "Teams that keep research in one place repeat fewer questions.",
          "Differentiation is weakest in how decisions are recorded.",
        ],
      },
      competitor: {
        title: "Competitor landscape",
        summary:
          "Competitors converge on chat and drafting, and diverge on how visibly they connect answers back to evidence.",
        findings: [
          "Most products show answers without a route to the source.",
          "Project-level context is rare outside team plans.",
          "Reports are usually exports, not part of the working flow.",
        ],
      },
      feedback: {
        title: "Customer feedback report",
        summary:
          "Customers ask for fewer choices and clearer next steps more often than they ask for new features.",
        findings: [
          "Costs appearing late is the most repeated complaint.",
          "People want a guest option from the first step.",
          "Positive feedback centers on clarity, not speed.",
        ],
      },
      status: {
        title: "Project status update",
        summary:
          "The project is on track, with research complete and design decisions waiting on one open question.",
        findings: [
          "Research synthesis is complete and reviewed.",
          "The navigation prototype is ready for testing.",
          "One decision on top-level structure remains open.",
        ],
      },
      meeting: {
        title: "Meeting summary",
        summary:
          "The group agreed to reduce top-level choices and to test the change before committing.",
        findings: [
          "Agreed: prototype a reduced menu first.",
          "Open: whether search should stay prominent.",
          "Next: schedule two mobile interviews.",
        ],
      },
      business: {
        title: "Business analysis",
        summary:
          "The strongest return comes from improving decision confidence for existing users before adding new surface area.",
        findings: [
          "Retention risk concentrates where decisions stall.",
          "Shared context lowers the cost of onboarding teammates.",
          "Reports increase reuse of existing research.",
        ],
      },
    };

    let workspace = data.workspace;
    try {
      workspace =
        (JSON.parse(localStorage.getItem("aiw-onboarding")) || {}).workspace ||
        workspace;
    } catch (e) {}
    const month = new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const state = {
      selected: new Set(sources.slice(0, 3).map((s) => s.id)),
      type: "research",
      audience: audiences[0],
      phase: "preview",
      controller: null,
    };
    const el = {
      list: $("[data-sources]"),
      type: $("[data-type]"),
      audience: $("[data-audience]"),
      error: $("[data-src-error]"),
      card: $("[data-card]"),
      go: $("[data-generate]"),
      live: $("[data-rg-status]"),
    };
    const announce = (t) => {
      el.live.textContent = "";
      setTimeout(() => {
        el.live.textContent = t;
      }, 40);
    };

    /* ---------- Controls ---------- */
    el.list.innerHTML = sources
      .map(
        (s) =>
          `<li><label class="src"><input type="checkbox" value="${s.id}"${state.selected.has(s.id) ? " checked" : ""}><span class="src__box" aria-hidden="true">${icon("check")}</span><span class="src__name">${esc(s.name)}</span><span class="src__type">${s.type}</span></label></li>`,
      )
      .join("");
    el.type.innerHTML = types
      .map(([id, label]) => `<option value="${id}">${label}</option>`)
      .join("");
    el.audience.innerHTML = audiences
      .map((a) => `<option>${a}</option>`)
      .join("");

    const chosen = () => sources.filter((s) => state.selected.has(s.id));
    const noteText = () => {
      const n = state.selected.size;
      return n === 0
        ? "No sources selected. Choose at least one to cite."
        : `${n} selected source${n === 1 ? "" : "s"} will be cited`;
    };

    /* ---------- Card renderers ---------- */
    const body = (c) => `
      <hr>
      <h3>Executive summary</h3>
      <p class="rp__summary">${esc(c.summary)}</p>
      <h3 style="margin-top:1.4rem">Key findings</h3>
      <ul class="findings">${c.findings.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`;

    function renderPreview() {
      const c = content[state.type];
      el.card.innerHTML = `
        <span class="eyebrow">Report preview</span>
        <h2>${esc(c.title)}</h2>
        <p class="rp__meta">Prepared for ${esc(workspace)} · ${month}</p>
        ${body(c)}
        <p class="rp__note" data-note>${icon("doc")}<span>${noteText()}</span></p>`;
    }

    function renderDone() {
      const c = content[state.type];
      el.card.innerHTML = `
        <div class="rp__top"><span class="eyebrow">Generated report</span><span class="tag-gen">AI-generated</span></div>
        <h2>${esc(c.title)}</h2>
        <p class="rp__meta">Prepared for ${esc(workspace)} · ${month} · For ${esc(state.audience)}</p>
        ${body(c)}
        <hr>
        <h3>Sources</h3>
        <ul class="rp__sources">${chosen()
          .map((s) => `<li>${icon("doc")}${esc(s.name)}</li>`)
          .join("")}</ul>
        <p class="rp__disclosure">Written by AI from the sources above, using illustrative demo content. Review it before sharing.</p>
        <div class="rp__actions">
          <button class="btn btn--primary" type="button" data-act="regenerate">${icon("refresh")}Regenerate</button>
          <button class="btn btn--secondary" type="button" data-act="export">Export .md</button>
          <button class="btn btn--secondary" type="button" data-act="copy">Copy</button>
        </div>`;
    }

    function renderProcessing(i) {
      const c = content[state.type];
      el.card.innerHTML = `
        <div class="gen">
          <span class="eyebrow">Generating report</span>
          <h2>${esc(c.title)}</h2>
          <p class="rp__meta">Step ${i + 1} of ${stages.length} · you can cancel at any time</p>
          <div class="meter" role="progressbar" aria-label="Report progress" aria-valuemin="0" aria-valuemax="${stages.length}" aria-valuenow="${i}" style="--value:${(i / stages.length) * 100}%"><span style="animation:none"></span></div>
          <ol class="gen-stages">${stages.map((s, n) => `<li class="gen-stage ${n < i ? "gen-stage--done" : n === i ? "gen-stage--active" : ""}"><span class="gen-stage__dot" aria-hidden="true">${n < i ? icon("check") : ""}</span>${s}</li>`).join("")}</ol>
          <div class="rp__actions"><button class="btn btn--secondary" type="button" data-act="cancel">Cancel</button></div>
        </div>`;
    }

    const render = () =>
      state.phase === "done" ? renderDone() : renderPreview();

    function invalidate() {
      if (state.phase === "processing") return;
      state.phase = "preview";
      renderPreview();
    }

    /* ---------- Events: controls ---------- */
    el.list.addEventListener("change", (e) => {
      const id = e.target.value;
      if (e.target.checked) state.selected.add(id);
      else state.selected.delete(id);
      el.error.classList.remove("is-visible");
      invalidate();
    });
    el.type.addEventListener("change", () => {
      state.type = el.type.value;
      invalidate();
    });
    el.audience.addEventListener("change", () => {
      state.audience = el.audience.value;
      if (state.phase === "done") invalidate();
    });

    /* ---------- Generation ---------- */
    const sleep = (ms, signal) =>
      new Promise((resolve, reject) => {
        if (signal.aborted)
          return reject(new DOMException("Aborted", "AbortError"));
        const t = setTimeout(resolve, reduce ? 120 : ms);
        signal.addEventListener(
          "abort",
          () => {
            clearTimeout(t);
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true },
        );
      });

    function setGoBusy(on) {
      el.go.disabled = on;
      el.go.innerHTML = on
        ? '<span class="spinner" aria-hidden="true"></span>Generating…'
        : `${icon("sparkle")}Generate report ${icon("arrow", "icon--arrow")}`;
    }

    async function generate() {
      if (state.phase === "processing") return;
      if (!state.selected.size) {
        el.error.classList.add("is-visible");
        el.list.querySelector("input").focus();
        return;
      }
      state.phase = "processing";
      state.controller = new AbortController();
      setGoBusy(true);
      announce("Generating your report.");
      try {
        for (let i = 0; i < stages.length; i += 1) {
          renderProcessing(i);
          announce(`${stages[i]}. Step ${i + 1} of ${stages.length}.`);
          await sleep(650 + Math.random() * 450, state.controller.signal);
        }
        state.phase = "done";
        renderDone();
        announce("Your report is ready.");
        toast("Report generated.");
        el.card.setAttribute("tabindex", "-1");
        el.card.focus({ preventScroll: false });
      } catch (err) {
        if (err.name === "AbortError") {
          state.phase = "preview";
          renderPreview();
          announce("Generation cancelled.");
          toast("Generation cancelled. Nothing was saved.");
        } else {
          state.phase = "preview";
          renderPreview();
          toast("The report couldn’t be generated. Try again in a moment.", {
            tone: "error",
          });
        }
      } finally {
        state.controller = null;
        setGoBusy(false);
      }
    }
    el.go.addEventListener("click", generate);

    /* ---------- Result actions ---------- */
    const markdown = () => {
      const c = content[state.type];
      return `# ${c.title}\n\nPrepared for ${workspace} · ${month} · For ${state.audience}\n\n## Executive summary\n\n${c.summary}\n\n## Key findings\n\n${c.findings.map((f) => `- ${f}`).join("\n")}\n\n## Sources\n\n${chosen()
        .map((s) => `- ${s.name}`)
        .join(
          "\n",
        )}\n\n_Written by AI from the sources above, using illustrative demo content. Review it before sharing._\n`;
    };
    el.card.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]");
      if (!b) return;
      const act = b.dataset.act;
      if (act === "cancel" && state.controller) state.controller.abort();
      else if (act === "regenerate") generate();
      else if (act === "copy")
        (navigator.clipboard
          ? navigator.clipboard.writeText(markdown())
          : Promise.reject()
        ).then(
          () => toast("Report copied to clipboard."),
          () =>
            toast("Couldn’t copy automatically. Export it instead.", {
              tone: "error",
            }),
        );
      else if (act === "export") {
        const url = URL.createObjectURL(
          new Blob([markdown()], { type: "text/markdown" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = `${content[state.type].title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast("Report exported as Markdown.");
      }
    });

    /* ---------- Start ---------- */
    render();
    if (new URLSearchParams(location.search).get("new")) {
      const wanted = new URLSearchParams(location.search).get("new");
      if (content[wanted]) {
        state.type = wanted;
        el.type.value = wanted;
        renderPreview();
      }
    }
  };

  if (window.aiwApp) init();
  else document.addEventListener("aiwapp:ready", init, { once: true });
})();
