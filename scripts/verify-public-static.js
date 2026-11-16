"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const webhook = "https://hook.us2.make.com/y39yq1zceealuufs1wskuayaygd0iia4";
const guide = "Project-173-Build-Your-2027-Marketing-Campaign-Guide-Final.pdf";
const chat = "https://links.convertwave.ai/widget/bookings/get-your-ai-marketing-team";
const consentText = "By checking this box, I agree to receive email and SMS messages from Beyond Excellence 4U LLC / All4UDigital. Message frequency may vary. Message and data rates may apply. Reply STOP to opt out of SMS messages or use the unsubscribe link in any email. Consent is not a condition of purchase.";
const runtimeFiles = ["index.html", "script.js", "thank-you.html", "styles.css", "vercel.json"];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const index = read("index.html");
const script = read("script.js");
const thankYou = read("thank-you.html");
const bridgeRouter = read("scripts/prepare_existing_readiness_bridge_router.py");

assert.ok(index.includes(`action="${webhook}"`), "index.html must use the exact Make webhook as its form action");
assert.ok(script.includes(`fetch("${webhook}"`), "script.js must POST to the exact Make webhook");
assert.ok(fs.existsSync(path.join(root, "public", guide)), "the exact guide PDF must exist in public/");
assert.ok(thankYou.includes(`href="./public/${guide}"`), "thank-you.html must link the exact guide PDF");
assert.ok(thankYou.includes(`download="${guide}"`), "the guide download filename must be exact");
assert.ok(thankYou.includes(`href="${chat}"`), "the secondary chat link must be exact");

for (const field of ["name", "businessName", "email"]) {
  assert.match(index, new RegExp(`<input[^>]+name="${field}"`), `form field ${field} must exist`);
}

const consentInput = index.match(/<input[^>]+id="marketingConsent"[^>]+name="marketingConsent"[^>]+type="checkbox"[^>]*>/);
assert.ok(consentInput, "optional marketing consent checkbox must exist");
assert.doesNotMatch(consentInput[0], /\brequired\b/, "marketing consent must not be required");
assert.doesNotMatch(consentInput[0], /\bchecked\b/, "marketing consent must be unchecked by default");
assert.ok(index.includes(`<label class="consent-option" for="marketingConsent">`), "marketing consent must have an accessible label");
assert.equal(index.split(consentText).length - 1, 1, "the exact consent copy must appear once on the form");

for (const interest of [
  "marketing_support",
  "follow_up_and_customer_response",
  "operations_and_workflow_support"
]) {
  assert.ok(index.includes(`value="${interest}"`), `interest value ${interest} must exist`);
}

for (const fragment of [
  "name: fields.name.input.value.trim()",
  "businessName: fields.businessName.input.value.trim()",
  "email: fields.email.input.value.trim().toLowerCase()",
  "interests: interestInputs.filter((input) => input.checked).map((input) => input.value),",
  "marketingConsent: marketingConsent.checked",
  "consentText,",
  "consentCapturedAt: new Date().toISOString()",
  ".toLowerCase()",
  'source: "Project #173"',
  'campaignTag: "B4 You Hire 2027 Campaign"'
]) {
  assert.ok(script.includes(fragment), `script payload must contain ${fragment}`);
}

const payload = script.match(/body: JSON\.stringify\(\{([\s\S]*?)\}\),\s*signal:/);
assert.ok(payload, "script.js must send a JSON payload");
assert.ok(script.includes(`const consentText = "${consentText}";`), "script.js must use the exact consent copy");
assert.ok(!script.includes("interestsText"), "script.js must not reference interestsText");
assert.ok(
  !script.includes("interests: checkedInterests.join"),
  "script.js must send interests as an array"
);
assert.doesNotMatch(payload[1], /\binterestsText\s*:/, "script payload must not contain interestsText");
assert.match(
  payload[1],
  /interests\s*:\s*interestInputs\.filter\(\(input\)\s*=>\s*input\.checked\)\.map\(\(input\)\s*=>\s*input\.value\)\s*[,}]/,
  "script payload must serialize interests as an array"
);
assert.ok(
  bridgeRouter.includes("Selected interests: {{join(1.interests; space)}}"),
  "Make note must use the exact quote-free interests join expression"
);
assert.ok(
  bridgeRouter.includes('if any("interestsText" in text for text in blueprint_strings):'),
  "Make validation must reject interestsText"
);
assert.ok(
  bridgeRouter.includes('if any("interests: checkedInterests.join" in text for text in blueprint_strings):'),
  "Make validation must reject stringified browser interests mapping"
);
assert.ok(
  bridgeRouter.includes(`if any('{{join(1.interests; \", \")}}' in text for text in blueprint_strings):`),
  "Make validation must reject the old quoted-delimiter join expression"
);
assert.doesNotMatch(
  payload[1],
  /(?:\bName|["']Business Name["']|["']Business Email["'])\s*:/,
  "script payload must not contain legacy uppercase or spaced field keys"
);

for (const [file, contents] of [["index.html", index], ["thank-you.html", thankYou]]) {
  assert.doesNotMatch(contents, /Founder Review|Founder edition|Project #173|private guide|private access|private material|private review|01 \/ Access/i, `${file} contains removed public wording`);
}

for (const file of runtimeFiles) {
  const contents = read(file);
  assert.ok(!contents.includes("/api/submit"), `${file} must not reference /api/submit`);
  assert.doesNotMatch(contents, /\b(?:GHL_API_KEY|MAKE_API_KEY|GHL_LOCATION_ID)\b/i, `${file} contains a forbidden secret name`);
  assert.doesNotMatch(contents, /\b(?:sk_live_|sk_test_|ghp_|github_pat_|Bearer\s+)[A-Za-z0-9._-]{8,}/i, `${file} contains a secret-like token`);
}

assert.ok(!fs.existsSync(path.join(root, "api", "submit.js")), "unused api/submit.js must be removed");
console.log("Public static verification passed.");
