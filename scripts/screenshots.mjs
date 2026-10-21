// README screenshots of the live site. Uses a browser already on the machine (Edge by default), so nothing is
// downloaded. Usage: node scripts/screenshots.mjs [base URL] [channel] [out dir]. Writes PNGs to docs/screenshots/.
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "https://architecture-advisor-pink.vercel.app";
const channel = process.argv[3] ?? "msedge";
const out = process.argv[4] ?? "docs/screenshots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const shot = (name, options = {}) => page.screenshot({ path: `${out}/${name}.png`, ...options });

await page.goto(base);
await shot("landing");

await page.goto(`${base}/advisor?new`);
await shot("form-step");

await page.goto(`${base}/advisor?example=ticketing`);
const ai = page.getByRole("region", { name: "In plain words (AI)" });
await ai.getByText(/Explanation by/).waitFor({ timeout: 30_000 });
// Header, the "why" section and the AI panel; the trade-off table gets its own shot below.
const panelBottom = await ai.evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
await shot("result-ai", { fullPage: true, clip: { x: 0, y: 0, width: 1280, height: Math.ceil(panelBottom) + 24 } });

const table = page
  .getByRole("table")
  .filter({ has: page.getByRole("columnheader", { name: "Space-based architecture" }) });
await table.scrollIntoViewIfNeeded();
await table.screenshot({ path: `${out}/trade-off-table.png` });

await browser.close();
console.log(`Saved screenshots to ${out}/`);
