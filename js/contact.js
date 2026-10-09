/* ==========================================================================
   Contact form — validation + mock delivery.
   `contactService` is the only thing to replace when Firebase is added
   (e.g. addDoc(collection(db, 'messages'), payload)).
   ========================================================================== */
(() => {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const card = form.closest(".form-card");
  const success = card.querySelector("[data-contact-success]");
  const submit = form.querySelector('[type="submit"]');
  const submitLabel = submit.querySelector("[data-label]");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* DEMO ONLY — nothing is sent anywhere. */
  const contactService = {
    async send(payload) {
      await new Promise((resolve) =>
        setTimeout(resolve, reduceMotion ? 200 : 1000),
      );
      return { ok: true, payload };
    },
  };

  const rules = {
    name: (v) => v.trim().length >= 2 || "Please tell us your name.",
    email: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ||
      "Enter an email address like name@company.com.",
    topic: (v) => Boolean(v) || "Choose what this is about.",
    message: (v) =>
      v.trim().length >= 20 ||
      "Add a little more detail (at least 20 characters).",
  };

  const fieldOf = (input) => input.closest(".field");

  function validate(input) {
    const result = rules[input.name](input.value);
    const field = fieldOf(input);
    const valid = result === true;
    field.classList.toggle("field--invalid", !valid);
    input.setAttribute("aria-invalid", String(!valid));
    field.querySelector("[data-error-text]").textContent = valid ? "" : result;
    return valid;
  }

  const inputs = [...form.querySelectorAll("[name]")].filter(
    (i) => rules[i.name],
  );

  inputs.forEach((input) => {
    input.addEventListener("blur", () => {
      if (input.value || fieldOf(input).classList.contains("field--invalid"))
        validate(input);
    });
    input.addEventListener("input", () => {
      if (fieldOf(input).classList.contains("field--invalid")) validate(input);
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const invalid = inputs.filter((input) => !validate(input));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    submit.disabled = true;
    submit.setAttribute("aria-busy", "true");
    submitLabel.textContent = "Sending…";

    try {
      await contactService.send(Object.fromEntries(new FormData(form)));
      card.classList.add("is-sent");
      success.focus();
    } catch (error) {
      submit.disabled = false;
      submit.removeAttribute("aria-busy");
      submitLabel.textContent = "Send message";
      const first = inputs[0];
      fieldOf(first).querySelector("[data-error-text]").textContent =
        "We could not send your message. Check your connection and try again.";
      fieldOf(first).classList.add("field--invalid");
    }
  });
})();
