/* Home only: gentle pointer-driven tilt on the product preview */
(() => {
  const preview = document.querySelector("[data-tilt]");
  if (!preview) return;
  if (
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !matchMedia("(hover: hover)").matches
  )
    return;

  const zone = preview.closest(".hero");
  let frame = 0;

  zone.addEventListener("pointermove", (e) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = preview.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const y = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      preview.style.setProperty("--tilt-y", (x * 7).toFixed(2) + "deg");
      preview.style.setProperty("--tilt-x", (-y * 6).toFixed(2) + "deg");
    });
  });

  zone.addEventListener("pointerleave", () => {
    preview.style.setProperty("--tilt-y", "0deg");
    preview.style.setProperty("--tilt-x", "0deg");
  });
})();
