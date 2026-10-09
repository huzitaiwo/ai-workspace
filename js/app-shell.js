/* ==========================================================================
   App shell — sidebar, drawer, topbar, bottom nav, menus, search palette,
   toasts and global shortcuts. Pages only provide placeholders:
     <div class="app" data-app data-page="home" data-title="Home">
       <div data-component="app-sidebar"></div>
       <div class="app__main">
         <div data-component="app-topbar"></div>
         <main class="page" id="main">…</main>
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
  const workspaceName = stored.workspace || `${data.owner}’s workspace`;

  /* ---------- Navigation model ---------- */
  const primary = [
    ["home", "dashboard.html", "Home", "home"],
    ["conversations", "conversations.html", "Conversations", "chat"],
    ["projects", "projects.html", "Projects", "folder"],
    ["documents", "documents.html", "Documents", "doc"],
    ["knowledge", "knowledge.html", "Knowledge", "book"],
    ["writer", "writer.html", "AI Writer", "pen"],
    ["reports", "reports.html", "Reports", "report"],
    ["prompts", "prompts.html", "Prompt Library", "prompt"],
    ["team", "team.html", "Team", "users"],
  ];
  const secondary = [
    ["usage", "usage.html", "Usage", "chart"],
    ["settings", "settings.html", "Settings", "settings"],
  ];
  const navItems = (items) =>
    items
      .map(
        ([key, href, label, ic]) =>
          `<li><a href="${href}"${key === page ? ' aria-current="page"' : ""}>${icon(ic)}<span>${label}</span></a></li>`,
      )
      .join("");

  const unread = data.unreadNotifications;
  const bellLabel = unread
    ? `Notifications, ${unread} unread`
    : "Notifications";

  /* ---------- Templates ---------- */
  const templates = {
    "app-sidebar": `
      <aside class="sidebar" id="sidebar" aria-label="Workspace" data-sidebar inert>
        <div class="sidebar__top">
          <div class="menu-wrap sidebar__switcher">
            <button class="switcher" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="menu-workspace" data-menu-trigger>
              <span class="switcher__avatar" aria-hidden="true">${esc(workspaceName.charAt(0).toUpperCase())}</span>
              <span class="switcher__text"><strong>${esc(workspaceName)}</strong><small>${data.plan} plan</small></span>
              ${icon("switch")}
            </button>
            <div class="menu" id="menu-workspace" role="menu" aria-label="Workspaces" inert>
              <p class="menu__label" aria-hidden="true">Workspaces</p>
              <button class="menu__item" type="button" role="menuitemradio" aria-checked="true">${esc(workspaceName)}${icon("check", "icon--end")}</button>
              <div class="menu__sep" role="separator"></div>
              <a class="menu__item" role="menuitem" href="../onboarding.html">${icon("plus")}Create workspace</a>
            </div>
          </div>
          <a class="icon-btn notif-btn" href="notifications.html" aria-label="${bellLabel}">${icon("bell")}${unread ? '<span class="notif-dot" aria-hidden="true"></span>' : ""}</a>
          <button class="icon-btn sidebar__close" type="button" aria-label="Close navigation" data-drawer-close>${icon("close")}</button>
        </div>

        <a class="btn btn--primary btn--block" href="chat.html">${icon("plus")}New conversation</a>

        <button class="search-trigger" type="button" data-open-search>
          ${icon("search")}<span>Search</span><kbd class="kbd">${MOD} K</kbd>
        </button>

        <nav class="side-nav" aria-label="Main"><ul>${navItems(primary)}</ul></nav>

        <div class="sidebar__foot">
          <nav class="side-nav" aria-label="Account"><ul>${navItems(secondary)}</ul></nav>
          <div class="menu-wrap">
            <button class="profile-btn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="menu-profile" data-menu-trigger>
              <span class="avatar" aria-hidden="true">${esc(data.owner.charAt(0))}</span>
              <span class="switcher__text"><strong>${esc(data.owner)}</strong><small>Owner</small></span>
              ${icon("dots")}
            </button>
            <div class="menu menu--up" id="menu-profile" role="menu" aria-label="Account" inert>
              <a class="menu__item" role="menuitem" href="profile.html">${icon("user")}Profile</a>
              <a class="menu__item" role="menuitem" href="settings.html">${icon("settings")}Settings</a>
              <button class="menu__item theme-toggle" type="button" role="menuitem" data-theme-menu>
                ${icon("moon", "icon--moon")}${icon("sun", "icon--sun")}<span data-theme-label>Switch to dark theme</span>
              </button>
              <div class="menu__sep" role="separator"></div>
              <a class="menu__item" role="menuitem" href="../login.html">${icon("logout")}Sign out</a>
            </div>
          </div>
        </div>
      </aside>
      <div class="scrim" data-scrim></div>`,

    "app-topbar": `
      <header class="topbar">
        <button class="icon-btn" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="sidebar" data-drawer-open>${icon("menu")}</button>
        <a class="topbar__title" href="dashboard.html"><span class="logo__mark">${icon("logo")}</span><span>${esc(title)}</span></a>
        <div class="topbar__actions">
          <button class="icon-btn" type="button" aria-label="Search" data-open-search>${icon("search")}</button>
          <a class="icon-btn notif-btn" href="notifications.html" aria-label="${bellLabel}">${icon("bell")}${unread ? '<span class="notif-dot" aria-hidden="true"></span>' : ""}</a>
          <a class="icon-btn" href="chat.html" aria-label="New conversation">${icon("plus")}</a>
        </div>
      </header>`,

    "app-bottom-nav": `
      <nav class="bottom-nav" aria-label="Quick navigation">
        <ul>
          <li><a href="dashboard.html"${page === "home" ? ' aria-current="page"' : ""}>${icon("home")}Home</a></li>
          <li><a href="conversations.html"${page === "conversations" ? ' aria-current="page"' : ""}>${icon("chat")}Chats</a></li>
          <li><a href="projects.html"${page === "projects" ? ' aria-current="page"' : ""}>${icon("folder")}Projects</a></li>
          <li><a href="documents.html"${page === "documents" ? ' aria-current="page"' : ""}>${icon("doc")}Docs</a></li>
          <li><button type="button" aria-expanded="false" aria-controls="sidebar" data-drawer-open>${icon("menu")}More</button></li>
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
    document.querySelectorAll("[data-open-search] .kbd").forEach(() => {});
    initDrawer();
    initMenus();
    initTheme();
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
      requestAnimationFrame(() => sidebar.querySelector(".switcher").focus());
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
        !document.querySelector(".menu.is-open") &&
        !document.querySelector("dialog[open]")
      )
        close();
    });
    desktop.addEventListener("change", sync);
    sync();
  }

  /* ---------- Menus ---------- */
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

  /* ---------- Theme item in profile menu ---------- */
  function initTheme() {
    const btn = document.querySelector("[data-theme-menu]");
    if (!btn) return;
    const label = btn.querySelector("[data-theme-label]");
    const sync = () => {
      label.textContent =
        window.aiwTheme.get() === "dark"
          ? "Switch to light theme"
          : "Switch to dark theme";
    };
    btn.addEventListener("click", () => window.aiwTheme.toggle());
    document.addEventListener("themechange", sync);
    sync();
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
      <dialog class="palette" id="palette" aria-label="Search and quick actions">
        <div class="palette__search">
          ${icon("search")}
          <input class="palette__input" id="palette-input" type="text" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list" aria-label="Search conversations, projects, documents, reports, and prompts" placeholder="Search or jump to…" autocomplete="off" spellcheck="false">
          <kbd class="kbd">Esc</kbd>
        </div>
        <div class="palette__list" id="palette-list" role="listbox" aria-label="Results"></div>
        <p class="visually-hidden" role="status" aria-live="polite" id="palette-status"></p>
        <div class="palette__foot"><span><kbd class="kbd">↑</kbd><kbd class="kbd">↓</kbd> Navigate</span><span><kbd class="kbd">↵</kbd> Open</span></div>
      </dialog>`,
    );

    const dlg = document.getElementById("palette");
    const input = document.getElementById("palette-input");
    const list = document.getElementById("palette-list");
    const status = document.getElementById("palette-status");

    const T = data.types;
    const from = (type, item, meta) => ({
      title: item.title,
      meta,
      href: T[type].href(item.id),
      icon: T[type].icon,
      tint: T[type].tint,
    });

    const actions = [
      {
        title: "New conversation",
        meta: "Action",
        href: "chat.html",
        icon: "plus",
        tint: "coral",
      },
      {
        title: "Analyze document",
        meta: "Action",
        href: "documents.html?action=analyze",
        icon: "doc",
        tint: "mint",
      },
      {
        title: "Write",
        meta: "Action",
        href: "writer.html",
        icon: "pen",
        tint: "sand",
      },
      {
        title: "Generate report",
        meta: "Action",
        href: "reports.html?new=1",
        icon: "report",
        tint: "blue",
      },
      {
        title: "Search knowledge",
        meta: "Action",
        href: "knowledge.html?focus=search",
        icon: "book",
        tint: "mauve",
      },
    ];
    const pages = [...primary, ...secondary].map(([, href, label, ic]) => ({
      title: label,
      meta: "Page",
      href,
      icon: ic,
      tint: "mint",
    }));
    const content = {
      Conversations: data.conversations.map((i) => ({
        ...from("conversation", i, `Conversation · ${i.project}`),
        updated: i.updated,
      })),
      Projects: data.projects.map((i) => ({
        ...from("project", i, `Project · ${data.ago(i.updated)}`),
        updated: i.updated,
      })),
      Documents: data.documents.map((i) => ({
        ...from("document", i, `Document · ${i.project}`),
        updated: i.updated,
      })),
      Reports: data.reports.map((i) => ({
        ...from("report", i, `Report · ${i.project}`),
        updated: i.updated,
      })),
      Prompts: data.prompts.map((i) =>
        from("prompt", i, `Prompt · ${i.category}`),
      ),
    };
    const recent = [
      ...content.Conversations,
      ...content.Projects,
      ...content.Documents,
      ...content.Reports,
    ]
      .sort((a, b) => a.updated - b.updated)
      .slice(0, 4);

    let flat = [];
    let active = 0;

    function groupsFor(q) {
      const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.length)
        return [
          { label: "Quick actions", items: actions },
          { label: "Recent", items: recent },
        ];
      const hit = (e) => {
        const hay = `${e.title} ${e.meta}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      };
      const rank = (e) => (e.title.toLowerCase().startsWith(terms[0]) ? 0 : 1);
      const out = [];
      const add = (label, items) => {
        const r = items
          .filter(hit)
          .sort((a, b) => rank(a) - rank(b))
          .slice(0, 5);
        if (r.length) out.push({ label, items: r });
      };
      add("Quick actions", actions);
      add("Pages", pages);
      Object.entries(content).forEach(([label, items]) => add(label, items));
      return out;
    }

    function render() {
      const q = input.value;
      const groups = groupsFor(q);
      flat = groups.flatMap((g) => g.items);
      active = 0;
      if (!flat.length) {
        list.innerHTML = `<p class="palette__empty">No results for “${esc(q.trim())}”. Try a project, document, or report name.</p>`;
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
              <span class="tile tile--${e.tint}">${icon(e.icon)}</span>
              <span class="palette__title">${esc(e.title)}</span>
              <span class="palette__meta">${esc(e.meta)}</span>
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
