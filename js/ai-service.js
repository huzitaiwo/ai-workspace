/* ==========================================================================
   AI service — the UI only talks to this.  UI → aiService → provider.
   The mock provider simulates latency, streaming, cancellation and failures.
   Replace `provider` with a real API client later; nothing else changes.
   Demo triggers: put /error, /limit, /context or /down anywhere in a prompt.
   ========================================================================== */
window.aiService = (() => {
  class AIError extends Error {
    constructor(code, message, retryAfter) {
      super(message);
      this.name = "AIError";
      this.code = code;
      this.retryAfter = retryAfter;
    }
  }

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const abortError = () => new DOMException("Aborted", "AbortError");
  const jitter = (a, b) => a + Math.random() * (b - a);
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

  /* ---------- Demo answer library ---------- */
  const library = [
    {
      test: /principle/i,
      source: { label: "Interview synthesis", count: 12 },
      intros: [
        "Here’s a principle drawn from the three themes:",
        "One way to phrase it as a principle:",
      ],
      items: [
        "Show the next step — never present equal choices when one path is clearly better.",
        "Keep the evidence one click away — every summary links back to its source.",
        "Keep work connected — research, drafts, and decisions live in the same place.",
      ],
    },
    {
      test: /disagree/i,
      source: { label: "Navigation audit", count: 7 },
      intros: [
        "The sources agree on the problem but diverge in two places:",
        "Two areas show real disagreement between the sources:",
      ],
      items: [
        "Navigation depth — the interviews favor fewer top-level choices, while the audit argues every section should stay visible.",
        "Role of search — participants rarely used it, but the audit treats it as the main way to recover from a wrong turn.",
      ],
    },
    {
      test: /test/i,
      source: { label: "Interview synthesis", count: 12 },
      intros: [
        "I’d test in this order, starting with the cheapest change:",
        "Start with the smallest change that tests the biggest assumption:",
      ],
      items: [
        "A reduced top-level menu — it addresses the loss of momentum and is quick to prototype.",
        "A visible source link on every summary — it tests whether evidence changes how confidently teams act.",
        "A shared project view — it tests whether keeping research and drafts together reduces follow-up questions.",
      ],
    },
    {
      test: /friction|recurring/i,
      source: { label: "Interview synthesis", count: 12 },
      intros: [
        "Three themes appear consistently across the interviews:",
        "Looking at the sources again, three themes stand out:",
      ],
      items: [
        "Finding the next step — participants lose momentum when navigation exposes too many equal choices.",
        "Trusting the evidence — teams want a visible route back to the original source before acting on a summary.",
        "Keeping decisions connected — research, drafts, and follow-up conversations often separate after the initial workshop.",
      ],
    },
  ];

  function compose(prompt, context, variant = 0) {
    const hit = library.find((a) => a.test.test(prompt));
    if (hit) {
      return {
        blocks: [
          { kind: "p", text: hit.intros[variant % hit.intros.length] },
          ...hit.items.map((text) => ({ kind: "li", text })),
        ],
        source: hit.source,
      };
    }
    const project = context.project;
    const [first, second] = project.sources;
    const stem = (n) => n.replace(/\.[^.]+$/, "");
    const short = prompt.length > 60 ? prompt.slice(0, 57) + "…" : prompt;
    return {
      blocks: [
        {
          kind: "p",
          text: `Here’s what the sources in ${project.title} point to for “${short}”:`,
        },
        {
          kind: "li",
          text: `Start with ${first} — it holds the most direct evidence for this question.`,
        },
        {
          kind: "li",
          text: `Cross-check against ${second || first} — it adds the structure and constraints around it.`,
        },
        {
          kind: "li",
          text: "Next step — turn the strongest finding into a draft or a report so the team can review it.",
        },
      ],
      source: { label: stem(first), count: project.sources.length },
    };
  }

  const continuation = () => ({
    blocks: [
      {
        kind: "p",
        text: "To keep this moving, I’d turn the strongest theme into a short brief and link each claim back to its source, so the team can review the evidence together.",
      },
    ],
    source: null,
  });

  /* ---------- Mock provider ---------- */
  const provider = {
    name: "mock",
    async *stream({
      prompt,
      context,
      variant = 0,
      continueFrom = false,
      signal,
    }) {
      const lower = prompt.toLowerCase();
      yield { type: "stage", label: "Reading project sources" };
      await sleep(jitter(450, 700), signal);

      if (lower.includes("/error"))
        throw new AIError("network", "Network request failed");
      if (lower.includes("/limit"))
        throw new AIError("rate_limit", "Rate limited", 8);
      if (lower.includes("/context"))
        throw new AIError("context_limit", "Context limit reached");
      if (lower.includes("/down"))
        throw new AIError("unavailable", "Service unavailable");

      yield { type: "stage", label: "Finding patterns" };
      await sleep(jitter(500, 800), signal);

      const result = continueFrom
        ? continuation()
        : compose(prompt, context, variant);
      for (const block of result.blocks) {
        yield { type: "block", kind: block.kind };
        const parts = block.text.match(/\S+\s*/g) || [];
        for (let i = 0; i < parts.length; i += 2) {
          if (signal && signal.aborted) throw abortError();
          yield { type: "token", text: parts.slice(i, i + 2).join("") };
          await sleep(jitter(22, 60), signal);
        }
        await sleep(jitter(90, 180), signal);
      }
      yield { type: "done", source: result.source };
    },
  };

  return { stream: (request) => provider.stream(request), compose, AIError };
})();
