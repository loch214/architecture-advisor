# Tech Stack

**Verdict:** your preferred stack (Next.js + TypeScript on Vercel) fits well. No strong reason to change it. There are two caveats (below), and neither needs a change.

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js** (App Router, latest stable at scaffold time, 16.x as of writing) | React UI + server API routes in one app/deploy; first-class on Vercel |
| Language | **TypeScript** (strict) | Shared types between engine, KB, API and UI |
| Validation | **Zod** | One schema for KB files, form input, API body, AI response |
| UI | **Tailwind CSS + shadcn/ui** (copy-in accessible components built on Radix) | Fast, accessible form controls (segmented controls, tooltips, tabs); no heavy UI library |
| Forms | Plain React state + the engine's `checkInput()` (decided in build session 2) | One validator shared by form, engine and API; no extra dependency. React Hook Form was the original plan |
| AI | **Vercel AI SDK** (`ai` 7, `@ai-sdk/google` 4, `@ai-sdk/groq` 4) | One API for several providers, structured output (`generateText` + `Output.object`), abort/timeout support |
| Cache / rate limit | **Upstash Redis** + `@upstash/ratelimit` (free: 256 MB, 500K commands/month) | Shared across serverless instances; HTTP-based (works in serverless) |
| Tests | **Vitest**, fast-check (property tests), Playwright (a few E2E), Testing Library | Fast unit tests for the engine; real-browser check of main flow |
| Architecture checks | dependency-cruiser, `server-only` | Fitness functions (see ARCHITECTURE §8) |
| Lint/format | ESLint 10 + Prettier (LF line endings, enforced by `.gitattributes`) | ESLint 9 is deprecated. `package.json` `overrides: { "eslint": "$eslint" }` makes the plugins inside `eslint-config-next` use our ESLint 10, which removes npm's peer-dependency warnings (a peer dependency is a package a plugin expects you to install yourself). |
| Checks | `npm run check` locally (no CI server, owner decision Q23) | Lint, typecheck, tests, fitness functions in one command; Vercel still builds a preview per push |
| Hosting | **Vercel Hobby** | Free, previews per branch, serverless functions up to 300 s |
| Future DB + auth | **Supabase** (Postgres + Auth) *or* Neon + Auth.js | See below |

## Free-tier limits that matter
| Service | Limit | Our expected use |
|---|---|---|
| Vercel Hobby | Monthly function/CPU allotments; 300 s max duration; **non-commercial only**; 1 h log retention | One function (`/api/explain`), ~1–15 s each. Far below limits |
| Gemini Flash-Lite | ~15 RPM / 500 RPD (not officially published) | Primary AI |
| Groq | 30 RPM / 1,000 RPD / 8K TPM | Fallback |
| Upstash | 500K commands/month | ~4 commands/request ≈ 125K requests/month capacity |

## Caveats
1. **Vercel Hobby is non-commercial.** Fine: owner confirmed no commercial plans (2026-10-21).
2. **Serverless instances don't share memory.** Each request may run on a fresh copy of the function, so an in-memory cache or counter is forgotten or split across copies. That's why we use Upstash (decided). **Setup timing:** Phase 5, through the **Vercel Marketplace** (Vercel dashboard → Storage → Upstash Redis). That creates the database on the free plan and injects `UPSTASH_REDIS_REST_URL` / `_TOKEN` into the project automatically, so no keys are copied by hand. The owner does the one-time sign-up / consent click.

## Alternatives considered
| Option | Verdict |
|---|---|
| Cloudflare Pages + Workers | Strong alternative (generous free tier, commercial use allowed, Workers AI built in). Next.js support works via an adapter but is less seamless than on Vercel. Keep as plan B |
| Netlify | Similar to Vercel, but Next.js support lags slightly |
| SvelteKit / Astro | Fine technically, but Next.js is better for your CV and matches your preference |
| Separate Python backend | Not needed; adds a second deploy |

## Future database (login + history)
| Option | Pros | Cons |
|---|---|---|
| **Supabase** (recommended) | Postgres + Auth + Row Level Security in one; 50K MAU free | Free projects pause after 1 week of inactivity (wakes on access, but the first request is slow); a keep-alive cron can avoid it |
| Neon Postgres + Auth.js | Serverless Postgres, scales to zero, Vercel Marketplace integration | Auth is a separate piece to wire up |

Storage model is simple: `results(id, user_id, created_at, payload jsonb)`, where `payload` is the AdvisorResult object as-is.
