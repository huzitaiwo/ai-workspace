/* ==========================================================================
   Writer AI — mock provider for selection edits and the writing partner.
   Lives beside aiService (UI → aiService.writer → provider). Swap for a real
   API later without touching the editor.
   ========================================================================== */
(() => {
  const ai = window.aiService;
  if (!ai) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const abortError = () => new DOMException("Aborted", "AbortError");
  const sleep = (ms, signal) =>
    new Promise((resolve, reject) => {
      if (signal && signal.aborted) return reject(abortError());
      const t = setTimeout(resolve, reduce ? 0 : ms);
      if (signal)
        signal.addEventListener(
          "abort",
          () => {
            clearTimeout(t);
            reject(abortError());
          },
          { once: true },
        );
    });
  const jitter = (a, b) => a + Math.random() * (b - a);
  const cap = (m) =>
    m[0] === m[0].toUpperCase()
      ? (s) => s[0].toUpperCase() + s.slice(1)
      : (s) => s;

  const thesaurus = [
    ["Great", "Strong"],
    ["begins with", "starts with"],
    ["shared understanding of", "shared view of"],
    ["designed to keep", "built to keep"],
    ["together", "in one place"],
    ["point of view", "clear position"],
    ["without losing", "without dropping"],
    ["credible", "trustworthy"],
  ];
  const contractions = [
    ["does not", "doesn’t"],
    ["do not", "don’t"],
    ["is not", "isn’t"],
    ["cannot", "can’t"],
    ["will not", "won’t"],
    ["it is", "it’s"],
    ["that is", "that’s"],
  ];

  const improve = (text) => {
    let out = text;
    thesaurus.forEach(([from, to]) => {
      out = out.replace(from, to);
    });
    out = out.replace(/[ \t]{2,}/g, " ");
    return out === text ? null : out;
  };

  const shorten = (text) => {
    const paragraphs = text.split(/\n{2,}/);
    const out = paragraphs
      .map((p) => {
        const sentences = p.match(/[^.!?]+[.!?]+\s*/g) || [p];
        if (sentences.length > 1) return sentences[0].trim();
        const cut = p.split(/,| — | and /)[0].trim();
        return cut.length < p.length - 12 ? cut.replace(/[.!?]*$/, ".") : p;
      })
      .join("\n\n");
    return out === text ? null : out;
  };

  const retone = (text, tone) => {
    let out = text;
    if (tone === "warmer") {
      contractions.forEach(([a, b]) => {
        out = out.replace(new RegExp(`\\b${a}\\b`, "gi"), (m) => cap(m)(b));
      });
      if (out === text)
        out = `Put simply, ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
    } else if (tone === "direct") {
      out = text.replace(
        /\b(I think|perhaps|maybe|somewhat|quite|rather|a bit)\s+/gi,
        "",
      );
    } else {
      contractions.forEach(([a, b]) => {
        out = out.replace(new RegExp(b, "gi"), (m) => cap(m)(a));
      });
    }
    return out === text ? null : out;
  };

  const continuation =
    "From there, the work is to turn that shared understanding into a plan the whole team can follow, with every claim traceable to its source.";

  async function edit({ action, tone, text, signal }) {
    await sleep(jitter(700, 1100), signal);
    if (action === "continue") return { append: continuation };
    const result =
      action === "improve"
        ? improve(text)
        : action === "shorten"
          ? shorten(text)
          : retone(text, tone);
    if (result == null) {
      const note =
        action === "improve"
          ? "Nothing to improve in this selection."
          : action === "shorten"
            ? "This is already short."
            : tone === "direct"
              ? "This already reads as direct."
              : "No change needed for that tone.";
      return { unchanged: true, note };
    }
    return { text: result };
  }

  async function assist(kind, { sources, signal }) {
    await sleep(jitter(900, 1300), signal);
    const first = sources[0] || "your sources";
    if (kind === "outline") {
      const items = [
        "Why shared understanding comes first",
        "What the evidence shows",
        "The decision that follows",
        "How the workspace keeps them together",
      ];
      return {
        title: "Suggested outline",
        items,
        insert: items.map((i) => `## ${i}`).join("\n\n"),
        insertLabel: "Insert outline",
      };
    }
    if (kind === "sources") {
      return {
        title: "Checked against sources",
        items: [
          {
            tag: "Supported",
            text: `“Research can become a point of view” matches ${first}.`,
          },
          {
            tag: "Needs a source",
            text: "“A shared understanding of the decision” has no source yet. Add one from the Sources tab.",
          },
        ],
      };
    }
    return {
      title: "Tone review",
      summary: "Clear and confident, with a slightly formal rhythm.",
      items: [
        "Paragraph one: a strong, direct opening. Keep it.",
        "Paragraph two: the second sentence is long. Consider splitting it in two.",
      ],
    };
  }

  ai.writer = { edit, assist };
})();
