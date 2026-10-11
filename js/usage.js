(() => {
  const init = () => {
    const { data, esc, icon, toast } = window.aiwApp;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const params = new URLSearchParams(location.search);
    const $ = (s) => document.querySelector(s);
    const root = $("[data-usage]");
    const live = $("[data-status]");
    const announce = (t) => {
      live.textContent = "";
      setTimeout(() => {
        live.textContent = t;
      }, 40);
    };

    /* ---------- Demo data ---------- */
    const seeded = (seed) => () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const makeSeries = (n, base, seed) => {
      const r = seeded(seed);
      return Array.from({ length: n }, () =>
        Math.round(base * (0.45 + r() * 1.1)),
      );
    };
    const today = new Date();
    const ranges = {
      "7d": { label: "Last 7 days", series: [14, 22, 18, 31, 20, 9, 10] },
      "30d": { label: "Last 30 days", series: makeSeries(30, 18, 7) },
      month: {
        label: "This month",
        series: makeSeries(today.getDate(), 17, 11),
      },
    };
    const members = [
      { name: data.owner, you: true, share: 52 },
      { name: "Darius Bell", share: 31 },
      { name: "Lena Ortiz", share: 17 },
    ];
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    const dayLabel = (n, i, opts) =>
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - (n - 1 - i),
      ).toLocaleDateString("en-US", opts);
    const fmt = (n) => n.toLocaleString("en-US");

    const total = 10000;
    const used = Math.round((data.usage.percent / 100) * total);
    const renewal = (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1, 1);
      return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    })();

    /* ---------- States ---------- */
    const loadingHtml = `<div class="usage-state"><div class="state-card" role="status">${icon("circle-dashed", "spin")}<div><strong>Loading AI usage</strong><p>Preparing your monthly workspace allowance.</p></div></div></div>`;
    const errorHtml = `<div class="usage-state"><div class="state-card state-card--error" role="alert">${icon("shield")}<div><strong>Usage is unavailable.</strong><p>Please retry in a moment.</p><button class="btn btn--secondary btn--sm" type="button" data-retry>${icon("refresh")}Retry</button></div></div></div>`;

    let failNext = params.get("state") === "error";
    function load() {
      root.innerHTML = loadingHtml;
      root.setAttribute("aria-busy", "true");
      announce("Loading AI usage.");
      setTimeout(
        () => {
          root.removeAttribute("aria-busy");
          if (failNext) {
            failNext = false;
            root.innerHTML = errorHtml;
            announce("Usage is unavailable. Please retry in a moment.");
          } else renderPage();
        },
        reduce ? 0 : 900,
      );
    }
    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-retry]")) load();
    });

    /* ---------- Loaded page ---------- */
    function renderPage() {
      root.innerHTML = `
        <header class="page-head">
          <div>
            <p class="eyebrow" data-rise style="--i:0">Workspace usage</p>
            <h1 data-rise style="--i:1">Usage you can read at a glance.</h1>
            <p class="page-head__sub" data-rise style="--i:2">See how AI is supporting the work, for you and for the team.</p>
          </div>
          <div class="field usage-range" data-rise style="--i:2">
            <label class="visually-hidden" for="usage-range">Date range</label>
            <div class="select"><select class="input" id="usage-range">${Object.entries(
              ranges,
            )
              .map(([k, r]) => `<option value="${k}">${r.label}</option>`)
              .join("")}</select>${icon("chevron")}</div>
          </div>
        </header>

        <section class="u-stats" aria-label="Totals for the selected range" data-rise style="--i:3" data-stats></section>

        <div class="u-grid" data-rise style="--i:4">
          <section class="u-card" aria-labelledby="vol-title">
            <div class="u-chart__head">
              <div><span class="eyebrow">Volume</span><h2 id="vol-title">AI responses per day</h2></div>
              <p class="u-chart__peak" data-peak></p>
            </div>
            <div data-chart></div>
          </section>

          <section class="u-card" aria-labelledby="allow-title">
            <span class="eyebrow">This month</span><h2 id="allow-title">Monthly allowance</h2>
            <div class="u-donut" role="img" aria-label="${data.usage.percent} percent of this month's credits used">
              <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="u-donut__track" cx="60" cy="60" r="50"></circle><circle class="u-donut__value" cx="60" cy="60" r="50" style="--offset:${314.16 * (1 - data.usage.percent / 100)}"></circle></svg>
              <div class="u-donut__label" aria-hidden="true"><strong>${data.usage.percent}<small>%</small></strong><span>used</span></div>
            </div>
            <ul class="u-facts">
              <li><span>Credits used</span><b>${fmt(used)} of ${fmt(total)}</b></li>
              <li><span>Credits remaining</span><b>${fmt(total - used)}</b></li>
              <li><span>Renews</span><b>${renewal}</b></li>
            </ul>
          </section>
        </div>

        <section class="u-card u-team" aria-labelledby="team-title" data-rise style="--i:5">
          <span class="eyebrow">Team usage</span><h2 id="team-title">Who is using the workspace</h2>
          <ul data-team></ul>
        </section>`;

      const select = $("#usage-range");
      select.addEventListener("change", () => {
        update(select.value);
        announce(`Showing ${ranges[select.value].label}.`);
      });
      update("7d");
    }

    function update(key) {
      const { series } = ranges[key];
      const n = series.length;
      const totalResp = sum(series);
      const max = Math.max(...series);
      const peakIdx = series.indexOf(max);

      const stats = [
        ["Conversations", Math.round(totalResp * 0.095), "started"],
        ["AI responses", totalResp, "generated"],
        ["Documents analyzed", Math.round(totalResp * 0.145), "sources read"],
        ["Reports generated", Math.round(totalResp * 0.032), "completed"],
      ];
      $("[data-stats]").innerHTML = stats
        .map(
          ([label, value, hint]) =>
            `<div class="u-card u-stat"><span class="eyebrow">${label}</span><strong>${fmt(value)}</strong><span>${hint}</span></div>`,
        )
        .join("");

      $("[data-peak]").textContent =
        `Peak: ${dayLabel(n, peakIdx, { month: "short", day: "numeric" })} · ${max} responses`;

      const gap = n > 14 ? "0.2rem" : "0.4rem";
      const bars = series
        .map(
          (v, i) =>
            `<div class="chart__bar${i === peakIdx ? " is-peak" : ""}" style="--h:${Math.max(4, (v / max) * 100)};--n:${i}" data-value="${v}" title="${dayLabel(n, i, { month: "short", day: "numeric" })}: ${v}"></div>`,
        )
        .join("");
      const axis =
        n <= 7
          ? `<div class="chart-axis chart-axis--all" aria-hidden="true">${series.map((_, i) => `<span>${dayLabel(n, i, { weekday: "short" })}</span>`).join("")}</div>`
          : `<div class="chart-axis" aria-hidden="true"><span>${dayLabel(n, 0, { month: "short", day: "numeric" })}</span><span>${dayLabel(n, Math.floor(n / 2), { month: "short", day: "numeric" })}</span><span>${dayLabel(n, n - 1, { month: "short", day: "numeric" })}</span></div>`;
      const table = `<table class="visually-hidden"><caption>AI responses per day, ${ranges[key].label}</caption><thead><tr><th>Day</th><th>Responses</th></tr></thead><tbody>${series.map((v, i) => `<tr><td>${dayLabel(n, i, { month: "long", day: "numeric" })}</td><td>${v}</td></tr>`).join("")}</tbody></table>`;
      $("[data-chart]").innerHTML =
        `<div class="chart" style="--gap:${gap}" aria-hidden="true">${bars}</div>${axis}${table}`;

      let left = totalResp;
      $("[data-team]").innerHTML = members
        .map((m, i) => {
          const count =
            i === members.length - 1
              ? left
              : Math.round((totalResp * m.share) / 100);
          left -= count;
          return `<li><span class="avatar" aria-hidden="true">${esc(m.name.charAt(0))}</span><strong>${esc(m.name)}${m.you ? " (you)" : ""}</strong>
          <span class="meter" role="img" aria-label="${m.share}% of responses" style="--value:${m.share}%"><span></span></span>
          <span class="u-team__nums"><b>${fmt(count)}</b> responses · ${m.share}%</span></li>`;
        })
        .join("");
    }

    load();
  };
  if (window.aiwApp) init();
  else document.addEventListener("aiwapp:ready", init, { once: true });
})();
