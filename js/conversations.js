/* Conversations — skeleton → list → empty. Add ?state=empty to preview the empty state. */
(() => {
  const init = () => {
    const { data, esc, icon } = window.aiwApp;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const emptyDemo =
      new URLSearchParams(location.search).get("state") === "empty";
    const slot = document.querySelector("[data-conv-list]");
    const items = emptyDemo ? [] : data.conversations;

    const skRow = () => `<li class="row" aria-hidden="true">
      <span class="skeleton" style="width:2.1rem;height:2.1rem;border-radius:.55rem"></span>
      <span class="row__body"><span class="skeleton" style="width:45%;height:.75rem"></span><span class="skeleton" style="width:60%;height:.6rem;margin-top:.5rem"></span></span></li>`;

    const row = (c) => `<li><a class="row" href="chat.html?id=${c.id}">
      <span class="tile tile--${c.tint}">${icon("chats")}</span>
      <span class="row__body"><strong>${esc(c.title)}</strong><span>Updated recently · Available in this demo</span></span>
      <span class="tag">${esc(c.tag)}</span>${icon("chevron-right", "row__go")}</a></li>`;

    slot.setAttribute("aria-busy", "true");
    slot.innerHTML = `<ul class="row-list">${skRow().repeat(3)}</ul>`;

    setTimeout(
      () => {
        slot.innerHTML = items.length
          ? `<ul class="row-list">${items.map(row).join("")}</ul>`
          : `<div class="empty" style="margin:.9rem"><span class="tile tile--coral">${icon("chats")}</span><h3>No conversations yet</h3><p>Conversations keep your questions, answers, and sources together so you can return to them later.</p><a class="btn btn--primary btn--sm" href="chat.html?new=1">New conversation ${icon("arrow", "icon--arrow")}</a></div>`;
        slot.removeAttribute("aria-busy");
      },
      reduceMotion ? 0 : 450,
    );
  };

  if (window.aiwApp) init();
  else document.addEventListener("aiwapp:ready", init, { once: true });
})();
