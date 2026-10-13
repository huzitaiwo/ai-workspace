/* ==========================================================================
   Demo data shared by every app page.
   Owner = Handsome. Workspace and teammate names come from your screenshots
   (Studio North, Faridah, Warwick) — swap them here when you want different ones.
   ========================================================================== */
window.aiwData = (() => {
  const ago = (m) => {
    if (m < 1) return "Just now";
    if (m < 60) return `${m} min ago`;
    if (m < 1440) return `${Math.round(m / 60)}h ago`;
    if (m < 2880) return "Yesterday";
    return new Date(Date.now() - m * 60000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return {
    owner: "Handsome",
    workspace: "Studio North",
    ago,

    sessions: [
      {
        id: "website-redesign-research",
        title: "Website Redesign Research",
        project: "website-redesign",
        stage: "Source synthesis",
        updated: 14,
        tag: "Research",
        tint: "coral",
      },
      {
        id: "northstar-positioning-brief",
        title: "Northstar positioning brief",
        project: "northstar-launch",
        stage: "Drafting",
        updated: 1500,
        tag: "Writing",
        tint: "mint",
      },
      {
        id: "customer-insight-themes",
        title: "Customer insight themes",
        project: "insight-program",
        stage: "Analysis",
        updated: 4000,
        tag: "Analysis",
        tint: "blue",
      },
    ],
    conversations: [
      {
        id: "customer-insight-themes",
        title: "Customer insight themes",
        project: "insight-program",
        tag: "Active",
        tint: "coral",
      },
      {
        id: "northstar-positioning-brief",
        title: "Northstar positioning brief",
        project: "northstar-launch",
        tag: "Shared",
        tint: "mint",
      },
      {
        id: "product-direction-notes",
        title: "Product direction notes",
        project: "website-redesign",
        tag: "Active",
        tint: "blue",
      },
    ],
    documents: [
      {
        id: "interview-synthesis",
        name: "Interview synthesis.pdf",
        ext: "PDF",
        size: "2.4 MB",
        status: "ready",
        project: "website-redesign",
        owner: "Handsome",
      },
      {
        id: "navigation-audit",
        name: "Navigation audit.docx",
        ext: "DOCX",
        size: "860 KB",
        status: "ready",
        project: "website-redesign",
        owner: "Handsome",
      },
      {
        id: "competitor-patterns",
        name: "Competitor patterns.csv",
        ext: "CSV",
        size: "214 KB",
        status: "processing",
        project: "northstar-launch",
        owner: "Hassan Warwick",
      },
      {
        id: "research-repository",
        name: "Research repository.txt",
        ext: "TXT",
        size: "124 KB",
        status: "ready",
        project: "insight-program",
        owner: "Faridah Adepoju",
      },
    ],
    knowledge: [
      {
        id: "brand-foundations",
        title: "Brand foundations",
        tag: "Active",
        tint: "coral",
      },
      {
        id: "research-repository",
        title: "Research repository",
        tag: "Shared",
        tint: "mint",
      },
      {
        id: "product-principles",
        title: "Product principles",
        tag: "Active",
        tint: "blue",
      },
    ],
    prompts: [
      {
        id: "synthesize-research-themes",
        title: "Synthesize research themes",
        tag: "Active",
        tint: "coral",
        category: "Research",
        visibility: "workspace",
        description: "Group what the sources say into a few clear themes.",
        instructions:
          "Review the selected sources for {{company}}. Group what you find into three to five themes. For each theme, give a one-sentence summary, the strongest supporting evidence, and the source it came from. Write for {{audience}} in a {{tone}} tone.",
      },
      {
        id: "find-decision-risks",
        title: "Find decision risks",
        tag: "Shared",
        tint: "mint",
        category: "Business",
        visibility: "workspace",
        description: "Surface the risks that could change the decision ahead.",
        instructions:
          "Read {{document}} and list the risks that could affect the decision ahead. For each risk, say how likely it is, what it would affect, and what evidence supports it. Finish with the one risk {{audience}} should discuss first.",
      },
      {
        id: "turn-notes-into-a-brief",
        title: "Turn notes into a brief",
        tag: "Active",
        tint: "blue",
        category: "Productivity",
        visibility: "private",
        description: "Turn rough notes into a one-page brief.",
        instructions:
          "Turn these notes into a one-page brief for {{audience}}. Start with the decision to be made, then the context, the options, and a recommendation. Keep the tone {{tone}}.",
      },
    ],
    projects: [
      {
        id: "website-redesign",
        title: "Website Redesign",
        meta: "8 sources",
        progress: 72,
        tag: "Active",
        tint: "coral",
        instructions:
          "Prioritize UX research, conversion clarity, accessibility, and responsive behavior.",
        sources: ["Interview synthesis.pdf", "Navigation audit.docx"],
      },
      /* placeholder content below — replace with your own */
      {
        id: "northstar-launch",
        title: "Northstar Launch",
        meta: "5 active threads",
        progress: 46,
        tag: "Shared",
        tint: "mint",
        instructions:
          "Keep launch messaging consistent and cite the source behind every claim.",
        sources: ["Positioning notes.docx", "Launch timeline.xlsx"],
      },
      {
        id: "insight-program",
        title: "Insight Program",
        meta: "12 tagged notes",
        progress: 84,
        tag: "Active",
        tint: "sand",
        instructions:
          "Group findings into themes and note how many sources support each one.",
        sources: ["Customer interviews.pdf", "Insight themes.csv"],
      },
    ],
    activity: [
      {
        actor: "Faridah",
        action: "added a source",
        detail: "Competitor patterns.csv",
        tint: "coral",
      },
      {
        actor: "Warwick",
        action: "commented",
        detail: "Navigation research synthesis",
        tint: "mint",
      },
      {
        actor: "You",
        action: "updated a draft",
        detail: "A clearer path through the work",
        tint: "blue",
      },
    ],
    usage: { percent: 68, responses: 124, documentsRead: 18, reportsMade: 4 },
    notifications: [
      {
        id: "n1",
        title: "Report ready",
        text: "Navigation research synthesis is ready to review.",
        unread: true,
      },
      {
        id: "n2",
        title: "Mentioned by Faridah",
        text: "Can you add the decision principles to the project?",
        unread: false,
      },
      {
        id: "n3",
        title: "Document processed",
        text: "Competitor patterns.csv is ready for analysis.",
        unread: false,
      },
    ],
  };
})();

/* ---- Local overrides: profile name, project edits (rename, instructions, archive, delete) ---- */
(() => {
  const d = window.aiwData;
  try {
    const prof = JSON.parse(localStorage.getItem("aiw-profile"));
    if (prof && prof.name) d.owner = prof.name;
  } catch (e) {}
  d.projects.forEach((p) => {
    p.defaultInstructions = p.instructions;
    p.baseTag = p.tag;
    try {
      const o = JSON.parse(localStorage.getItem("aiw-project-" + p.id));
      if (o) {
        Object.assign(p, o);
        if (o.archived) p.tag = "Archived";
      }
    } catch (e) {}
  });
  d.projects = d.projects.filter((p) => !p.deleted);
})();
