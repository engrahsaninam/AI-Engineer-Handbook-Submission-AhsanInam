import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAccountBrief,
  fetchWebsitePages,
  formatBriefAsCsv,
  htmlToReadableText,
  normalizeWebsiteUrl,
} from "../src/scanner.js";

test("normalizes company websites into https URLs without trailing slash", () => {
  assert.equal(normalizeWebsiteUrl("acme.com/"), "https://acme.com");
  assert.equal(normalizeWebsiteUrl(" http://example.com/pricing "), "http://example.com/pricing");
  assert.equal(normalizeWebsiteUrl("https://www.example.com/"), "https://www.example.com");
});

test("extracts readable page text while removing scripts, styles, and markup", () => {
  const html = `
    <html>
      <head><style>.hidden{display:none}</style><script>window.secret = true</script></head>
      <body>
        <nav>Home</nav>
        <main>
          <h1>Workflow automation for clinics</h1>
          <p>Reduce manual intake work with AI routing and integrations.</p>
        </main>
      </body>
    </html>
  `;

  const text = htmlToReadableText(html);

  assert.match(text, /Workflow automation for clinics/);
  assert.match(text, /Reduce manual intake work/);
  assert.doesNotMatch(text, /window\.secret/);
  assert.doesNotMatch(text, /display:none/);
  assert.doesNotMatch(text, /<h1>/);
});

test("builds an account brief with buying signals, score, pain hypotheses, and context points", () => {
  const brief = buildAccountBrief({
    companyName: "Acme Health",
    websiteUrl: "https://acme-health.example",
    pages: [
      {
        url: "https://acme-health.example",
        title: "Acme Health",
        text: "Acme Health helps clinics automate patient intake, reporting, and support workflows for growing teams.",
      },
      {
        url: "https://acme-health.example/pricing",
        title: "Pricing",
        text: "Pricing plans for teams that need CRM integrations, analytics dashboards, and API access.",
      },
      {
        url: "https://acme-health.example/careers",
        title: "Careers",
        text: "We are hiring sales operations and customer success roles to support rapid growth.",
      },
      {
        url: "https://acme-health.example/customers",
        title: "Customers",
        text: "Case studies show healthcare operators reducing manual work and improving response time.",
      },
    ],
  });

  assert.equal(brief.companyName, "Acme Health");
  assert.equal(brief.websiteUrl, "https://acme-health.example");
  assert.ok(brief.score >= 75, `expected high score, got ${brief.score}`);
  assert.ok(brief.signals.some((signal) => signal.id === "pricing"));
  assert.ok(brief.signals.some((signal) => signal.id === "hiring"));
  assert.ok(brief.signals.some((signal) => signal.id === "automation_need"));
  assert.ok(brief.painHypotheses.length >= 3);
  assert.ok(brief.contextPoints.length >= 3);
  assert.equal(brief.nextAction.label, "Contact now");
  assert.ok(brief.nextAction.reasons.length >= 3);
  assert.ok(brief.productHandoffs.some((handoff) => handoff.id === "email_generator"));
  assert.match(brief.recommendedAngle, /Acme Health/);
});

test("downgrades the next action when a website has weak buying signals", () => {
  const brief = buildAccountBrief({
    companyName: "Quiet Co",
    websiteUrl: "quiet.example",
    pages: [
      {
        url: "https://quiet.example",
        title: "Home",
        text: "Quiet Co is a small local services firm with a short brochure website.",
      },
    ],
  });

  assert.equal(brief.nextAction.label, "Research more");
  assert.ok(brief.score < 58);
  assert.ok(brief.nextAction.reasons.some((reason) => reason.includes("Few explicit buying signals")));
});

test("does not treat generic operations copy as an automation buying signal", () => {
  const brief = buildAccountBrief({
    companyName: "Reference Co",
    websiteUrl: "reference.example",
    pages: [
      {
        url: "https://reference.example",
        title: "Reference Co",
        text: "Reference Co publishes general company information for operations teams and documentation readers.",
      },
    ],
  });

  assert.ok(!brief.signals.some((signal) => signal.id === "automation_need"));
  assert.equal(brief.nextAction.label, "Research more");
  assert.ok(brief.score < 58);
});

test("weak websites still produce distinct outreach context points", () => {
  const brief = buildAccountBrief({
    companyName: "Sparse Co",
    websiteUrl: "sparse.example",
    pages: [
      {
        url: "https://sparse.example",
        title: "Sparse Co",
        text: "Sparse Co publishes a brief company overview.",
      },
    ],
  });

  assert.equal(brief.contextPoints.length, 3);
  assert.equal(new Set(brief.contextPoints).size, brief.contextPoints.length);
});

test("formats a brief as a single CSV row with escaped content", () => {
  const brief = buildAccountBrief({
    companyName: "Comma, Inc.",
    websiteUrl: "comma.example",
    pages: [
      {
        url: "https://comma.example",
        title: "Home",
        text: "We provide integrations and analytics for revenue teams.",
      },
    ],
  });

  const csv = formatBriefAsCsv(brief);

  assert.match(csv, /^Company,Website,Score,Grade,Top Signals,Recommended Angle/);
  assert.match(csv, /"Comma, Inc\."/);
  assert.match(csv, /https:\/\/comma\.example/);
});

test("fetches website pages through an injectable fetcher without overlapping requests", async () => {
  let activeRequests = 0;
  let maxActiveRequests = 0;
  const requestedUrls = [];

  const pages = await fetchWebsitePages("https://acme.example", {
    timeoutMs: 20,
    fetcher: async (url) => {
      activeRequests += 1;
      maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
      requestedUrls.push(url);
      await new Promise((resolve) => setTimeout(resolve, 1));
      activeRequests -= 1;

      return {
        ok: url === "https://acme.example",
        headers: {
          get: () => "text/html; charset=utf-8",
        },
        text: async () => "<title>Acme</title><main>Acme automates workflows for revenue teams with integrations and analytics dashboards.</main>",
      };
    },
  });

  assert.equal(maxActiveRequests, 1);
  assert.equal(requestedUrls[0], "https://acme.example");
  assert.equal(requestedUrls.length, 1);
  assert.equal(pages.length, 1);
  assert.equal(pages[0].title, "Acme");
});
