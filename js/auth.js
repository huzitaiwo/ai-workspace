/* ==========================================================================
   Auth demo — mock provider behind a tiny interface.
   Swap `provider` for Firebase Auth later; the UI code below stays the same.
   ========================================================================== */
(() => {
  const button = document.querySelector("[data-auth-action]");
  if (!button) return;

  const label = button.querySelector("[data-auth-label]");
  const status = document.querySelector("[data-auth-status]");
  const idleText = label.textContent;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* DEMO ONLY — no real authentication happens here. */
  const provider = {
    async continue(mode) {
      await new Promise((resolve) =>
        setTimeout(resolve, reduceMotion ? 250 : 1100),
      );
      return { ok: true, mode };
    },
  };

  const setLoading = (loading) => {
    button.classList.toggle("is-loading", loading);
    button.toggleAttribute("aria-busy", loading);
    label.textContent = loading ? button.dataset.loadingLabel : idleText;
    status.textContent = loading ? button.dataset.loadingLabel : "";
  };

  button.addEventListener("click", async () => {
    if (button.classList.contains("is-loading")) return;
    setLoading(true);
    try {
      await provider.continue(button.dataset.authMode);
      location.href = button.dataset.redirect;
    } catch (error) {
      setLoading(false);
      status.textContent = "We could not continue. Please try again.";
    }
  });

  /* Restore the button if the user comes back via the browser's back button */
  addEventListener("pageshow", (e) => {
    if (e.persisted) setLoading(false);
  });
})();
