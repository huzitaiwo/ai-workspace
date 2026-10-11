/* Billing — plan summary list + "Change plan" dialog (no real payments). */
(() => {
  const init = () => {
    const { data, toast } = window.aiwApp;
    const $ = (s) => document.querySelector(s);

    const renewal = (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1, 1);
      return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    })();
    const plans = {
      free: { name: "Free", title: "Free plan · 1 seat" },
      pro: { name: "Pro", title: "Pro plan · 1 seat" },
      team: { name: "Team", title: "Team plan · 6 seats" },
      enterprise: {
        name: "Enterprise",
        title: "Enterprise plan · Custom seats",
      },
    };
    let current = "team";

    const list = window.aiwList.mount({
      slot: $("[data-list]"),
      iconName: "card",
      href: "billing.html?item=",
      items: [
        { id: "plan", title: plans.team.title, tag: "Active", tint: "coral" },
        {
          id: "renewal",
          title: `Next renewal · ${renewal}`,
          tag: "Shared",
          tint: "mint",
        },
        {
          id: "usage",
          title: `Usage · ${data.usage.percent}% of monthly allowance`,
          tag: "Active",
          tint: "blue",
        },
      ],
      emptyHtml: "",
    });

    const dlg = $("#plan-dialog");
    const form = $("[data-plan-form]");
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-change-plan]")) {
        form.elements.plan.value = current;
        dlg.showModal();
      }
    });
    dlg
      .querySelectorAll("[data-dialog-close]")
      .forEach((b) => b.addEventListener("click", () => dlg.close()));
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) dlg.close();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const choice = form.elements.plan.value;
      dlg.close();
      if (choice === current)
        return toast(`You’re already on the ${plans[choice].name} plan.`);
      current = choice;
      list.update("plan", { title: plans[choice].title });
      toast(
        `Plan changed to ${plans[choice].name}. No payment is taken in this demo.`,
      );
      $("[data-status]").textContent = `Plan changed to ${plans[choice].name}.`;
    });
  };
  if (window.aiwApp) init();
  else document.addEventListener("aiwapp:ready", init, { once: true });
})();
