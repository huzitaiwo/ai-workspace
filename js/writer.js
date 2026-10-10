/* ==========================================================================
   AI Writer — plain-text editor with markdown-style formatting, selection
   tools (Improve / Shorten / Change tone / Continue), writing partner,
   versions (non-destructive restore), export, share, autosave.
   ========================================================================== */
(() => {
  const init = () => {
    const { data, esc, icon, toast } = window.aiwApp;
    const wr = window.aiService.writer;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];

    const el = {
      title: $("[data-w-title]"),
      text: $("[data-w-text]"),
      count: $("[data-w-count]"),
      saved: $("[data-saved]"),
      savedText: $("[data-saved-text]"),
      versionLabel: $("[data-version-label]"),
      versionMenu: $("#menu-versions"),
      tabs: $$('[role="tab"]'),
      panels: $$('[role="tabpanel"]'),
      busy: $("[data-busy]"),
      busyText: $("[data-busy-text]"),
      chips: $$("[data-edit], [data-tone-trigger]"),
      undo: $("[data-undo]"),
      live: $("[data-w-status]"),
      partner: $("[data-partner-result]"),
      sourcesList: $("[data-sources-list]"),
      versionsList: $("[data-versions-list]"),
      shareDlg: $("#share-dialog"),
      shareForm: $("[data-share-form]"),
    };

    /* ---------- State ---------- */
    const P1 =
      "Great digital work does not begin with a tool. It begins with a shared understanding of the question, the evidence, and the decision that needs to follow.";
    const P2 =
      "AI Workspace is designed to keep those elements together. The result is a place where research can become a point of view without losing the sources that made it credible.";
    const TITLE = "A clearer path through the work";
    const BODY = `${P1}\n\n${P2}`;
    const minutes = (m) => Date.now() - m * 60000;

    const seed = () => ({
      title: TITLE,
      body: BODY,
      share: "private",
      savedAt: Date.now(),
      versions: [
        {
          n: 1,
          title: TITLE,
          body: "Great digital work does not begin with a tool.",
          at: minutes(5800),
          note: "First draft",
        },
        { n: 2, title: TITLE, body: P1, at: minutes(4400), note: "" },
        {
          n: 3,
          title: TITLE,
          body: `${P1}\n\nAI Workspace is designed to keep those elements together.`,
          at: minutes(2900),
          note: "",
        },
        {
          n: 4,
          title: TITLE,
          body: `${P1}\n\nAI Workspace keeps research, drafts, and decisions together.`,
          at: minutes(1500),
          note: "",
        },
        {
          n: 5,
          title: TITLE,
          body: `${P1}\n\n${P2.replace("The result is a place where research can become a point of view without losing the sources that made it credible.", "The result is a place where research can become a point of view.")}`,
          at: minutes(130),
          note: "",
        },
        {
          n: 6,
          title: TITLE,
          body: BODY,
          at: Date.now(),
          note: "Current draft",
        },
      ],
    });
    const load = () => {
      try {
        return JSON.parse(localStorage.getItem("aiw-writer"));
      } catch (e) {
        return null;
      }
    };
    const persist = () => {
      try {
        localStorage.setItem("aiw-writer", JSON.stringify(state));
      } catch (e) {}
    };
    const state = load() || seed();
    const latest = () => state.versions[state.versions.length - 1];
    const announce = (t) => {
      el.live.textContent = "";
      setTimeout(() => {
        el.live.textContent = t;
      }, 40);
    };

    el.title.value = state.title;
    el.text.value = state.body;

    /* ---------- Counts + save status ---------- */
    const words = () => (el.text.value.trim().match(/\S+/g) || []).length;
    const updateCount = () => {
      el.count.textContent = `${words()} words`;
    };
    const agoText = () => {
      const m = Math.floor((Date.now() - state.savedAt) / 60000);
      return m < 1 ? "Saved just now" : `Saved ${m} min ago`;
    };
    const showSaved = () => {
      el.saved.classList.remove("is-saving");
      el.savedText.textContent = agoText();
    };
    let saveTimer = 0;
    function markDirty() {
      el.saved.classList.add("is-saving");
      el.savedText.textContent = "Saving…";
      clearTimeout(saveTimer);
      saveTimer = setTimeout(
        () => {
          state.title = el.title.value;
          state.body = el.text.value;
          state.savedAt = Date.now();
          persist();
          showSaved();
        },
        reduce ? 0 : 700,
      );
    }
    setInterval(() => {
      if (!el.saved.classList.contains("is-saving")) showSaved();
    }, 30000);
    showSaved();
    updateCount();

    /* ---------- Text helpers (execCommand keeps native undo working) ---------- */
    function replaceRange(start, end, value, select = true) {
      el.text.focus();
      el.text.setSelectionRange(start, end);
      let ok = false;
      try {
        ok = document.execCommand("insertText", false, value);
      } catch (e) {}
      if (!ok) {
        el.text.setRangeText(value, start, end, "end");
        el.text.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (select) el.text.setSelectionRange(start, start + value.length);
    }
    const paragraphBounds = () => {
      const t = el.text.value,
        pos = el.text.selectionStart;
      const s = t.lastIndexOf("\n\n", Math.max(pos - 1, 0));
      const e = t.indexOf("\n\n", pos);
      return [s === -1 ? 0 : s + 2, e === -1 ? t.length : e];
    };
    const lineBounds = () => {
      const t = el.text.value;
      const s =
        t.lastIndexOf("\n", Math.max(el.text.selectionStart - 1, 0)) + 1;
      let e = t.indexOf("\n", el.text.selectionEnd);
      if (e === -1) e = t.length;
      return [s, e];
    };

    /* ---------- Formatting ---------- */
    function wrap(mark, placeholder) {
      const [s, e] = [el.text.selectionStart, el.text.selectionEnd];
      const sel = el.text.value.slice(s, e) || placeholder;
      replaceRange(s, e, `${mark}${sel}${mark}`, false);
      el.text.setSelectionRange(s + mark.length, s + mark.length + sel.length);
    }
    function prefixLines(prefix) {
      const [s, e] = lineBounds();
      const block = el.text.value.slice(s, e);
      const lines = block.split("\n");
      const all = lines.every((l) => l.startsWith(prefix));
      replaceRange(
        s,
        e,
        lines
          .map((l) =>
            all
              ? l.slice(prefix.length)
              : prefix + l.replace(/^(#{1,6} |- |> )/, ""),
          )
          .join("\n"),
        false,
      );
    }
    $("[data-fmt-bar]").addEventListener("click", (e) => {
      const b = e.target.closest("[data-fmt]");
      if (!b) return;
      const f = b.dataset.fmt;
      if (f === "bold") wrap("**", "bold text");
      else if (f === "italic") wrap("_", "italic text");
      else if (f === "h2") prefixLines("## ");
      else if (f === "list") prefixLines("- ");
      else if (f === "quote") prefixLines("> ");
    });
    el.text.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
        if (e.key.toLowerCase() === "b") {
          e.preventDefault();
          wrap("**", "bold text");
        }
        if (e.key.toLowerCase() === "i") {
          e.preventDefault();
          wrap("_", "italic text");
        }
      }
    });
    el.text.addEventListener("input", () => {
      updateCount();
      markDirty();
      el.undo.hidden = true;
    });
    el.title.addEventListener("input", markDirty);

    /* ---------- Selection tools ---------- */
    let busy = false,
      lastEdit = null;
    const labels = {
      improve: "Improving",
      shorten: "Shortening",
      tone: "Adjusting tone",
      continue: "Continuing",
    };
    function setBusy(on, label) {
      busy = on;
      el.chips.forEach((c) => {
        c.disabled = on;
      });
      el.busy.hidden = !on;
      el.busyText.textContent = on ? `${label}…` : "";
      el.text.setAttribute("aria-busy", String(on));
      if (on) announce(`${label}.`);
    }
    async function runEdit(action, tone) {
      if (busy) return;
      if (!el.text.value.trim())
        return toast("Write something first, then use the selection tools.", {
          tone: "error",
        });
      let [s, e] = [el.text.selectionStart, el.text.selectionEnd];
      if (s === e) [s, e] = paragraphBounds();
      const before = el.text.value.slice(s, e);
      setBusy(true, labels[action === "tone" ? "tone" : action]);
      try {
        const res = await wr.edit({ action, tone, text: before });
        if (res.unchanged) {
          toast(res.note);
          announce(res.note);
        } else if (res.append) {
          const at = el.text.value.length;
          replaceRange(at, at, `${at ? "\n\n" : ""}${res.append}`, false);
          lastEdit = {
            start: at,
            length: res.append.length + (at ? 2 : 0),
            before: "",
          };
          el.undo.hidden = false;
          announce("Continuation added.");
        } else {
          replaceRange(s, e, res.text);
          lastEdit = { start: s, length: res.text.length, before };
          el.undo.hidden = false;
          announce("Edit applied. Use Undo edit to revert.");
        }
      } catch (err) {
        toast("That edit didn’t finish. Your text is unchanged — try again.", {
          tone: "error",
        });
      } finally {
        setBusy(false);
      }
    }
    $("[data-edits]").addEventListener("click", (e) => {
      const b = e.target.closest("[data-edit]");
      if (b) runEdit(b.dataset.edit);
      const t = e.target.closest("[data-tone]");
      if (t) runEdit("tone", t.dataset.tone);
    });
    el.undo.addEventListener("click", () => {
      if (!lastEdit) return;
      replaceRange(
        lastEdit.start,
        lastEdit.start + lastEdit.length,
        lastEdit.before,
        false,
      );
      lastEdit = null;
      el.undo.hidden = true;
      toast("Edit undone.");
    });

    /* ---------- Writing partner ---------- */
    const projectSources = (
      data.projects.find((p) => p.id === "website-redesign") || { sources: [] }
    ).sources;
    let assisting = false;
    async function runAssist(kind, btn) {
      if (assisting) return;
      if (!el.text.value.trim())
        return toast(
          "Write a little first so the partner has something to work with.",
          { tone: "error" },
        );
      assisting = true;
      $$("[data-assist]").forEach((b) => {
        b.disabled = true;
      });
      el.partner.innerHTML = `<p class="partner-loading"><span class="spinner" aria-hidden="true"></span>Reading your draft…</p>`;
      try {
        const r = await wr.assist(kind, { sources: projectSources });
        el.partner.innerHTML = `<h3>${esc(r.title)}</h3>
          ${r.summary ? `<p class="partner-result__summary">${esc(r.summary)}</p>` : ""}
          <ul>${r.items.map((i) => (typeof i === "string" ? `<li>${esc(i)}</li>` : `<li><strong>${esc(i.tag)}</strong>${esc(i.text)}</li>`)).join("")}</ul>
          <div class="partner-result__actions">${r.insert ? `<button class="btn btn--primary" type="button" data-insert>${esc(r.insertLabel)}</button>` : ""}<button class="btn btn--secondary" type="button" data-dismiss>Dismiss</button></div>`;
        el.partner._insert = r.insert;
        announce(`${r.title} ready.`);
      } catch (err) {
        el.partner.innerHTML =
          "<p>The writing partner couldn’t respond. Try again in a moment.</p>";
      } finally {
        assisting = false;
        $$("[data-assist]").forEach((b) => {
          b.disabled = false;
        });
      }
    }
    $("[data-partner-list]").addEventListener("click", (e) => {
      const b = e.target.closest("[data-assist]");
      if (b) runAssist(b.dataset.assist, b);
    });
    el.partner.addEventListener("click", (e) => {
      if (e.target.closest("[data-dismiss]")) el.partner.innerHTML = "";
      if (e.target.closest("[data-insert]")) {
        const at = el.text.value.length;
        replaceRange(at, at, `${at ? "\n\n" : ""}${el.partner._insert}`, false);
        el.partner.innerHTML = "";
        toast("Outline inserted.");
      }
    });

    /* ---------- Tabs ---------- */
    function setTab(name, focus) {
      el.tabs.forEach((t) => {
        const on = t.dataset.tab === name;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      el.panels.forEach((p) => {
        p.hidden = p.dataset.panel !== name;
      });
      if (name === "versions") renderVersions();
    }
    el.tabs.forEach((t, i) => {
      t.addEventListener("click", () => setTab(t.dataset.tab));
      t.addEventListener("keydown", (e) => {
        const next = {
          ArrowDown: i + 1,
          ArrowUp: i - 1,
          Home: 0,
          End: el.tabs.length - 1,
        }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        setTab(
          el.tabs[(next + el.tabs.length) % el.tabs.length].dataset.tab,
          true,
        );
      });
    });

    /* ---------- Sources ---------- */
    el.sourcesList.innerHTML = projectSources
      .map(
        (name) => `<li><div class="row">
      <span class="file-chip" aria-hidden="true">${esc(name.split(".").pop().toUpperCase())}</span>
      <span class="row__body"><strong>${esc(name)}</strong><span>Website Redesign · Ready for analysis</span></span>
      <button class="btn btn--secondary btn--sm" type="button" data-insert-ref="${esc(name)}">Insert reference</button></div></li>`,
      )
      .join("");
    el.sourcesList.addEventListener("click", (e) => {
      const b = e.target.closest("[data-insert-ref]");
      if (!b) return;
      setTab("draft");
      const pos = el.text.selectionEnd || el.text.value.length;
      replaceRange(pos, pos, ` [Source: ${b.dataset.insertRef}]`, false);
      toast("Reference inserted.");
    });

    /* ---------- Versions ---------- */
    const ago = (at) =>
      data.ago(Math.max(0, Math.floor((Date.now() - at) / 60000)));
    function syncVersionUI() {
      const cur = latest();
      el.versionLabel.textContent = `Version ${cur.n}`;
      const recent = state.versions.slice().reverse().slice(0, 6);
      el.versionMenu.innerHTML =
        '<p class="menu__label" aria-hidden="true">Version history</p>' +
        recent
          .map(
            (v, i) =>
              `<button class="menu__item" type="button" role="menuitem" data-restore="${v.n}"><span class="menu__text"><strong>Version ${v.n}${i === 0 ? " · Current" : ""}</strong><small>${ago(v.at)}${v.note && i !== 0 ? " · " + esc(v.note) : ""}</small></span></button>`,
          )
          .join("");
    }
    function renderVersions() {
      const rev = state.versions.slice().reverse();
      el.versionsList.innerHTML = rev
        .map(
          (v, i) => `<li><div class="row">
        <span class="tile tile--${i === 0 ? "mint" : "sand"}">${icon("clock")}</span>
        <span class="row__body"><strong>Version ${v.n}${i === 0 ? " · Current" : ""}</strong><span>${ago(v.at)} · ${esc(data.owner)}${v.note ? " · " + esc(v.note) : ""}</span></span>
        ${i === 0 ? "" : `<button class="btn btn--secondary btn--sm" type="button" data-restore="${v.n}">Restore</button>`}</div></li>`,
        )
        .join("");
    }
    function snapshotIfChanged(note) {
      state.body = el.text.value;
      state.title = el.title.value;
      const cur = latest();
      if (cur.body === state.body && cur.title === state.title) return false;
      state.versions.push({
        n: cur.n + 1,
        title: state.title,
        body: state.body,
        at: Date.now(),
        note,
      });
      return true;
    }
    function restore(n) {
      const v = state.versions.find((x) => x.n === n);
      if (!v || n === latest().n) return;
      snapshotIfChanged("Autosaved before restore");
      state.versions.push({
        n: latest().n + 1,
        title: v.title,
        body: v.body,
        at: Date.now(),
        note: `Restored from Version ${n}`,
      });
      el.title.value = v.title;
      el.text.value = v.body;
      state.title = v.title;
      state.body = v.body;
      state.savedAt = Date.now();
      persist();
      updateCount();
      syncVersionUI();
      renderVersions();
      showSaved();
      toast(`Restored Version ${n} as Version ${latest().n}.`);
      announce(`Version ${n} restored as Version ${latest().n}.`);
    }
    document.addEventListener("click", (e) => {
      const r = e.target.closest("[data-restore]");
      if (r) restore(Number(r.dataset.restore));
    });
    $("[data-save-version]").addEventListener("click", () => {
      if (!snapshotIfChanged("Saved manually"))
        return toast(`No changes since Version ${latest().n}.`);
      persist();
      syncVersionUI();
      renderVersions();
      toast(`Saved as Version ${latest().n}.`);
    });
    syncVersionUI();

    /* ---------- Export ---------- */
    const slug = () =>
      (el.title.value || "draft")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "draft";
    function download(name, type, content) {
      const url = URL.createObjectURL(new Blob([content], { type }));
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    $("#menu-export").addEventListener("click", (e) => {
      const b = e.target.closest("[data-export]");
      if (!b) return;
      const md = `# ${el.title.value}\n\n${el.text.value}\n`;
      if (b.dataset.export === "md") {
        download(`${slug()}.md`, "text/markdown", md);
        toast("Markdown file downloaded.");
      } else if (b.dataset.export === "txt") {
        download(
          `${slug()}.txt`,
          "text/plain",
          `${el.title.value}\n\n${el.text.value.replace(/[*_#>]/g, "")}\n`,
        );
        toast("Text file downloaded.");
      } else
        (navigator.clipboard
          ? navigator.clipboard.writeText(md)
          : Promise.reject()
        ).then(
          () => toast("Copied to clipboard."),
          () =>
            toast("Couldn’t copy automatically. Select the text and copy it.", {
              tone: "error",
            }),
        );
    });

    /* ---------- Share ---------- */
    const shareLabels = {
      private: "Private",
      workspace: "Workspace",
      link: "Shared link",
    };
    $("[data-share]").addEventListener("click", () => {
      el.shareForm.elements.visibility.value = state.share;
      el.shareDlg.showModal();
    });
    el.shareDlg
      .querySelectorAll("[data-dialog-close]")
      .forEach((b) => b.addEventListener("click", () => el.shareDlg.close()));
    el.shareDlg.addEventListener("click", (e) => {
      if (e.target === el.shareDlg) el.shareDlg.close();
    });
    el.shareForm.addEventListener("submit", (e) => {
      e.preventDefault();
      state.share = el.shareForm.elements.visibility.value;
      persist();
      el.shareDlg.close();
      toast(`Sharing set to ${shareLabels[state.share]}.`);
    });

    /* ---------- Save before leaving ---------- */
    addEventListener("beforeunload", () => {
      state.title = el.title.value;
      state.body = el.text.value;
      persist();
    });
  };

  if (window.aiwApp) init();
  else document.addEventListener("aiwapp:ready", init, { once: true });
})();
