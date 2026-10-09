/* Builds FAQPage structured data from the questions already on the page */
(() => {
  const items = [...document.querySelectorAll(".accordion__item")].map(
    (item) => ({
      "@type": "Question",
      name: item
        .querySelector(".accordion__trigger")
        .firstChild.textContent.trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: item.querySelector(".accordion__panel p").textContent.trim(),
      },
    }),
  );
  if (!items.length) return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items,
  });
  document.head.appendChild(script);
})();
