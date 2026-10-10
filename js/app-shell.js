/* ==========================================================================
   App shell — sidebar, drawer, topbar (+ notifications), bottom nav, menus,
   search palette, toasts, shortcuts. Pages only provide placeholders:
     <div class="app" data-app data-page="home" data-title="Home">
       <div data-component="app-sidebar"></div>
       <div class="app__main">
         <div data-component="app-topbar"></div>
         <main class="page" id="main" tabindex="-1">…</main>
       </div>
       <div data-component="app-bottom-nav"></div>
     </div>
   ========================================================================== */
(() => {
  const data = window.aiwData;
  const root = document.querySelector("[data-app]");
  if (!root || !data) return;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktop = matchMedia("(min-width: 64rem)");
  const MOD = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
    ? "⌘"
    : "Ctrl";
  const page = root.dataset.page;
  const title = root.dataset.title || "AI Workspace";

  const icon = (name, cls = "") =>
    `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
  const esc = (v) =>
    String(v).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );

  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem("aiw-onboarding")) || {};
  } catch (e) {}
  const workspaceName = stored.workspace || data.workspace;
  const initial = data.owner.charAt(0).toUpperCase();

  /* ---------- Notifications state ---------- */
  const NOTIF_KEY = "aiw-notifs-read";
  const notifs = data.notifications.map((n) => ({ ...n }));
  try {
    if (sessionStorage.getItem(NOTIF_KEY) === "1")
      notifs.forEach((n) => {
        n.unread = false;
      });
  } catch (e) {}
  const unreadCount = () => notifs.filter((n) => n.unread).length;
  const bellLabel = () =>
    unreadCount() ? `Notifications, ${unreadCount()} unread` : "Notifications";

  /* ---------- Navigation model: [key, href, label, icon, dot?] ---------- */
  const nav = {
    Core: [
      ["home", "dashboard.html", "Home", "grid"],
      ["chat", "chat.html", "AI Chat", "chat", true],
      ["conversations", "conversations.html", "Conversations", "chats"],
    ],
    Workspace: [
      ["projects", "projects.html", "Projects", "folder"],
      ["documents", "documents.html", "Documents", "doc"],
      ["knowledge", "knowledge.html", "Knowledge", "book"],
      ["writer", "writer.html", "AI Writer", "pen"],
      ["reports", "reports.html", "Reports", "sparkle"],
      ["prompts", "prompts.html", "Prompt Library", "search"],
    ],
    Manage: [
      ["team", "team.html", "Team", "users"],
      ["usage", "usage.html", "Usage", "chart"],
      ["billing", "billing.html", "Billing", "card"],
      ["settings", "settings.html", "Settings", "gear"],
    ],
  };
  const navGroup = ([label, items]) => `
    <div class="nav-group">
      <p class="nav-group__label" id="ng-${label.toLowerCase()}">${label}</p>
      <ul aria-labelledby="ng-${label.toLowerCase()}">
        ${items
          .map(
            ([key, href, text, ic, dot]) => `
          <li><a href="${href}"${key === page ? ' aria-current="page"' : ""}>${icon(ic)}<span>${text}</span>${dot ? '<span class="nav-dot" role="img" aria-label="New activity"></span>' : ""}</a></li>`,
          )
          .join("")}
      </ul>
    </div>`;

  const notifItem = (n) => `
    <li><div class="notif${n.unread ? " is-unread" : ""}" data-notif="${n.id}">
      <span class="tile tile--coral">${icon("bell")}</span>
      <div><strong>${esc(n.title)}</strong><p>${esc(n.text)}</p></div>
    </div></li>`;

  /* ---------- Templates ---------- */
  const templates = {
    "app-sidebar": `
      <aside class="sidebar" id="sidebar" aria-label="Workspace" data-sidebar inert>
        <div class="sidebar__head">
          <div class="sidebar__brand">
            <div class="menu-wrap">
              <button class="switcher" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="menu-workspace" data-menu-trigger>
                <span class="logo__mark">${icon("logo")}</span><strong>${esc(workspaceName)}</strong>${icon("chevron")}
              </button>
              <div class="menu" id="menu-workspace" role="menu" aria-label="Workspaces" inert>
                <p class="menu__label" aria-hidden="true">Workspaces</p>
                <button class="menu__item" type="button" role="menuitemradio" aria-checked="true">${esc(workspaceName)}${icon("check", "icon--end")}</button>
                <div class="menu__sep" role="separator"></div>
                <a class="menu__item" role="menuitem" href="../onboarding.html">${icon("plus")}Create workspace</a>
              </div>
            </div>
            <button class="icon-btn sidebar__close" type="button" aria-label="Close navigation" data-drawer-close>${icon("close")}</button>
          </div>
          <a class="btn btn--primary btn--block btn--lg" href="chat.html">${icon("plus")}New conversation</a>
          <button class="search-row" type="button" data-open-search>${icon("search")}<span>Search</span><kbd class="kbd">${MOD} K</kbd></button>
        </div>

        <nav class="sidebar__nav" aria-label="Main">${Object.entries(nav).map(navGroup).join("")}</nav>

        <div class="sidebar__foot">
          <a class="usage-mini" href="usage.html" style="--value:${data.usage.percent}%">
            <span class="usage-mini__row"><span>Monthly usage</span><b>${data.usage.percent}%</b></span>
            <span class="usage-mini__bar" aria-hidden="true"><i></i></span>
            <span class="usage-mini__link">View usage ${icon("arrow", "icon--arrow")}</span>
          </a>
          <div class="menu-wrap">
            <button class="profile-btn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="menu-profile" data-menu-trigger>
              <span class="avatar" aria-hidden="true">${esc(initial)}</span>
              <span class="profile-btn__text"><strong>${esc(data.owner)}</strong><small>${esc(workspaceName)}</small></span>
              ${icon("dots")}<span class="visually-hidden">Account menu</span>
            </button>
            <div class="menu menu--up" id="menu-profile" role="menu" aria-label="Account" inert>
              <a class="menu__item" role="menuitem" href="profile.html">${icon("user")}Profile</a>
              <a class="menu__item" role="menuitem" href="settings.html">${icon("gear")}Settings</a>
              <div class="menu__sep" role="separator"></div>
              <a class="menu__item" role="menuitem" href="../login.html">${icon("logout")}Sign out</a>
            </div>
          </div>
        </div>
      </aside>
      <div class="scrim" data-scrim></div>`,

    "app-topbar": `
      <header class="topbar">
        <div class="topbar__start">
          <button class="icon-btn topbar__menu" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="sidebar" data-drawer-open>${icon("menu")}</button>
          <nav class="crumbs" aria-label="Breadcrumb"><ol><li>${esc(workspaceName)}</li><li aria-current="page">${esc(title)}</li></ol></nav>
        </div>
        <p class="topbar__title">${esc(title)}</p>
        <div class="topbar__actions">
          <button class="search-pill" type="button" data-open-search>${icon("search")}<span>Search workspace</span><kbd class="kbd">${MOD} K</kbd></button>
          <button class="icon-btn theme-toggle" type="button" data-app-theme aria-label="Switch to dark theme">${icon("moon", "icon--moon")}${icon("sun", "icon--sun")}</button>
          <div class="menu-wrap">
            <button class="icon-btn notif-btn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="notif-panel" aria-label="${bellLabel()}" data-notif-trigger>
              ${icon("bell")}${unreadCount() ? '<span class="notif-dot" aria-hidden="true"></span>' : ""}
            </button>
            <section class="popover" id="notif-panel" role="dialog" aria-label="Notifications" inert>
              <div class="popover__head"><h2>Notifications</h2><button class="icon-btn" type="button" aria-label="Close notifications" data-notif-close>${icon("close")}</button></div>
              <ul class="notif-list">${notifs.map(notifItem).join("")}</ul>
              <div class="popover__foot"><button class="mark-read" type="button" data-mark-read>Mark all as read ${icon("check")}</button></div>
              <p class="visually-hidden" role="status" aria-live="polite" data-notif-status></p>
            </section>
          </div>
        </div>
      </header>`,

    "app-bottom-nav": `
      <nav class="bottom-nav" aria-label="Quick navigation">
        <ul>
          <li><a href="dashboard.html"${page === "home" ? ' aria-current="page"' : ""}><span class="icon-wrap">${icon("grid")}</span>Home</a></li>
          <li><a href="chat.html"${page === "chat" ? ' aria-current="page"' : ""}><span class="icon-wrap">${icon("chat")}</span>Chat</a></li>
          <li><a href="projects.html"${page === "projects" ? ' aria-current="page"' : ""}><span class="icon-wrap">${icon("folder")}</span>Projects</a></li>
          <li><a href="documents.html"${page === "documents" ? ' aria-current="page"' : ""}><span class="icon-wrap">${icon("doc")}</span>Documents</a></li>
          <li><a href="writer.html"${page === "writer" ? ' aria-current="page"' : ""}><span class="icon-wrap">${icon("pen")}</span>AI Writer</a></li>
        </ul>
      </nav>`,
  };

  function mount() {
    document.querySelectorAll("[data-component]").forEach((slot) => {
      const html = templates[slot.dataset.component];
      if (!html) return;
      const tpl = document.createElement("template");
      tpl.innerHTML = html.trim();
      slot.replaceWith(tpl.content);
    });
    initDrawer();
    initMenus();
    initThemeButton();
    initNotifications();
    const toast = initToasts();
    const openSearch = initPalette();
    initShortcuts(openSearch);
    window.aiwApp = { toast, openSearch, data, icon, esc };
    document.dispatchEvent(new CustomEvent("aiwapp:ready"));
  }

  /* ---------- Drawer (mobile) ---------- */
  function initDrawer() {
    const sidebar = document.querySelector("[data-sidebar]");
    const scrim = document.querySelector("[data-scrim]");
    const openers = document.querySelectorAll("[data-drawer-open]");
    let opener = null;
    const isOpen = () => sidebar.classList.contains("is-open");

    function open(trigger) {
      opener = trigger;
      sidebar.removeAttribute("inert");
      sidebar.classList.add("is-open");
      scrim.classList.add("is-open");
      document.body.classList.add("is-locked");
      openers.forEach((b) => b.setAttribute("aria-expanded", "true"));
      requestAnimationFrame(() =>
        sidebar.querySelector("[data-drawer-close]").focus(),
      );
    }
    function close(refocus = true) {
      if (!isOpen()) return;
      sidebar.classList.remove("is-open");
      scrim.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      openers.forEach((b) => b.setAttribute("aria-expanded", "false"));
      if (!desktop.matches) sidebar.setAttribute("inert", "");
      if (refocus && opener) opener.focus();
    }
    function sync() {
      if (desktop.matches) {
        close(false);
        sidebar.removeAttribute("inert");
      } else if (!isOpen()) sidebar.setAttribute("inert", "");
    }

    openers.forEach((b) => b.addEventListener("click", () => open(b)));
    sidebar
      .querySelector("[data-drawer-close]")
      .addEventListener("click", () => close());
    scrim.addEventListener("click", () => close());
    sidebar.addEventListener("click", (e) => {
      if (e.target.closest("a[href]")) close(false);
    });
    sidebar.addEventListener("keydown", (e) => {
      if (e.key !== "Tab" || desktop.matches || !isOpen()) return;
      const f = [
        ...sidebar.querySelectorAll("a[href], button:not([disabled])"),
      ].filter((el) => el.offsetParent !== null && !el.closest("[inert]"));
      if (!f.length) return;
      const first = f[0],
        last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        isOpen() &&
        !document.querySelector(".menu.is-open, .popover.is-open") &&
        !document.querySelector("dialog[open]")
      )
        close();
    });
    desktop.addEventListener("change", sync);
    sync();
  }

  /* ---------- Menus (workspace, account, any page-level menu) ---------- */
  function initMenus() {
    const all = [];
    document.querySelectorAll("[data-menu-trigger]").forEach((trigger) => {
      const menu = document.getElementById(
        trigger.getAttribute("aria-controls"),
      );
      const items = () => [...menu.querySelectorAll('[role^="menuitem"]')];
      const api = {
        menu,
        close(refocus = true) {
          trigger.setAttribute("aria-expanded", "false");
          menu.classList.remove("is-open");
          menu.setAttribute("inert", "");
          if (refocus) trigger.focus();
        },
        open() {
          all.forEach((m) => {
            if (m !== api) m.close(false);
          });
          trigger.setAttribute("aria-expanded", "true");
          menu.classList.add("is-open");
          menu.removeAttribute("inert");
          requestAnimationFrame(() => {
            const first = items()[0];
            if (first) first.focus();
          });
        },
      };
      all.push(api);

      trigger.addEventListener("click", () =>
        trigger.getAttribute("aria-expanded") === "true"
          ? api.close()
          : api.open(),
      );
      trigger.addEventListener("keydown", (e) => {
        if (
          e.key === "ArrowDown" &&
          trigger.getAttribute("aria-expanded") !== "true"
        ) {
          e.preventDefault();
          api.open();
        }
      });

      menu.addEventListener("keydown", (e) => {
        const list = items();
        const i = list.indexOf(document.activeElement);
        if (e.key === "ArrowDown") {
          e.preventDefault();
          list[(i + 1) % list.length].focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          list[(i - 1 + list.length) % list.length].focus();
        } else if (e.key === "Home") {
          e.preventDefault();
          list[0].focus();
        } else if (e.key === "End") {
          e.preventDefault();
          list[list.length - 1].focus();
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          api.close();
        } else if (e.key === "Tab") api.close(false);
      });
      menu.addEventListener("click", (e) => {
        if (e.target.closest('[role^="menuitem"]')) api.close(false);
      });
    });

    document.addEventListener("pointerdown", (e) => {
      all.forEach((m) => {
        if (
          m.menu.classList.contains("is-open") &&
          !m.menu.parentElement.contains(e.target)
        )
          m.close(false);
      });
    });
  }

  /* ---------- Theme button (top bar) ---------- */
  function initThemeButton() {
    const btn = document.querySelector("[data-app-theme]");
    if (!btn) return;
    const sync = () =>
      btn.setAttribute(
        "aria-label",
        window.aiwTheme.get() === "dark"
          ? "Switch to light theme"
          : "Switch to dark theme",
      );
    btn.addEventListener("click", () => window.aiwTheme.toggle());
    document.addEventListener("themechange", sync);
    sync();
  }

  /* ---------- Notifications popover ---------- */
  function initNotifications() {
    const trigger = document.querySelector("[data-notif-trigger]");
    const panel = document.getElementById("notif-panel");
    if (!trigger || !panel) return;
    const closeBtn = panel.querySelector("[data-notif-close]");
    const markBtn = panel.querySelector("[data-mark-read]");
    const status = panel.querySelector("[data-notif-status]");

    const isOpen = () => panel.classList.contains("is-open");
    function open() {
      trigger.setAttribute("aria-expanded", "true");
      panel.classList.add("is-open");
      panel.removeAttribute("inert");
      requestAnimationFrame(() => closeBtn.focus());
    }
    function close(refocus = true) {
      trigger.setAttribute("aria-expanded", "false");
      panel.classList.remove("is-open");
      panel.setAttribute("inert", "");
      if (refocus) trigger.focus();
    }
    function renderState() {
      const none = unreadCount() === 0;
      markBtn.disabled = none;
      markBtn.firstChild.textContent = none
        ? "All caught up "
        : "Mark all as read ";
      trigger.setAttribute("aria-label", bellLabel());
      const dot = trigger.querySelector(".notif-dot");
      if (none && dot) dot.remove();
      panel.querySelectorAll("[data-notif]").forEach((el) => {
        const n = notifs.find((x) => x.id === el.dataset.notif);
        el.classList.toggle("is-unread", n.unread);
      });
    }

    trigger.addEventListener("click", () => (isOpen() ? close() : open()));
    closeBtn.addEventListener("click", () => close());
    markBtn.addEventListener("click", () => {
      notifs.forEach((n) => {
        n.unread = false;
      });
      try {
        sessionStorage.setItem(NOTIF_KEY, "1");
      } catch (e) {}
      renderState();
      status.textContent = "All notifications marked as read.";
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) {
        e.stopPropagation();
        close();
      }
    });
    document.addEventListener("pointerdown", (e) => {
      if (isOpen() && !panel.parentElement.contains(e.target)) close(false);
    });
    renderState();
  }

  /* ---------- Toasts ---------- */
  function initToasts() {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div class="toast-region" aria-live="polite" aria-atomic="false"></div>',
    );
    const region = document.querySelector(".toast-region");
    return function toast(message, { tone = "success", duration = 4500 } = {}) {
      const el = document.createElement("div");
      el.className = `toast toast--${tone}`;
      el.innerHTML = `${icon(tone === "error" ? "close" : "check")}<p>${esc(message)}</p><button class="toast__close" type="button" aria-label="Dismiss notification">${icon("close")}</button>`;
      region.appendChild(el);
      const remove = () => {
        el.classList.add("is-leaving");
        setTimeout(() => el.remove(), reduceMotion ? 0 : 250);
      };
      el.querySelector("button").addEventListener("click", remove);
      if (duration) setTimeout(remove, duration);
    };
  }

  /* ---------- Search palette ---------- */
  function initPalette() {
    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <dialog class="palette" id="palette" aria-label="Search workspace">
        <div class="palette__search">
          ${icon("search")}
          <input class="palette__input" id="palette-input" type="text" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list" aria-label="Search workspace" placeholder="Search workspace…" autocomplete="off" spellcheck="false">
          <kbd class="kbd">ESC</kbd>
        </div>
        <div class="palette__list" id="palette-list" role="listbox" aria-label="Results"></div>
        <p class="visually-hidden" role="status" aria-live="polite" id="palette-status"></p>
      </dialog>`,
    );

    const dlg = document.getElementById("palette");
    const input = document.getElementById("palette-input");
    const list = document.getElementById("palette-list");
    const status = document.getElementById("palette-status");

    const pagesAll = Object.values(nav)
      .flat()
      .map(([key, href, label]) => ({ kind: "page", key, title: label, href }));
    const goKeys = [
      "home",
      "chat",
      "projects",
      "documents",
      "knowledge",
      "writer",
      "reports",
      "prompts",
      "team",
      "usage",
      "settings",
    ];
    const goTo = goKeys.map((k) => pagesAll.find((p) => p.key === k));
    const recent = data.sessions.map((s) => ({
      kind: "recent",
      title: s.title,
      href: `chat.html?id=${s.id}`,
    }));
    const content = {
      Conversations: data.sessions.map((s) => ({
        kind: "content",
        icon: "chat",
        title: s.title,
        meta: "Conversation",
        href: `chat.html?id=${s.id}`,
      })),
      Projects: data.projects.map((p) => ({
        kind: "content",
        icon: "folder",
        title: p.title,
        meta: "Project",
        href: `projects.html?id=${p.id}`,
      })),
      Documents: data.documents.map((d) => ({
        kind: "content",
        icon: "doc",
        title: d.name,
        meta: "Document",
        href: `documents.html?id=${d.id}`,
      })),
    };

    let flat = [];
    let active = 0;

    function groupsFor(q) {
      const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.length)
        return [
          { label: "Go to", items: goTo },
          { label: "Recent", items: recent },
        ];
      const hit = (e) =>
        terms.every((t) =>
          `${e.title} ${e.meta || ""}`.toLowerCase().includes(t),
        );
      const out = [];
      const add = (label, items) => {
        const r = items.filter(hit).slice(0, 6);
        if (r.length) out.push({ label, items: r });
      };
      add("Go to", pagesAll);
      Object.entries(content).forEach(([label, items]) => add(label, items));
      return out;
    }

    const lead = (e) =>
      e.kind === "page"
        ? '<span class="palette__glyph" aria-hidden="true">⌘</span>'
        : `<span class="palette__glyph" aria-hidden="true">${icon(e.kind === "recent" ? "clock" : e.icon)}</span>`;

    function render() {
      const q = input.value;
      const groups = groupsFor(q);
      flat = groups.flatMap((g) => g.items);
      active = 0;
      if (!flat.length) {
        list.innerHTML = `<p class="palette__empty">No results for “${esc(q.trim())}”. Try a project, document, or page name.</p>`;
        status.textContent = "No results";
        input.removeAttribute("aria-activedescendant");
        return;
      }
      let n = 0;
      list.innerHTML = groups
        .map(
          (g, gi) => `
        <div role="group" aria-labelledby="pal-g${gi}">
          <p class="palette__group-label" id="pal-g${gi}">${g.label}</p>
          ${g.items
            .map((e) => {
              const i = n++;
              return `
            <div class="palette__item" role="option" id="pal-${i}" aria-selected="${i === 0}" data-index="${i}">
              ${lead(e)}<span class="palette__title">${esc(e.title)}</span>
              ${e.meta ? `<span class="palette__meta">${esc(e.meta)}</span>` : ""}${icon("chevron-right", "palette__go")}
            </div>`;
            })
            .join("")}
        </div>`,
        )
        .join("");
      input.setAttribute("aria-activedescendant", "pal-0");
      status.textContent = `${flat.length} result${flat.length === 1 ? "" : "s"}`;
    }

    function setActive(i) {
      active = (i + flat.length) % flat.length;
      list
        .querySelectorAll('[role="option"]')
        .forEach((el) =>
          el.setAttribute(
            "aria-selected",
            String(Number(el.dataset.index) === active),
          ),
        );
      input.setAttribute("aria-activedescendant", `pal-${active}`);
      document
        .getElementById(`pal-${active}`)
        .scrollIntoView({ block: "nearest" });
    }
    const go = (entry) => {
      if (entry) location.href = entry.href;
    };

    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
      if (!flat.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive(active + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive(active - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        setActive(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setActive(flat.length - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        go(flat[active]);
      }
    });
    list.addEventListener("mousemove", (e) => {
      const el = e.target.closest('[role="option"]');
      if (el && Number(el.dataset.index) !== active)
        setActive(Number(el.dataset.index));
    });
    list.addEventListener("click", (e) => {
      const el = e.target.closest('[role="option"]');
      if (el) go(flat[Number(el.dataset.index)]);
    });
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) dlg.close();
    });

    function openSearch(query = "") {
      if (!dlg.open) dlg.showModal();
      input.value = query;
      render();
      input.focus();
    }
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-open-search]");
      if (trigger) openSearch(trigger.dataset.openSearch || "");
    });
    return openSearch;
  }

  /* ---------- Shortcuts ---------- */
  function initShortcuts(openSearch) {
    const typing = (el) =>
      el &&
      (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch("");
        return;
      }
      if (e.altKey && e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        location.href = "chat.html";
        return;
      }
      if (
        e.key === "/" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !typing(document.activeElement) &&
        !document.querySelector("dialog[open]")
      ) {
        const composer = document.querySelector("[data-composer]");
        if (composer) {
          e.preventDefault();
          composer.focus();
        }
      }
    });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
