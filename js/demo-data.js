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
    documents: [
      {
        id: "interview-synthesis",
        name: "Interview synthesis.pdf",
        ext: "PDF",
        status: "ready",
      },
      {
        id: "navigation-audit",
        name: "Navigation audit.docx",
        ext: "DOCX",
        status: "ready",
      },
      {
        id: "competitor-patterns",
        name: "Competitor patterns.csv",
        ext: "CSV",
        status: "processing",
      },
    ],
    projects: [
      {
        id: "website-redesign",
        title: "Website Redesign",
        meta: "8 sources",
        progress: 72,
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
