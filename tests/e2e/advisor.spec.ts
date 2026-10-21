import { expect, test } from "@playwright/test";
import { aiPanel, axe } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/advisor?new");
});

test("an example opens its rules-only result with the AI 'not enabled' state", async ({ page }) => {
  await page.goto("/advisor?example=ticketing");
  await expect(page.getByText("Example: High-traffic ticketing")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Space-based architecture" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Why Space-based architecture fits your project" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "All styles, ranked" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trade-off comparison" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Space-based architecture" })).toBeVisible();
  await expect(aiPanel(page).getByText("AI not enabled yet")).toBeVisible();
  await expect(page).toHaveURL(/\/advisor$/);
  await axe(page);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^architecture-advice-\d{4}-\d{2}-\d{2}\.json$/);
});

test("the desktop IDE example recommends a microkernel and lists what an installed app rules out", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Desktop IDE with plug-ins/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Microkernel" })).toBeVisible();
  await expect(page.getByText(/Ruled out: .*Microservices/)).toBeVisible();
});

test("the form blocks moving on until each step is valid, with clear messages", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Your project & team" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText(/things to fix before moving on/)).toBeVisible();
  await axe(page);

  for (const group of await page.getByRole("radiogroup").all()) {
    await group.getByRole("radio", { name: "Not sure" }).click();
  }
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "What matters most" })).toBeVisible();

  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText(/at least one quality attribute as High or Critical/).first()).toBeVisible();
  await page.getByRole("radiogroup", { name: "Low cost" }).getByRole("radio", { name: "Critical" }).click();
  await axe(page);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Your system's shape" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Get recommendation" }).click();
  await expect(page.getByText("Top recommendation")).toBeVisible();
});

test("answers survive a refresh, and floor chips show what other answers imply", async ({ page }) => {
  await page.goto("/advisor?example=student");
  await page.getByRole("button", { name: "Edit these answers" }).click();
  await page.getByRole("button", { name: /Edit What matters most/ }).click();
  await expect(page.getByText(/at least Critical \(from Very limited\)/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "What matters most" })).toBeVisible();
  await expect(
    page.getByRole("radiogroup", { name: "Maintainability" }).getByRole("radio", { name: "High" }),
  ).toBeChecked();
});

test("a new visit starts with a blank form, and Start over clears the answers", async ({ page, context }) => {
  await page
    .getByRole("radiogroup", { name: "How many people will build it?" })
    .getByRole("radio", { name: "1–3", exact: true })
    .click();

  // A new tab is a new visit: nothing carries over.
  const other = await context.newPage();
  await other.goto("/advisor");
  await expect(other.getByRole("heading", { name: "Your project & team" })).toBeVisible();
  await expect(other.getByRole("radio", { name: "1–3", exact: true })).not.toBeChecked();
  await expect(other.getByRole("button", { name: "Start over" })).toHaveCount(0);
  await other.close();

  await page.getByRole("button", { name: "Start over" }).click();
  await page.getByRole("button", { name: "Yes, start over" }).click();
  await expect(page.getByRole("radio", { name: "1–3", exact: true })).not.toBeChecked();
});

test("opting out of AI says nothing was sent", async ({ page }) => {
  await page.goto("/advisor?example=student");
  await page.getByRole("button", { name: "Edit these answers" }).click();
  await page.getByText("Don't use AI for this request").click();
  await page.getByRole("button", { name: "Get recommendation" }).click();
  await expect(aiPanel(page).getByText("AI turned off for this request")).toBeVisible();
  await expect(page.getByText(/^Example:/)).toHaveCount(0);
});

test("landing, methodology, about and privacy pages render and are accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Start a new recommendation/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Or explore an example" })).toBeVisible();
  await axe(page);
  await page.goto("/methodology");
  await expect(page.getByRole("heading", { name: "How it works", level: 1 })).toBeVisible();
  await expect(page.getByText("R11. Strict ACID transactions")).toBeVisible();
  await axe(page);
  for (const path of ["/about", "/privacy"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await axe(page);
  }
});

test("Copy link reopens the same result in a fresh browser, and a broken link says so", async ({ page, browser }) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/advisor?example=ticketing");
  await expect(page.getByRole("heading", { level: 1, name: "Space-based architecture" })).toBeVisible();
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.getByRole("button", { name: "Link copied" })).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(/\/advisor#a=[\w-]+$/);

  const context = await browser.newContext();
  const other = await context.newPage();
  await other.goto(link);
  await expect(other.getByRole("heading", { level: 1, name: "Space-based architecture" })).toBeVisible();
  await expect(other).toHaveURL(/\/advisor$/);
  await axe(other);

  // Same page, new hash: the app reacts to the hash change without a reload.
  await other.goto(link.replace(/#.*/, "#a=broken"));
  await expect(other.getByText("We couldn't open that link")).toBeVisible();
  await expect(other.getByRole("heading", { name: "Your project & team" })).toBeVisible();
  await axe(other);
  await context.close();
});
