#!/usr/bin/env node
// Drive the declared exploration flows in Chromium and record what each step shows; evidence.py explore runs this.
"use strict";
const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

const STEP_TIMEOUT = 5000;
const SETTLE_TIMEOUT = 3000;
const QUIET = 300;
const ACTIONS = ["goto", "click", "fill", "select", "check", "press", "waitFor", "reload"];
const TARGETS = { role: "getByRole", label: "getByLabel", text: "getByText", placeholder: "getByPlaceholder", testId: "getByTestId", title: "getByTitle", altText: "getByAltText" };
const SECRET_FIELD = /pass|secret|token|api.?key|otp|pin\b/i;

// The project's own Playwright first, so exploration uses the version and browsers its tests use.
function playwright(dirs) {
  for (const dir of dirs) {
    for (const name of ["@playwright/test", "playwright"]) {
      try {
        return createRequire(path.join(dir, "package.json"))(name);
      } catch {
        // Not installed there; try the next.
      }
    }
  }
  return require("playwright");
}

function describe(target) {
  if (target.role) return `role=${target.role}` + (target.name === undefined ? "" : ` name=${JSON.stringify(target.name)}`);
  const kind = Object.keys(TARGETS).find((k) => k in target);
  return `${kind}=${JSON.stringify(target[kind])}`;
}

function locate(page, target) {
  if (target.role) return page.getByRole(target.role, target.name === undefined ? {} : { name: target.name, exact: Boolean(target.exact) });
  const kind = Object.keys(TARGETS).find((k) => k in target);
  return page[TARGETS[kind]](target[kind], kind === "testId" ? undefined : { exact: Boolean(target.exact) });
}

// Nearby elements to name when a target does not match: same role first, then any line sharing a word.
function candidates(aria, target) {
  const lines = aria.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("- "));
  if (target.role) {
    const same = lines.filter((l) => l.startsWith(`- ${target.role} `) || l === `- ${target.role}` || l.startsWith(`- ${target.role}:`));
    if (same.length) return same.slice(0, 15);
  }
  const words = String(target.name || target.label || target.text || target.placeholder || target.title || target.altText || "")
    .toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  return lines.filter((l) => words.some((w) => l.toLowerCase().includes(w))).slice(0, 15);
}

async function capture(page, aria) {
  const extra = await page.evaluate(() => {
    const values = (selector, attribute) => [...new Set([...document.querySelectorAll(selector)].map((e) => e.getAttribute(attribute)).filter(Boolean))];
    return {
      testIds: values("[data-testid]", "data-testid"),
      placeholders: values("[placeholder]", "placeholder"),
      titles: values("[title]", "title"),
      alts: values("img[alt]", "alt"),
      selects: [...document.querySelectorAll("select")].map((s) => ({
        name: s.getAttribute("aria-label") || (s.labels && s.labels[0] ? s.labels[0].textContent.trim() : "") || s.name || s.id,
        options: [...s.options].map((o) => ({ value: o.value, text: o.textContent.trim() })),
      })),
    };
  }).catch(() => ({ testIds: [], placeholders: [], titles: [], alts: [], selects: [] }));
  return { url: page.url(), aria, ...extra };
}

// No request in flight for QUIET ms, or SETTLE_TIMEOUT; a load state alone does not wait for a click's fetch.
async function settle(page, inflight) {
  const deadline = Date.now() + SETTLE_TIMEOUT;
  let quietSince = Date.now();
  while (Date.now() < deadline) {
    await page.waitForTimeout(50);
    if (inflight() > 0) quietSince = Date.now();
    else if (Date.now() - quietSince >= QUIET) return;
  }
}

