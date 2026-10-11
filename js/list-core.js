/* Shared list renderer: skeleton → rows → empty. Used by Team, Billing, Settings. */
window.aiwList = (() => {
  function mount({ slot, items, iconName, href, emptyHtml }) {
    const { esc, icon } = window.aiwApp;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const skRow = () => `<li class="row" aria-hidden="true">
      <span class="skeleton" style="width:2.1rem;height:2.1rem;border-radius:.55rem"></span>
      <span class="row__body"><span class="skeleton" style="width:40%;height:.75rem"></span><span class="skeleton" style="width:60%;height:.6rem;margin-top:.5rem"></span></span></li>`;

    const row = (item) => `<li><a class="row" href="${href}${item.id}">
      <span class="tile tile--${item.tint}">${icon(iconName)}</span>
      <span class="row__body"><strong>${esc(item.title)}</strong><span>${esc(item.sub || "Updated recently · Available in this demo")}</span></span>
      ${item.tag ? `<span class="tag">${esc(item.tag)}</span>` : ""}${icon("chevron-right", "row__go")}</a></li>`;

    const render = () => {
      slot.innerHTML = items.length
        ? `<ul class="row-list">${items.map(row).join("")}</ul>`
        : emptyHtml;
      slot.removeAttribute("aria-busy");
    };

    slot.setAttribute("aria-busy", "true");
    slot.innerHTML = `<ul class="row-list">${skRow().repeat(3)}</ul>`;
    setTimeout(render, reduceMotion ? 0 : 450);

    return {
      render,
      add(item) {
        items.unshift(item);
        render();
      },
      update(id, patch) {
        Object.assign(
          items.find((i) => i.id === id),
          patch,
        );
        render();
      },
    };
  }
  return { mount };
})();
