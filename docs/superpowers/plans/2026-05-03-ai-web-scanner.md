# AI Web Scanner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable AI Web Scanner prototype that converts a company domain into a sales-ready lead intelligence brief.

**Architecture:** A vanilla Node server hosts a static dashboard, a tested scanner module, and a server-side OpenAI enrichment layer. The scanner fetches public pages, extracts text, detects signals, scores lead quality, optionally enriches the brief with OpenAI, and returns structured JSON for the UI.

**Tech Stack:** Node.js built-ins, native `node:test`, OpenAI Responses API, HTML, CSS, browser JavaScript.

---

### Task 1: Scanner Core

**Files:**
- Create: `src/scanner.js`
- Create: `tests/scanner.test.js`
- Create: `package.json`

- [ ] Write failing tests for URL normalization, HTML text extraction, signal detection, scoring, and export formatting.
- [ ] Run `npm test` and confirm tests fail because scanner functions do not exist.
- [ ] Implement the minimal scanner functions to pass the tests.
- [ ] Run `npm test` and confirm all scanner tests pass.

### Task 2: HTTP API

**Files:**
- Create: `src/server.js`
- Modify: `package.json`

- [ ] Add a static file server and `POST /api/scan`.
- [ ] Wire the endpoint to `scanCompanyWebsite`.
- [ ] Return structured errors for missing URLs or failed fetches.
- [ ] Run `npm test`.

### Task 3: Product UI

**Files:**
- Create: `public/index.html`
- Create: `public/styles.css`
- Create: `public/app.js`

- [ ] Build a dark SaaS dashboard layout for the AI Web Scanner module.
- [ ] Add inputs for company name and website URL.
- [ ] Render lead score, buying signals, pain hypotheses, outreach angle, context points, and export buttons.
- [ ] Add loading, empty, success, and error states.

### Task 4: Verification

**Files:**
- Use: all created files

- [ ] Run `npm test`.
- [ ] Start the local server.
- [ ] Open the app in the browser and verify the UI renders without overlap.
- [ ] Run at least one scan against a real website and one scan against the built-in sample.
