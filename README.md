# SaaSQuatch Leads - AI Web Scanner

AI Web Scanner is a full-stack prototype for Caprae's lead-generation challenge. It adds an account-intelligence workflow to the SaaSQuatch Leads product: enter a company website, scan public pages, detect buying signals, and generate a sales-ready account brief with OpenAI enrichment.

## Why This Feature

The reference product already has company/person enrichment and outreach generators. The gap this prototype targets is the step before outreach: deciding whether a website is worth sales attention and what angle should be used. This scanner converts public website copy into a prioritized lead brief, reducing manual account research.

## Features

- Public website scanner for homepage and common pages such as about, pricing, careers, customers, case studies, integrations, contact, and blog.
- Rule-based signal detection for pricing, hiring, integrations, proof, automation need, analytics, API/developer surface, and support pressure.
- OpenAI-backed enrichment for recommended angle, pain hypotheses, outreach context, and next-action reasoning.
- Graceful fallback to deterministic output if `OPENAI_API_KEY` is missing or the OpenAI request fails.
- SaaSQuatch-style dark dashboard with loading, empty, success, weak-signal, and export states.
- Copy JSON and download CSV actions for sales handoff.
- Node test coverage for scanner logic, API behavior, env loading, OpenAI fallback/success, and UI contract checks.

## Tech Stack

- App: Next.js App Router with React.
- Backend: Next.js route handler at `app/api/scan/route.js`, native `fetch`, native `node:test`.
- AI: OpenAI Responses API, loaded server-side through `OPENAI_API_KEY`.
- Storage strategy: stateless prototype. No persistent database is used in this time-boxed build; scan results are generated on demand and can be exported as JSON/CSV. For production, I would add PostgreSQL for scan history/accounts and Redis for short-lived page/enrichment caching.
- Hosting setup: Vercel deploys the Next.js frontend and backend together. The home page is static, while `/api/scan` runs as a server-side route handler.

## Setup

Requires Node.js 24+.

Create a local `.env` file:

```env
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-5.4-mini
```

The app still runs without a key, but responses will be rule-based and marked `Brief Ready` instead of `AI Enhanced`.

Run tests:

```powershell
npm.cmd test
```

Start the development server:

```powershell
npm.cmd run dev
```

Open:

```text
http://localhost:3000/
```

## API Demo

```powershell
$body = @{
  companyName = "XsolAI"
  websiteUrl = "https://xsol.ai"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/scan" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

## Verification Snapshot

Current test suite:

```text
npm.cmd test
26 tests passing
```

Recent browser QA:

- `xsol.ai`: `AI Enhanced`, score `97`, grade `A`, next action `Contact now`.
- `facebook.com`: `AI Enhanced`, score `59`, grade `C`, next action `Warm nurture`.
- Console warnings/errors during final browser checks: none.

## Vercel Deployment

The project is a standard Next.js app on Vercel:

- Live production demo: `https://ai-engineer-handbook-submission-ahs.vercel.app`
- The frontend lives in `app/page.jsx`.
- The backend lives in `app/api/scan/route.js`.
- `OPENAI_API_KEY` and optional `OPENAI_MODEL` should be configured as Vercel environment variables for AI-enhanced briefs.
- Without the key, the app still works in deterministic fallback mode.

## Security Notes

- The OpenAI API key is never sent to the browser.
- `.env` is ignored by `.gitignore`.
- OpenAI calls happen only in `src/openai-enrichment.js` on the backend.
- The browser calls only `/api/scan`; the route handler reads `OPENAI_API_KEY` server-side.
- If the AI request fails, the scanner returns the deterministic rule-based brief instead of exposing an error to the user.
