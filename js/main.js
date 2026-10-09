/* ==========================================================================
   Shared behaviours: scroll reveal · accordion · billing toggle
   ========================================================================== */
(() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll reveal (auto-staggers siblings) ---------- */
  const items = document.querySelectorAll("[data-reveal]");
  items.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) =>
      c.hasAttribute("data-reveal"),
    );
    el.style.setProperty(
      "--reveal-delay",
      Math.min(siblings.indexOf(el), 4) * 70 + "ms",
    );
  });
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Accordion (single-open) ---------- */
  document.querySelectorAll("[data-accordion]").forEach((accordion) => {
    const triggers = [...accordion.querySelectorAll(".accordion__trigger")];
    const setState = (trigger, open) => {
      trigger.setAttribute("aria-expanded", open);
      document
        .getElementById(trigger.getAttribute("aria-controls"))
        .classList.toggle("is-open", open);
    };
    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const wasOpen = trigger.getAttribute("aria-expanded") === "true";
        triggers.forEach((t) => setState(t, false));
        if (!wasOpen) setState(trigger, true);
      });
    });
  });

  /* ---------- Billing toggle (monthly / annual) ---------- */
  document.querySelectorAll("[data-billing]").forEach((scope) => {
    const buttons = scope.querySelectorAll("[data-billing-option]");
    const prices = scope.querySelectorAll("[data-price]");

    const tween = (el, to) => {
      const from = Number(el.textContent) || 0;
      if (reduceMotion || from === to) {
        el.textContent = to;
        return;
      }
      const start = performance.now();
      const duration = 450;
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(from + (to - from) * eased);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.dataset.billingOption;
        buttons.forEach((b) => b.setAttribute("aria-pressed", b === button));
        prices.forEach((el) => tween(el, Number(el.dataset[mode])));
      });
    });
  });
})();