async function runFlow(browser, flow, baseURL, writes, hidden) {
  const context = await browser.newContext({ baseURL, viewport: flow.viewport || { width: 1280, height: 800 }, ...(flow.locale ? { locale: flow.locale } : {}) });
  const page = await context.newPage();
  let requests = [];
  let consoleErrors = [];
  let blocked = [];
  let inflight = 0;
  page.on("request", () => inflight++);
  page.on("requestfinished", () => inflight--);
  page.on("requestfailed", () => inflight--);
  page.on("response", (r) => requests.push({ method: r.request().method(), url: r.url(), status: r.status() }));
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 300)));
  page.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 300)));
  if (!writes) {
    // Read-only exploration: a write never reaches the app, so a durable plan can be explored before approval.
    await page.route("**/*", (route) => {
      const method = route.request().method();
      if (["GET", "HEAD", "OPTIONS"].includes(method)) return route.continue();
      blocked.push(`${method} ${route.request().url()}`);
      return route.abort("blockedbyclient");
    });
  }
  const steps = [];
  let status = "OK";
  for (const [index, step] of flow.steps.entries()) {
    const action = ACTIONS.find((a) => a in step);
    const target = step[action];
    const shown = { ...step };
    if ("value" in step && typeof target === "object" && SECRET_FIELD.test(JSON.stringify(target))) {
      hidden.push(String(step.value));
      shown.value = "[REDACTED]";
    }
    const entry = { index, step: shown };
    try {
      if (action === "goto") await page.goto(target, { timeout: STEP_TIMEOUT * 3 });
      else if (action === "reload") await page.reload({ timeout: STEP_TIMEOUT * 3 });
      else {
        const locator = locate(page, target);
        await locator.first().waitFor({ state: action === "waitFor" ? "visible" : "attached", timeout: STEP_TIMEOUT }).catch(() => {
          throw new Error(`no element matches ${describe(target)} within ${STEP_TIMEOUT / 1000}s`);
        });
        const count = await locator.count();
        if (count > 1) throw new Error(`${describe(target)} matches ${count} elements; a test locator must match one`);
        if (action === "click") await locator.click({ timeout: STEP_TIMEOUT });
        else if (action === "fill") await locator.fill(String(step.value), { timeout: STEP_TIMEOUT });
        else if (action === "select") await locator.selectOption(String(step.value), { timeout: STEP_TIMEOUT });
        else if (action === "check") await locator.check({ timeout: STEP_TIMEOUT });
        else if (action === "press") await locator.press(String(step.key), { timeout: STEP_TIMEOUT });
      }
      // The state a test would assert on: after the requests this step started have settled.
      await settle(page, () => inflight);
    } catch (error) {
      status = "FAILED";
      entry.error = String(error.message || error).split("\n")[0].slice(0, 300);
    }
    const aria = await page.locator("body").ariaSnapshot({ timeout: STEP_TIMEOUT }).catch(() => "");
    Object.assign(entry, await capture(page, aria), { requests, console: consoleErrors, blockedWrites: blocked });
    if (entry.error && target && typeof target === "object") entry.candidates = candidates(aria, target);
    requests = [];
    consoleErrors = [];
    blocked = [];
    steps.push(entry);
    if (status === "FAILED") break;
  }
  await context.close();
  return { id: flow.id, status, steps };
}

async function main() {
  const [specPath, outPath, ...searchDirs] = process.argv.slice(2);
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const baseURL = process.env.RUNTIME_E2E_EXPLORE_BASE_URL;
  const writes = process.env.RUNTIME_E2E_EXPLORE_WRITES === "1";
  const hidden = [];
  const record = { browser: "chromium", baseURL, flows: [] };
  let browser;
  try {
    browser = await playwright(searchDirs).chromium.launch();
    record.browserVersion = browser.version();
    for (const flow of spec.flows) record.flows.push(await runFlow(browser, flow, baseURL, writes, hidden));
  } catch (error) {
    record.error = String(error.message || error).split("\n")[0].slice(0, 300);
  } finally {
    if (browser) await browser.close();
  }
  let text = JSON.stringify(record, null, 2);
  for (const value of hidden.filter((v) => v.length >= 3).sort((a, b) => b.length - a.length)) text = text.split(JSON.stringify(value).slice(1, -1)).join("[REDACTED]");
  fs.writeFileSync(outPath, text + "\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
