(() => {
  "use strict";

  const form = document.querySelector("#lead-form");
  if (!form) return;

  const button = form.querySelector("button[type='submit']");
  const controls = Array.from(form.querySelectorAll("input, button"));
  const status = document.querySelector("#form-status");
  const interestInputs = Array.from(form.querySelectorAll("input[name='interests']"));
  const marketingConsent = form.querySelector("#marketingConsent");
  const interestsError = document.querySelector("#interests-error");
  const fields = {
    name: { input: document.querySelector("#name"), error: document.querySelector("#name-error"), label: "Name" },
    businessName: { input: document.querySelector("#businessName"), error: document.querySelector("#business-error"), label: "Business name" },
    email: { input: document.querySelector("#email"), error: document.querySelector("#email-error"), label: "Email" }
  };
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const consentText = "By checking this box, I agree to receive email and SMS messages from Beyond Excellence 4U LLC / All4UDigital. Message frequency may vary. Message and data rates may apply. Reply STOP to opt out of SMS messages or use the unsubscribe link in any email. Consent is not a condition of purchase.";

  function showError(field, message) {
    field.error.textContent = message;
    field.input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validate() {
    let valid = true;
    Object.values(fields).forEach((field) => {
      const value = field.input.value.trim();
      let message = value ? "" : `${field.label} is required.`;
      if (field.input.type === "email" && value && !emailPattern.test(value)) message = "Enter a valid email address.";
      showError(field, message);
      if (message) valid = false;
    });

    const hasInterest = interestInputs.some((input) => input.checked);
    interestsError.textContent = hasInterest ? "" : "Select at least one area where added capacity would help.";
    interestInputs.forEach((input) => input.setAttribute("aria-invalid", hasInterest ? "false" : "true"));
    if (!hasInterest) valid = false;
    return valid;
  }

  Object.values(fields).forEach((field) => {
    field.input.addEventListener("input", () => {
      if (field.input.getAttribute("aria-invalid") === "true") validate();
    });
  });

  interestInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.getAttribute("aria-invalid") === "true") validate();
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    if (!validate()) {
      const invalidField = Object.values(fields).find((field) => field.input.getAttribute("aria-invalid") === "true");
      (invalidField?.input || interestInputs.find((input) => input.getAttribute("aria-invalid") === "true"))?.focus();
      return;
    }

    controls.forEach((control) => { control.disabled = true; });
    button.querySelector("span:first-child").textContent = "Preparing your guide…";
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch("https://hook.us2.make.com/y39yq1zceealuufs1wskuayaygd0iia4", {
        method: "POST",
        headers: {
          "Accept": "text/plain",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: fields.name.input.value.trim(),
          businessName: fields.businessName.input.value.trim(),
          email: fields.email.input.value.trim().toLowerCase(),
          interests: interestInputs.filter((input) => input.checked).map((input) => input.value),
          marketingConsent: marketingConsent.checked,
          consentText,
          consentCapturedAt: new Date().toISOString(),
          source: "Project #173",
          campaignTag: "B4 You Hire 2027 Campaign"
        }),
        signal: controller.signal
      });

      if (!response.ok) throw new Error("We could not prepare your access. Please try again.");
      window.location.assign("./thank-you.html");
    } catch (error) {
      status.textContent = error.name === "AbortError"
        ? "The request took too long. Please check your connection and try again."
        : error.message || "Something went wrong. Please try again.";
    } finally {
      window.clearTimeout(timeout);
      controls.forEach((control) => { control.disabled = false; });
      button.querySelector("span:first-child").textContent = "Get the guide";
    }
  });
})();
