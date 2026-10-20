// Fitness function: no browser-exposed (NEXT_PUBLIC_) variable may look like a secret.
// API keys are server-only (CLAUDE.md, AI_INTEGRATION §9).
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const SECRET = /NEXT_PUBLIC_[A-Z0-9_]*(KEY|TOKEN|SECRET|PASSWORD)/g;
const roots = ["src", "next.config.ts", ".env.example"].filter((p) => existsSync(p));
const hits = [];

function scan(path) {
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path)) scan(join(path, entry));
    return;
  }
  const text = readFileSync(path, "utf8");
  for (const m of text.matchAll(SECRET)) hits.push(`${path}: ${m[0]}`);
}
roots.forEach(scan);

if (hits.length > 0) {
  console.error("Secret-looking NEXT_PUBLIC_ variables found (these would be sent to the browser):");
  hits.forEach((h) => console.error(`  ${h}`));
  process.exit(1);
}
console.log("env names ok: no secret-looking NEXT_PUBLIC_ variables");
