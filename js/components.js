/* ==========================================================================
   Shared components: icon sprite, header, footer.
   ========================================================================== */
(() => {
  const icon = (name, cls = "") =>
    `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;

  /* ---------- Icon sprite (stroke style is set in CSS) ---------- */
  const sprite = `
    <symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></symbol>
    <symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.5-3.2 2.7-5 5.5-5s5 1.8 5.5 5M16 6a3 3 0 010 5.6M17.5 14.2c1.9.6 3.1 2.2 3.5 4.8"/></symbol>
    <symbol id="i-link" viewBox="0 0 24 24"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></symbol>
    <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M4 7.5l8 6 8-6"/></symbol>
    <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.6-3.7 3.3-5.8 7-5.8s6.4 2.1 7 5.8"/></symbol>
    <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <symbol id="i-logo" viewBox="0 0 24 24"><path fill="currentColor" d="M9.6 4.8h7.4l-1.9 3.4H7.7zM7.9 10.3h8.8l-1.9 3.4H6zM6.5 15.8h7.4l-1.9 3.4H4.6z"/></symbol>
    <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
    <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></symbol>
    <symbol id="i-chevron" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></symbol>
    <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></symbol>
    <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
    <symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/></symbol>
    <symbol id="i-moon" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/></symbol>
    <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6z"/><path d="M9 12l2 2 4-4"/></symbol>
    <symbol id="i-sparkle" viewBox="0 0 24 24"><path d="M11 3l1.9 5.4L18 10.3l-5.1 1.9L11 17.6l-1.9-5.4L4 10.3l5.1-1.9zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></symbol>
    <symbol id="i-chat" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="11" rx="3"/><path d="M12 7V4.5M9 12.2v.1M15 12.2v.1M9.5 15.2h5"/></symbol>
    <symbol id="i-doc" viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12.5h5M10 16h5"/></symbol>
    <symbol id="i-pen" viewBox="0 0 24 24"><path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19z"/><path d="M14.5 6.5l3 3"/></symbol>
    <symbol id="i-book" viewBox="0 0 24 24"><path d="M5 4h3.5v16H5zM10.5 4H14v16h-3.5zM16 5.6l3.3-.9 3 14.4-3.3.9z" transform="translate(-1 0)"/></symbol>
    <symbol id="i-folder" viewBox="0 0 24 24"><path d="M3 7.5A2.5 2.5 0 015.5 5H9l2 2h7.5A2.5 2.5 0 0121 9.5v8a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 17.5z"/><path d="M12 11v5M9.5 13.5h5"/></symbol>
  </svg>`;

  /* ---------- Templates ---------- */
  const nav = [
    ["Features", "features.html"],
    ["Solutions", "solutions.html"],
    ["Pricing", "pricing.html"],
    ["Security", "security.html"],
    ["Resources", "resources.html"],
  ];
  const navLinks = nav
    .map(([label, href]) => `<li><a href="${href}">${label}</a></li>`)
    .join("");
  const mobileLinks = nav
    .map(([label, href]) => `<a href="${href}">${label}</a>`)
    .join("");

  const templates = {
    header: `
    <header class="site-header" data-site-header>
      <div class="site-header__inner">
        <a class="logo" href="index.html" aria-label="AI Workspace — home">
          <span class="logo__mark">${icon("logo")}</span>
          <span>AI Workspace</span>
        </a>
        <nav class="site-nav" aria-label="Primary"><ul>${navLinks}</ul></nav>
        <div class="site-header__actions">
          <button class="icon-btn theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark theme">
            ${icon("moon", "icon--moon")}${icon("sun", "icon--sun")}
          </button>
          <a class="link-quiet" href="login.html">Sign in</a>
          <a class="btn btn--primary btn--sm site-header__cta" href="signup.html">Explore demo ${icon("arrow", "icon--arrow")}</a>
          <button class="icon-btn site-header__menu" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">
            ${icon("menu", "icon--menu")}${icon("close", "icon--close")}
          </button>
        </div>
      </div>
      <nav class="mobile-menu" id="mobile-menu" aria-label="Mobile" inert>
        ${mobileLinks}
        <a href="login.html">Sign in</a>
        <a class="btn btn--primary btn--block" href="signup.html">Create workspace ${icon("arrow", "icon--arrow")}</a>
      </nav>
    </header>`,

    footer: `
    <footer class="site-footer">
      <div class="site-footer__inner">
        <a class="logo" href="index.html" aria-label="AI Workspace — home">
          <span class="logo__mark">${icon("logo")}</span>
          <span>AI Workspace</span>
        </a>
        <p class="site-footer__tagline">An original AI productivity product concept.</p>
        <nav aria-label="Footer">
          <ul class="site-footer__links">
            <li><a href="features.html">Features</a></li>
            <li><a href="pricing.html">Pricing</a></li>
            <li><a href="security.html">Security</a></li>
            <li><a href="contact.html">Contact</a></li>
          </ul>
        </nav>
        <p class="site-footer__credit">Designed and built by Handsome.</p>
      </div>
    </footer>`,
  };

  /* ---------- Mount ---------- */
  function mount() {
    document.body.insertAdjacentHTML("afterbegin", sprite);
    document.querySelectorAll("[data-component]").forEach((slot) => {
      const html = templates[slot.dataset.component];
      if (!html) return;
      const tpl = document.createElement("template");
      tpl.innerHTML = html.trim();
      slot.replaceWith(tpl.content);
    });
    initHeader();
    initThemeToggles();
  }

  function initHeader() {
    const header = document.querySelector("[data-site-header]");
    if (!header) return;

    /* current page */
    const page = location.pathname.split("/").pop() || "index.html";
    header.querySelectorAll("a[href]").forEach((a) => {
      if (a.getAttribute("href") === page && !a.classList.contains("logo"))
        a.setAttribute("aria-current", "page");
    });

    /* scrolled state */
    const onScroll = () =>
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* mobile menu */
    const btn = header.querySelector(".site-header__menu");
    const menu = header.querySelector(".mobile-menu");
    const setMenu = (open) => {
      btn.setAttribute("aria-expanded", open);
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.classList.toggle("is-open", open);
      menu.toggleAttribute("inert", !open);
      header.classList.toggle("menu-open", open);
    };
    btn.addEventListener("click", () =>
      setMenu(btn.getAttribute("aria-expanded") !== "true"),
    );
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        btn.focus();
      }
    });
    matchMedia("(min-width: 56.25rem)").addEventListener("change", (e) => {
      if (e.matches) setMenu(false);
    });
  }

  function initThemeToggles() {
    const toggles = document.querySelectorAll("[data-theme-toggle]");
    if (!toggles.length) return;
    const sync = () => {
      const dark = window.aiwTheme.get() === "dark";
      toggles.forEach((t) =>
        t.setAttribute(
          "aria-label",
          dark ? "Switch to light theme" : "Switch to dark theme",
        ),
      );
    };
    toggles.forEach((t) =>
      t.addEventListener("click", () => window.aiwTheme.toggle()),
    );
    document.addEventListener("themechange", sync);
    sync();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
