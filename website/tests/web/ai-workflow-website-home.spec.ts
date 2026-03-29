import { expect, test } from "@playwright/test";

const EN_HOME_TITLE = "From rough prompt to reviewable AI execution.";
const VI_HOME_TITLE = "Từ prompt thô đến luồng thực thi AI có thể review.";
const CODEX_INSTALL_COMMAND =
  "curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --tool codex";
const CLAUDE_INSTALL_COMMAND =
  "curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --tool claude";
const ANTIGRAVITY_INSTALL_COMMAND =
  "curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --tool antigravity";
const INSTALL_SECTION_TITLE = "Pick your tool. Copy the command. Done.";
const HIGHLIGHTS_TITLE =
  "A homepage that explains the system before users open the repository.";
const ROUTES_TITLE =
  "Move from landing page to install, workflow visualization, and skill discovery.";
const PROOF_TITLE = "Built around one predictable flow";

test.describe("AI Workflow website home page", () => {
  test("renders the landing hero and key home sections", async ({
    page,
  }, testInfo) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: EN_HOME_TITLE }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Install the workflow" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Preview the workflow" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy command" }),
    ).toBeVisible();
    await expect(page.getByText(PROOF_TITLE)).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: INSTALL_SECTION_TITLE,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: HIGHLIGHTS_TITLE,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: ROUTES_TITLE,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", {
        name: "Animated workflow node map showing requirement intake, epic routing, plan review, and execution.",
      }),
    ).toBeVisible();

    await page.screenshot({
      path: testInfo.outputPath("home-desktop.png"),
      fullPage: true,
    });
  });

  test("navigates to install from the primary CTA", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Install the workflow" }).click();

    await page.waitForURL("**/install", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/install$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Pick your tool, then copy the install command.",
      }),
    ).toBeVisible();
  });

  test("shows copy feedback and writes the preview command to the clipboard", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: "http://localhost:3000",
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Copy command" }).click();

    await expect(page.getByRole("button", { name: /copied!/i })).toBeVisible();

    const clipboardText = await page.evaluate(async () =>
      navigator.clipboard.readText(),
    );
    expect(clipboardText).toBe(CODEX_INSTALL_COMMAND);
  });

  test("persists the selected language on the home page after reload", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "VI", exact: true }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: VI_HOME_TITLE }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: VI_HOME_TITLE }),
    ).toBeVisible();
  });

  test("keeps the hero readable on a mobile viewport", async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      screen: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    await page.goto("/");

    await expect(
      page.getByRole("button", { name: "Open navigation menu" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: EN_HOME_TITLE }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Install the workflow" }),
    ).toBeVisible();

    await page.screenshot({
      path: testInfo.outputPath("home-mobile.png"),
      fullPage: true,
    });

    await context.close();
  });

  test("install preview tool tabs are interactive", async ({ page }) => {
    await page.goto("/");

    const commandPreview = page.locator("pre").first();

    await expect(page.getByRole("button", { name: "Codex" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(commandPreview).toContainText(CODEX_INSTALL_COMMAND);

    await page.getByRole("button", { name: "Claude Code" }).click();
    await expect(
      page.getByRole("button", { name: "Claude Code" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(commandPreview).toContainText(CLAUDE_INSTALL_COMMAND);

    await page.getByRole("button", { name: "Google Antigravity" }).click();
    await expect(
      page.getByRole("button", { name: "Google Antigravity" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(commandPreview).toContainText(ANTIGRAVITY_INSTALL_COMMAND);
  });

  test("tablet viewport renders without horizontal overflow", async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
      screen: { width: 768, height: 1024 },
    });
    const page = await context.newPage();

    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: EN_HOME_TITLE }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: INSTALL_SECTION_TITLE }),
    ).toBeVisible();

    const layoutMetrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));

    expect(layoutMetrics.scrollWidth).toBeLessThanOrEqual(
      layoutMetrics.viewportWidth,
    );

    await page.screenshot({
      path: testInfo.outputPath("home-tablet.png"),
      fullPage: true,
    });

    await context.close();
  });

  test("reduced motion renders final content without waiting on animations", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.getByText(PROOF_TITLE)).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: INSTALL_SECTION_TITLE }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: HIGHLIGHTS_TITLE }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: ROUTES_TITLE }),
    ).toBeVisible();

    await expect(page.getByLabel("AI tools: 3")).toBeVisible();
    await expect(page.getByLabel("Ready skills: 16")).toBeVisible();
    await expect(page.getByLabel("Workflow graphs: 2")).toBeVisible();
  });

  test("favicon loads without 404", async ({ request }) => {
    const response = await request.get("/favicon.ico");

    expect(response.status()).toBe(200);
  });
});
