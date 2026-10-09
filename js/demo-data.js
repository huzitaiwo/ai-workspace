/* ==========================================================================
   Demo data shared by every app page.
   Only the owner (Handsome) is named. Other people are intentionally left
   unnamed until real names are supplied. Times are "minutes ago".
   ========================================================================== */
window.aiwData = (() => {
  const ago = (m) =>
    m < 1
      ? "Just now"
      : m < 60
        ? `${m}m ago`
        : m < 1440
          ? `${Math.round(m / 60)}h ago`
          : m < 2880
            ? "Yesterday"
            : `${Math.round(m / 1440)}d ago`;

  const types = {
    conversation: {
      label: "Conversation",
      icon: "chat",
      tint: "coral",
      href: (id) => `chat.html?id=${id}`,
    },
    project: {
      label: "Project",
      icon: "folder",
      tint: "mint",
      href: (id) => `project.html?id=${id}`,
    },
    document: {
      label: "Document",
      icon: "doc",
      tint: "sand",
      href: (id) => `document.html?id=${id}`,
    },
    report: {
      label: "Report",
      icon: "report",
      tint: "blue",
      href: (id) => `report.html?id=${id}`,
    },
    prompt: {
      label: "Prompt",
      icon: "prompt",
      tint: "mauve",
      href: (id) => `prompts.html?id=${id}`,
    },
  };

  return {
    owner: "Handsome",
    plan: "Pro",
    unreadNotifications: 3,
    ago,
    types,

    projects: [
      {
        id: "website-redesign",
        title: "Website Redesign Research",
        sources: 12,
        progress: 72,
        updated: 4,
      },
      {
        id: "q4-roadmap",
        title: "Q4 Product Roadmap",
        sources: 8,
        progress: 40,
        updated: 300,
      },
      {
        id: "competitor-landscape",
        title: "Competitor Landscape",
        sources: 5,
        progress: 25,
        updated: 4300,
      },
    ],
    conversations: [
      {
        id: "checkout-friction",
        title: "Checkout friction themes",
        project: "Website Redesign Research",
        updated: 22,
      },
      {
        id: "pricing-copy",
        title: "Pricing page copy options",
        project: "Website Redesign Research",
        updated: 95,
      },
      {
        id: "onboarding-survey",
        title: "Summarize the onboarding survey",
        project: "Q4 Product Roadmap",
        updated: 1500,
      },
      {
        id: "roadmap-tradeoffs",
        title: "Roadmap trade-offs for Q4",
        project: "Q4 Product Roadmap",
        updated: 3000,
      },
    ],
    documents: [
      {
        id: "interview-notes",
        title: "Customer interview notes",
        ext: "pdf",
        size: "2.4 MB",
        status: "ready",
        project: "Website Redesign Research",
        updated: 48,
      },
      {
        id: "service-agreement",
        title: "Service agreement",
        ext: "docx",
        size: "186 KB",
        status: "processing",
        project: "Q4 Product Roadmap",
        updated: 6,
      },
      {
        id: "survey-results",
        title: "Q3 survey results",
        ext: "csv",
        size: "412 KB",
        status: "ready",
        project: "Q4 Product Roadmap",
        updated: 2000,
      },
      {
        id: "competitor-pricing",
        title: "Competitor pricing",
        ext: "xlsx",
        size: "96 KB",
        status: "ready",
        project: "Competitor Landscape",
        updated: 4400,
      },
    ],
    reports: [
      {
        id: "customer-feedback",
        title: "Customer feedback report",
        project: "Website Redesign Research",
        status: "ready",
        updated: 130,
      },
      {
        id: "competitor-analysis",
        title: "Competitor analysis",
        project: "Competitor Landscape",
        status: "draft",
        updated: 5000,
      },
    ],
    prompts: [
      {
        id: "summarize-research",
        title: "Summarize research notes",
        category: "Research",
        updated: 9000,
      },
      {
        id: "project-brief",
        title: "Write a project brief",
        category: "Product",
        updated: 9000,
      },
      {
        id: "compare-documents",
        title: "Compare two documents",
        category: "Productivity",
        updated: 9000,
      },
      {
        id: "proposal-outline",
        title: "Draft a proposal outline",
        category: "Business",
        updated: 9000,
      },
    ],

    usage: {
      creditsLeft: 2800,
      creditsTotal: 10000,
      documents: 18,
      reports: 4,
      days: [
        ["M", 38],
        ["T", 52],
        ["W", 44],
        ["T", 68],
        ["F", 50],
        ["S", 22],
        ["S", 100],
      ],
    },

    activity: [
      {
        icon: "report",
        tint: "blue",
        verb: "Your report is ready:",
        subject: "Customer feedback report",
        updated: 130,
      },
      {
        icon: "doc",
        tint: "sand",
        verb: "Finished processing",
        subject: "Customer interview notes.pdf",
        updated: 48,
      },
      {
        icon: "folder",
        tint: "mint",
        verb: "You created the project",
        subject: "Website Redesign Research",
        updated: 300,
      },
      {
        icon: "chat",
        tint: "coral",
        verb: "You renamed a conversation to",
        subject: "Pricing page copy options",
        updated: 1500,
      },
    ],
  };
})();
