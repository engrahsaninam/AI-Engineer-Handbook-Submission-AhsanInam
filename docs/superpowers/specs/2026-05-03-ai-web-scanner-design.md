# AI Web Scanner Design

## Goal

Build a runnable SaaSQuatch-style prototype for the missing "AI Web Scanner" module. The scanner turns a company website into an account brief that helps a sales user decide whether the lead is worth outreach and what message to send.

## User Flow

1. User enters a company website URL and optional company name.
2. The app fetches the homepage and common public pages such as about, pricing, careers, customers, case studies, blog, integrations, and contact.
3. The scanner extracts readable text, classifies buying signals, computes a lead intelligence score, and produces outreach context points.
4. The UI displays an account brief with score, reasons, pain-point hypotheses, recommended outreach angle, and exportable JSON/CSV.

## Scope

The prototype focuses on business value rather than a broad scraper clone. It does not require login or persistent database storage. It uses deterministic heuristics for reliable scoring, then optionally enriches the brief with OpenAI when `OPENAI_API_KEY` is configured.

## Architecture

- `src/scanner.js`: pure scanner logic for URL normalization, HTML text extraction, signal detection, scoring, and export formatting.
- `src/openai-enrichment.js`: server-side OpenAI Responses API integration with deterministic fallback.
- `src/env.js`: local `.env` loading for server-only configuration.
- `src/server.js`: small Node HTTP server that serves the frontend and exposes `POST /api/scan`.
- `public/index.html`, `public/styles.css`, `public/app.js`: single-page dashboard matching the dark operational SaaSQuatch feel.
- `tests/*.test.js`: Node test runner coverage for scanner behavior, API behavior, env loading, OpenAI enrichment, and UI contract checks.

## Success Criteria

- The app runs locally with `npm start`.
- Core scanner logic is covered by tests.
- A demo URL produces a score, detected signals, pain hypotheses, generated context points, and an `AI Enhanced` status when the OpenAI key is configured.
- The UI feels like a real product feature, not a landing page.
