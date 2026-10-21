import { expect, test, type Page } from "@playwright/test";
import { MOCK_PORTS } from "../../playwright.config";
import { aiPanel, axe } from "./helpers";

// TESTING_STRATEGY §5 cases 2–3: the AI states with AI_MODE=mock, so no AI service is called.
const at = (mock: keyof typeof MOCK_PORTS) => `http://localhost:${MOCK_PORTS[mock]}`;

/** Opens one of the home page's examples, which shows its result straight away. */
const openExample = (page: Page, baseURL: string, example: string) =>
  page.goto(`${baseURL}/advisor?example=${example}`);

/** A share link (share-link.ts format) for golden scenario G10, where the top two styles tie. */
const tieLink = (baseURL: string) => {
  const drivers = {
    "system-type": "unsure",
    "qa-scope": "unsure",
    "time-to-market": "tight",
    budget: "very-limited",
    "team-size": "1-3",
    experience: "some",
    growth: "spiky",
    lifespan: "unsure",
    "change-rate": "unsure",
  };
  const body = { v: 1, a: { deployability: "high", scalability: "low" }, d: drivers, c: {} };
  return `${baseURL}/advisor#a=${Buffer.from(JSON.stringify(body)).toString("base64url")}`;
};

test("AI ok: the explanation fills in and names the provider", async ({ page }) => {
  await openExample(page, at("ok"), "student");
  await expect(page.getByRole("heading", { level: 1, name: "Modular monolith" })).toBeVisible();
  await expect(page.getByText(/Mock explanation: modular-monolith ranks first/)).toBeVisible();
  await expect(page.getByText("Explanation by Mock AI.")).toBeVisible();
  await expect(page.getByText("AI changed the order", { exact: true })).toHaveCount(0);
  await axe(page);
});

test("AI fails: a neutral fallback with Retry, and the rule result stays complete", async ({ page }) => {
  await openExample(page, at("fail"), "student");
  await expect(aiPanel(page).getByText("AI explanation isn't available right now")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trade-off comparison" })).toBeVisible();
});

test("AI moves another style to #1: the 'AI changed the order' banner explains it", async ({ page }) => {
  await page.goto(tieLink(at("reorder")));
  await expect(page.getByText("AI changed the order", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Serverless" })).toBeVisible();
  await expect(page.getByText(/Our rule engine ranked Service-based architecture first/)).toBeVisible();
  await axe(page);
});

test("a shared link shows the rule result and asks the AI again", async ({ page }) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await openExample(page, at("ok"), "student");
  await page.getByRole("button", { name: "Copy link" }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());

  await page.evaluate(() => sessionStorage.clear());
  await page.goto(link);
  await expect(page.getByRole("heading", { level: 1, name: "Modular monolith" })).toBeVisible();
  await expect(page.getByText(/Mock explanation: modular-monolith ranks first/)).toBeVisible();
});
