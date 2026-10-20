import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const axe = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
};

test.beforeEach(async ({ page }) => {
  await page.goto("/advisor");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("preset → submit shows a rules-only result with the AI 'not enabled' state", async ({ page }) => {
  await page.getByRole("button", { name: /High-traffic ticketing/ }).click();
  await expect(page.getByRole("heading", { name: "Anything else? + review" })).toBeVisible();
  await page.getByRole("button", { name: "Get recommendation" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Space-based architecture" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ranked styles" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trade-off comparison" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Space-based architecture" })).toBeVisible();
  await expect(page.getByText("AI not enabled yet")).toBeVisible();
  await axe(page);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^architecture-advice-\d{4}-\d{2}-\d{2}\.json$/);
});

test("the form blocks moving on until each step is valid, with clear messages", async ({ page }) => {
  await page.getByRole("button", { name: "Start blank" }).click();
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
  await page.getByRole("button", { name: "Student project" }).click();
  await page.getByRole("button", { name: /Edit What matters most/ }).click();
  await expect(page.getByText(/at least Critical \(from Very limited\)/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "What matters most" })).toBeVisible();
  await expect(
    page.getByRole("radiogroup", { name: "Maintainability" }).getByRole("radio", { name: "High" }),
  ).toBeChecked();
});

test("opting out of AI says nothing was sent", async ({ page }) => {
  await page.getByRole("button", { name: "Startup MVP" }).click();
  await page.getByText("Don't use AI for this request").click();
  await page.getByRole("button", { name: "Get recommendation" }).click();
  await expect(page.getByText("AI turned off for this request")).toBeVisible();
  await expect(page.getByText(/Your answers pull in different directions/)).toBeVisible();
});

test("landing and methodology pages render and are accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await axe(page);
  await page.goto("/methodology");
  await expect(page.getByRole("heading", { name: "How it works", level: 1 })).toBeVisible();
  await expect(page.getByText("R11. Strict ACID transactions")).toBeVisible();
  await axe(page);
});
