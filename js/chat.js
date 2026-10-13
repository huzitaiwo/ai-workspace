/* ==========================================================================
   AI Chat — thread, streaming, stop / regenerate / continue, error states,
   attachments, model + project menus, context panel.
   Query params: ?id=<session>  ?new=1  ?prompt=<text>  ?model=fast|reason|creative
   ========================================================================== */
(() => {
  const init = () => {
    const { data, esc, icon, toast } = window.aiwApp;
    const ai = window.aiService;
    const desktop = matchMedia("(min-width: 64rem)");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = (s, r = document) => r.querySelector(s);
    const params = new URLSearchParams(location.search);
    const initial = data.owner.charAt(0).toUpperCase();

    const el = {
      panel: $("[data-panel]"),
      scroller: $("[data-scroll]"),
      thread: $("[data-thread]"),
      form: $("[data-form]"),
      input: $("[data-composer]"),
      send: $("[data-send]"),
      attach: $("[data-attachments]"),
      file: $("[data-file]"),
      status: $("[data-chat-status]"),
      title: $("#main h1"),
      eyebrow: $("[data-eyebrow]"),
      eyebrow: $("[data-eyebrow]"),
      modelLabel: $("[data-model-label]"),
      modelMenu: $("#menu-model"),
      projectLabel: $("[data-project-label]"),
      projectMenu: $("#menu-project"),
      ctx: $("#context-panel"),
      ctxToggle: $("[data-context-toggle]"),
      ctxTitle: $("[data-ctx-title]"),
      ctxInstr: $("[data-ctx-instructions]"),
      ctxSources: $("[data-ctx-sources]"),
      chips: document.querySelectorAll("[data-question]"),
    };

    const models = [
      {
        id: "live",
        name: "Live workspace AI",
        desc: "Answers from workspace-approved sources.",
      },
      { id: "fast", name: "Workspace Fast", desc: "Quick everyday answers." },
      {
        id: "reason",
        name: "Workspace Reason",
        desc: "Deeper, step-by-step analysis.",
      },
      {
        id: "creative",
        name: "Workspace Creative",
        desc: "Writing and ideation.",
      },
    ];
    const projects = Object.fromEntries(data.projects.map((p) => [p.id, p]));

    /* ---------- State ---------- */
    const SEED_ID = "website-redesign-research";
    const state = {
      project: "website-redesign",
      model: models.some((m) => m.id === params.get("model"))
        ? params.get("model")
        : "live",
      title: "New conversation",
      messages: [],
      generating: false,
      controller: null,
      files: [],
    };
    let uid = 0;
    const nextId = () => `m${++uid}`;
    const ctx = () => ({
      project: projects[state.project],
      model: state.model,
    });

    const isNew = params.get("new") === "1";
    if (isNew && projects[params.get("project")])
      state.project = params.get("project");
    const wanted = params.get("id") || SEED_ID;
    const session =
      data.sessions.find((s) => s.id === wanted) ||
      data.conversations.find((c) => c.id === wanted);
    if (!isNew && session) {
      state.title = session.title;
      state.project = session.project;
      if (session.id === SEED_ID) {
        const prompt =
          "What are the recurring friction points across the website interviews?";
        const answer = ai.compose(prompt, ctx(), 0);
        state.messages.push({
          id: nextId(),
          role: "user",
          text: prompt,
          files: [],
        });
        state.messages.push({
          id: nextId(),
          role: "ai",
          prompt,
          variant: 0,
          blocks: answer.blocks,
          source: answer.source,
          status: "done",
        });
      }
    }

    /* ---------- Helpers ---------- */
    const announce = (text) => {
      el.status.textContent = "";
      setTimeout(() => {
        el.status.textContent = text;
      }, 40);
    };
    let pinned = true;
    el.scroller.addEventListener(
      "scroll",
      () => {
        pinned =
          el.scroller.scrollHeight -
            el.scroller.scrollTop -
            el.scroller.clientHeight <
          90;
      },
      { passive: true },
    );
    const follow = () => {
      if (desktop.matches && pinned)
        el.scroller.scrollTop = el.scroller.scrollHeight;
    };
    const bottom = () => {
      pinned = true;
      if (desktop.matches) el.scroller.scrollTop = el.scroller.scrollHeight;
    };
    const size = (b) =>
      b < 1024 * 1024
        ? `${Math.max(1, Math.round(b / 1024))} KB`
        : `${(b / 1048576).toFixed(1)} MB`;

    /* ---------- Rendering ---------- */
    const blocksHtml = (blocks) => {
      let out = "",
        list = "";
      blocks.forEach((b) => {
        if (b.kind === "li") list += `<li>${esc(b.text)}</li>`;
        else {
          if (list) {
            out += `<ul class="msg__list">${list}</ul>`;
            list = "";
          }
          out += `<p class="msg__p">${esc(b.text)}</p>`;
        }
      });
      return out + (list ? `<ul class="msg__list">${list}</ul>` : "");
    };

    const fileChip = (f) =>
      `<span class="attach-chip">${icon("doc")}<span>${esc(f.name)}</span></span>`;

    const renderUser = (m) => `
      <article class="msg msg--user" data-id="${m.id}" aria-label="You said">
        <div><div class="msg__bubble">${esc(m.text)}</div>${m.files && m.files.length ? `<div class="msg__files">${m.files.map(fileChip).join("")}</div>` : ""}</div>
        <span class="avatar" aria-hidden="true">${esc(initial)}</span>
      </article>`;

    const errorInfo = (err) => {
      switch (err.code) {
        case "rate_limit":
          return {
            title: "Too many requests",
            text: `You’ve sent several requests in a short time, so AI Workspace paused this one. You can try again in ${err.retryAfter || 8} seconds.`,
            countdown: err.retryAfter || 8,
            actions: [
              {
                id: "retry",
                label: "Try again",
                primary: true,
                disabled: true,
              },
              { id: "edit", label: "Edit prompt" },
            ],
          };
        case "context_limit":
          return {
            title: "This conversation is too long",
            text: "The messages and sources together are more than the model can read at once. Start a new conversation, or remove a source from the context.",
            actions: [
              { id: "new", label: "Start a new conversation", primary: true },
              { id: "edit", label: "Edit prompt" },
            ],
          };
        case "unavailable":
          return {
            title: "AI Workspace is unavailable",
            text: "The AI service isn’t responding right now. Your question is kept, so you can try again in a moment.",
            actions: [{ id: "retry", label: "Try again", primary: true }],
          };
        default:
          return {
            title: "Connection lost",
            text: "We couldn’t reach AI Workspace, so this response wasn’t generated. Check your connection and try again. Your question is saved.",
            actions: [
              { id: "retry", label: "Try again", primary: true },
              { id: "edit", label: "Edit prompt" },
            ],
          };
      }
    };

    const errorCard = (e) => `
      <div class="state" role="alert"><span class="tile tile--coral">${icon("alert")}</span>
        <div><strong>${esc(e.title)}</strong><p>${esc(e.text)}</p>
        <div class="state__actions">${e.actions.map((a) => `<button class="btn btn--sm ${a.primary ? "btn--primary" : "btn--secondary"}" type="button" data-action="${a.id}"${a.disabled ? ` disabled data-countdown="${e.countdown}"` : ""}>${esc(a.label)}</button>`).join("")}</div></div>
      </div>`;

    const renderAi = (m, isLast) => {
      let body;
      if (m.status === "thinking")
        body = `<div class="thinking"><span class="thinking__dots" aria-hidden="true"><i></i><i></i><i></i></span><span data-stage>Preparing a response…</span></div>`;
      else if (m.status === "error") body = errorCard(m.error);
      else
        body =
          blocksHtml(m.blocks) +
          (m.status === "stopped"
            ? `<p class="msg__note">${m.blocks.length ? "Response stopped. You can continue it or regenerate." : "Response stopped before anything was written."}</p>`
            : "");

      let tail = "";
      if (m.status === "done" || m.status === "stopped") {
        const src =
          m.source && m.status === "done"
            ? `<button class="source-btn" type="button" data-action="sources">${icon("doc")}<span>${esc(m.source.label)} · ${m.source.count} sources</span>${icon("chevron-right")}</button>`
            : "";
        const acts = [];
        if (m.blocks.length) acts.push(["copy", "copy", "Copy"]);
        if (m.status === "stopped" && m.blocks.length)
          acts.push(["continue", "arrow", "Continue"]);
        if (isLast) acts.push(["regenerate", "refresh", "Regenerate"]);
        tail = `${src}<div class="msg__actions">${acts.map(([a, ic, l]) => `<button class="act" type="button" data-action="${a}">${icon(ic)}<span>${l}</span></button>`).join("")}</div>`;
      }
      return `
        <article class="msg msg--ai" data-id="${m.id}" tabindex="-1" aria-label="AI Workspace response">
          <span class="tile msg__tile" aria-hidden="true">${icon("sparkle")}</span>
          <div class="msg__main"><p class="msg__name">AI Workspace</p><div class="msg__body" data-body>${body}</div>${tail}</div>
        </article>`;
    };

    const welcome = () =>
      `<div class="welcome"><span class="tile">${icon("sparkle")}</span><h2>What would you like to explore?</h2><p>Ask about the sources in ${esc(projects[state.project].title)}, or start with a focused question below.</p></div>`;

    function renderThread() {
      if (!state.messages.length) {
        el.thread.innerHTML = welcome();
        return;
      }
      const lastAi = [...state.messages].reverse().find((m) => m.role === "ai");
      el.thread.innerHTML = state.messages
        .map((m) =>
          m.role === "user" ? renderUser(m) : renderAi(m, m === lastAi),
        )
        .join("");
      startCountdowns();
    }

    function startCountdowns() {
      el.thread.querySelectorAll("[data-countdown]").forEach((btn) => {
        let left = Number(btn.dataset.countdown);
        const label = "Try again";
        const tick = () => {
          if (!btn.isConnected) return clearInterval(timer);
          if (left <= 0) {
            btn.disabled = false;
            btn.textContent = label;
            clearInterval(timer);
            return;
          }
          btn.textContent = `${label} in ${left}s`;
          left -= 1;
        };
        const timer = setInterval(tick, 1000);
        tick();
      });
    }

    function renderContext() {
      const p = projects[state.project];
      el.eyebrow.textContent = `Project · ${p.title}`;
      el.projectLabel.textContent = p.title;
      el.ctxTitle.textContent = p.title;
      el.ctxInstr.textContent = p.instructions;
      el.ctxSources.innerHTML = p.sources
        .map(
          (s) =>
            `<li><a href="documents.html">${icon("doc")}<span>${esc(s)}</span>${icon("check", "icon--check")}</a></li>`,
        )
        .join("");
      el.projectMenu.innerHTML =
        '<p class="menu__label" aria-hidden="true">Project context</p>' +
        Object.values(projects)
          .map(
            (pr) =>
              `<button class="menu__item" type="button" role="menuitemradio" aria-checked="${pr.id === state.project}" data-project="${pr.id}">${esc(pr.title)}${icon("check", "icon--end")}</button>`,
          )
          .join("");
      el.title.textContent = state.title;
      document.title = `${state.title} — AI Chat — AI Workspace`;
    }

    function renderModels() {
      const m = models.find((x) => x.id === state.model);
      el.modelLabel.textContent = m.name;
      el.modelMenu.innerHTML =
        '<p class="menu__label" aria-hidden="true">AI model</p>' +
        models
          .map(
            (x) =>
              `<button class="menu__item" type="button" role="menuitemradio" aria-checked="${x.id === state.model}" data-model="${x.id}"><span class="menu__text"><strong>${esc(x.name)}</strong><small>${esc(x.desc)}</small></span>${icon("check", "icon--end")}</button>`,
          )
          .join("");
    }

    /* ---------- Composer state ---------- */
    function syncComposer() {
      const has = el.input.value.trim().length > 0 || state.files.length > 0;
      el.send.disabled = !state.generating && !has;
      el.send.dataset.mode = state.generating ? "stop" : "send";
      el.send.setAttribute(
        "aria-label",
        state.generating ? "Stop generating" : "Send message",
      );
      el.send.innerHTML = icon(state.generating ? "stop" : "send");
      el.chips.forEach((c) => {
        c.disabled = state.generating;
      });
      el.input.style.height = "auto";
      el.input.style.height = Math.min(el.input.scrollHeight, 144) + "px";
    }

    function renderFiles() {
      el.attach.innerHTML = state.files
        .map(
          (f, i) =>
            `<span class="attach-chip">${icon("doc")}<span>${esc(f.name)}</span><small>${size(f.size)}</small><button type="button" data-remove="${i}" aria-label="Remove ${esc(f.name)}">${icon("close")}</button></span>`,
        )
        .join("");
      syncComposer();
    }

    const ALLOWED = [
      "pdf",
      "docx",
      "txt",
      "csv",
      "xlsx",
      "png",
      "jpg",
      "jpeg",
      "webp",
    ];
    function addFiles(list) {
      [...list].forEach((f) => {
        const ext = f.name.split(".").pop().toLowerCase();
        if (!ALLOWED.includes(ext))
          return toast(
            `${f.name}: this file type isn’t supported. Use PDF, DOCX, TXT, CSV, XLSX, or an image.`,
            { tone: "error" },
          );
        if (f.size > 10 * 1048576)
          return toast(`${f.name} is larger than 10 MB. Try a smaller file.`, {
            tone: "error",
          });
        if (state.files.length >= 5)
          return toast("You can attach up to 5 files at a time.", {
            tone: "error",
          });
        state.files.push({ name: f.name, size: f.size });
      });
      el.file.value = "";
      renderFiles();
    }

    /* ---------- Generation ---------- */
    async function generate(prompt, { variant = 0, continueMsg = null } = {}) {
      const msg = continueMsg || {
        id: nextId(),
        role: "ai",
        prompt,
        variant,
        blocks: [],
        source: null,
        status: "thinking",
      };
      const priorStatus = msg.status;
      msg.status = continueMsg ? "streaming" : "thinking";
      if (!continueMsg) {
        state.messages.push(msg);
        renderThread();
      } else {
        const old = el.thread.querySelector(`[data-id="${msg.id}"]`);
        old
          .querySelector(".msg__main")
          .querySelectorAll(".source-btn, .msg__actions, .msg__note")
          .forEach((n) => n.remove());
      }
      const node = el.thread.querySelector(`[data-id="${msg.id}"]`);
      const body = node.querySelector("[data-body]");
      if (!desktop.matches)
        node.scrollIntoView({
          block: "nearest",
          behavior: reduce ? "auto" : "smooth",
        });
      else bottom();
      node.focus({ preventScroll: true });

      const controller = new AbortController();
      state.controller = controller;
      state.generating = true;
      syncComposer();
      announce("AI Workspace is responding.");

      let list = null,
        current = null;
      try {
        for await (const ev of ai.stream({
          prompt,
          context: ctx(),
          variant,
          continueFrom: Boolean(continueMsg),
          signal: controller.signal,
        })) {
          if (ev.type === "stage") {
            const stage = body.querySelector("[data-stage]");
            if (stage) stage.textContent = `${ev.label}…`;
          } else if (ev.type === "block") {
            const think = body.querySelector(".thinking");
            if (think) think.remove();
            if (current) current.classList.remove("is-streaming");
            if (ev.kind === "li") {
              if (!list) {
                list = document.createElement("ul");
                list.className = "msg__list";
                body.appendChild(list);
              }
              current = document.createElement("li");
              list.appendChild(current);
            } else {
              list = null;
              current = document.createElement("p");
              current.className = "msg__p";
              body.appendChild(current);
            }
            current.classList.add("is-streaming");
            msg.blocks.push({ kind: ev.kind, text: "" });
          } else if (ev.type === "token") {
            current.textContent += ev.text;
            msg.blocks[msg.blocks.length - 1].text += ev.text;
            follow();
          } else if (ev.type === "done") {
            if (ev.source) msg.source = ev.source;
          }
        }
        msg.status = "done";
        announce("Response complete.");
      } catch (err) {
        if (err && err.name === "AbortError") {
          msg.status = "stopped";
          announce("Response stopped.");
        } else {
          msg.status = "error";
          msg.error = errorInfo(err || {});
          announce(`${msg.error.title}. ${msg.error.text}`);
        }
      } finally {
        state.generating = false;
        state.controller = null;
        syncComposer();
      }
      renderThread();
      const fresh = el.thread.querySelector(`[data-id="${msg.id}"]`);
      if (fresh && document.activeElement === document.body)
        fresh.focus({ preventScroll: true });
      follow();
    }

    function send(text) {
      text = text.trim();
      if (state.generating || (!text && !state.files.length)) return;
      if (!state.messages.length) {
        state.title =
          text.length > 60
            ? text.slice(0, 57) + "…"
            : text || "New conversation";
        el.title.textContent = state.title;
        document.title = `${state.title} — AI Chat — AI Workspace`;
      }
      state.messages.push({
        id: nextId(),
        role: "user",
        text: text || "Please look at the attached files.",
        files: state.files.slice(),
      });
      state.files = [];
      el.input.value = "";
      renderFiles();
      renderThread();
      generate(text || "Summarize the attached files");
    }

    function stop() {
      if (state.controller) state.controller.abort();
    }

    /* ---------- Events ---------- */
    el.form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (state.generating) stop();
      else send(el.input.value);
    });
    el.input.addEventListener("input", syncComposer);
    el.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        if (!state.generating) send(el.input.value);
      }
      if (e.key === "Escape" && state.generating) {
        e.preventDefault();
        stop();
      }
    });
    el.chips.forEach((chip) =>
      chip.addEventListener("click", () => send(chip.dataset.question)),
    );
    $("[data-attach-btn]").addEventListener("click", () => el.file.click());
    el.file.addEventListener("change", () => addFiles(el.file.files));
    el.attach.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove]");
      if (!btn) return;
      state.files.splice(Number(btn.dataset.remove), 1);
      renderFiles();
      el.input.focus();
    });

    el.thread.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const node = btn.closest("[data-id]");
      const msg = state.messages.find((m) => m.id === node.dataset.id);
      const idx = state.messages.indexOf(msg);
      const userMsg = state.messages[idx - 1];
      const action = btn.dataset.action;

      if (action === "copy") {
        const text = msg.blocks
          .map((b) => (b.kind === "li" ? `• ${b.text}` : b.text))
          .join("\n");
        (navigator.clipboard
          ? navigator.clipboard.writeText(text)
          : Promise.reject()
        ).then(
          () => toast("Copied to clipboard."),
          () =>
            toast(
              "Couldn’t copy automatically. Select the text and copy it instead.",
              { tone: "error" },
            ),
        );
      } else if (action === "regenerate" || action === "retry") {
        if (state.generating) return;
        state.messages.splice(idx, 1);
        generate(msg.prompt, {
          variant:
            action === "regenerate" ? (msg.variant || 0) + 1 : msg.variant || 0,
        });
      } else if (action === "continue") {
        if (state.generating) return;
        generate(msg.prompt, { continueMsg: msg });
      } else if (action === "edit") {
        state.messages.splice(idx - 1, 2);
        renderThread();
        el.input.value = userMsg ? userMsg.text : msg.prompt;
        syncComposer();
        el.input.focus();
      } else if (action === "new") {
        location.href = "chat.html?new=1";
      } else if (action === "sources") {
        setContext(true);
        const label = $("[data-ctx-label]");
        label.scrollIntoView({
          block: "nearest",
          behavior: reduce ? "auto" : "smooth",
        });
        label.focus({ preventScroll: true });
      }
    });

    /* menus: model + project (menu open/close handled by the app shell) */
    el.modelMenu.addEventListener("click", (e) => {
      const item = e.target.closest("[data-model]");
      if (!item) return;
      state.model = item.dataset.model;
      renderModels();
      toast(`Using ${models.find((m) => m.id === state.model).name}.`);
    });
    el.projectMenu.addEventListener("click", (e) => {
      const item = e.target.closest("[data-project]");
      if (!item || item.dataset.project === state.project) return;
      state.project = item.dataset.project;
      renderContext();
      if (!state.messages.length) renderThread();
      toast(`Context switched to ${projects[state.project].title}.`);
    });

    /* context panel */
    function setContext(open) {
      el.ctx.hidden = !open;
      el.panel.classList.toggle("is-context-closed", !open);
      el.ctxToggle.setAttribute("aria-expanded", String(open));
      el.ctxToggle.setAttribute(
        "aria-label",
        open ? "Hide context panel" : "Show context panel",
      );
      try {
        localStorage.setItem("aiw-chat-context", open ? "open" : "closed");
      } catch (e) {}
    }
    el.ctxToggle.addEventListener("click", () => setContext(el.ctx.hidden));
    $("[data-ctx-close]").addEventListener("click", () => {
      setContext(false);
      el.ctxToggle.focus();
    });
    let stored = "open";
    try {
      stored = localStorage.getItem("aiw-chat-context") || "open";
    } catch (e) {}
    setContext(stored !== "closed");

    /* ---------- Start ---------- */
    renderContext();
    renderModels();
    renderThread();
    syncComposer();
    bottom();

    const incoming = params.get("prompt");
    if (incoming) setTimeout(() => send(incoming), 300);
  };

  if (window.aiwApp) init();
  else document.addEventListener("aiwapp:ready", init, { once: true });
})();
