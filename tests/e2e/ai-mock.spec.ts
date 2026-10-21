import { expect, test, type Page } from "@playwright/test";
import { MOCK_PORTS } from "../../playwright.config";
import { aiPanel, axe } from "./helpers";

// TESTING_STRATEGY §5 cases 2–3: the AI states with AI_MODE=mock, so no AI service is called.
const at = (mock: keyof typeof MOCK_PORTS) => `http://localhost:${MOCK_PORTS[mock]}`;

async function submitPreset(page: Page, baseURL: string, preset: string) {
  await page.goto(`${baseURL}/advisor`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: preset }).click();
  await page.getByRole("button", { name: "Get recommendation" }).click();
}

test("AI ok: the explanation fills in and names the provider", async ({ page }) => {
  await submitPreset(page, at("ok"), "Student project");
  await expect(page.getByRole("heading", { level: 1, name: "Modular monolith" })).toBeVisible();
  await expect(page.getByText(/Mock explanation: modular-monolith ranks first/)).toBeVisible();
  await expect(page.getByText("Explanation by Mock AI.")).toBeVisible();
  await expect(page.getByText("AI changed the order", { exact: true })).toHaveCount(0);
  await axe(page);
});

test("AI fails: a neutral fallback with Retry, and the rule result stays complete", async ({ page }) => {
  await submitPreset(page, at("fail"), "Student project");
  await expect(aiPanel(page).getByText("AI explanation isn't available right now")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trade-off comparison" })).toBeVisible();
});

test("AI moves another style to #1: the 'AI changed the order' banner explains it", async ({ page }) => {
  await submitPreset(page, at("reorder"), "Startup MVP");
  await expect(page.getByText("AI changed the order", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Serverless" })).toBeVisible();
  await expect(page.getByText(/Our rule engine ranked Service-based architecture first/)).toBeVisible();
  await axe(page);
});

test("a shared link shows the rule result and asks the AI again", async ({ page }) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await submitPreset(page, at("ok"), "Student project");
  await page.getByRole("button", { name: "Copy link" }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());

  await page.evaluate(() => localStorage.clear());
  await page.goto(link);
  await expect(page.getByRole("heading", { level: 1, name: "Modular monolith" })).toBeVisible();
  await expect(page.getByText(/Mock explanation: modular-monolith ranks first/)).toBeVisible();
});
