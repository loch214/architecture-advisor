import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Fails on any WCAG 2.2 A/AA violation axe can detect on the current page. */
export const axe = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
};

/** The "AI explanation" section of a result (a page-level live region repeats its status for screen readers). */
export const aiPanel = (page: Page) => page.getByRole("region", { name: "AI explanation" });
