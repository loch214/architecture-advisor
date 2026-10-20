// Fitness function: client JavaScript a page loads on first visit stays under budget (ARCHITECTURE §8).
// Reads the prerendered HTML from `next build`, collects its <script> chunks (minus legacy polyfills, which
// modern browsers skip) and compares their gzipped total against the budget. Run after `npm run build`.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const KB = 1024;
/** Gzipped budget per page. React + the Next runtime alone are ~140 KB, so this leaves ~60 KB for our code. */
const BUDGET = 200 * KB;

const next = ".next";
const appDir = join(next, "server", "app");
if (!existsSync(appDir)) {
  console.error("No build output found. Run `npm run build` first.");
  process.exit(1);
}

const polyfills = new Set(JSON.parse(readFileSync(join(next, "build-manifest.json"), "utf8")).polyfillFiles ?? []);
const gzSize = (file) => gzipSync(readFileSync(join(next, file))).length;

const pages = readdirSync(appDir)
  .filter((f) => f.endsWith(".html") && !f.startsWith("_"))
  .map((f) => (f === "index.html" ? "/" : `/${f.replace(/\.html$/, "")}`));

let failed = false;
for (const route of pages.sort()) {
  const html = readFileSync(join(appDir, route === "/" ? "index.html" : `${route.slice(1)}.html`), "utf8");
  const chunks = [...new Set([...html.matchAll(/\/_next\/(static\/[^"'\s]+?\.js)/g)].map((m) => m[1]))].filter(
    (f) => !polyfills.has(f),
  );
  const total = chunks.reduce((sum, f) => sum + gzSize(f), 0);
  const ok = total <= BUDGET;
  failed ||= !ok;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${route.padEnd(16)} ${(total / KB).toFixed(1).padStart(6)} KB gz / ${BUDGET / KB} KB (${chunks.length} chunks)`,
  );
}

if (pages.length === 0) {
  console.error("No prerendered pages found to measure.");
  process.exit(1);
}
if (failed) {
  console.error("Client bundle over budget. Check for heavy imports in client components.");
  process.exit(1);
}
