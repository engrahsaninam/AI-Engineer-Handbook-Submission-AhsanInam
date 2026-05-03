import assert from "node:assert/strict";
import test from "node:test";

import { enhanceBriefWithOpenAI } from "../src/openai-enrichment.js";

const baseBrief = {
  companyName: "Acme Health",
  websiteUrl: "https://acme.example",
  score: 78,
  grade: "B",
  recommendedAngle: "Rule-based angle.",
  nextAction: {
    label: "Contact now",
    tone: "high",
    summary: "Rule-based summary.",
    reasons: ["Rule-based reason."],
  },
  signals: [
    {
      id: "automation_need",
      label: "Automation need is visible",
      weight: 16,
      confidence: 0.85,
      reason: "Explicit workflow pain exists.",
      evidence: ["workflow"],
      sourceUrl: "https://acme.example",
    },
  ],
  painHypotheses: ["Rule-based pain."],
  contextPoints: ["Rule-based context."],
  scannedPages: [{ title: "Home", url: "https://acme.example" }],
  productHandoffs: [],
  generatedAt: "2026-05-03T00:00:00.000Z",
};

const pages = [
  {
    title: "Home",
    url: "https://acme.example",
    text: "Acme Health automates patient intake workflows for growing clinics.",
  },
];

test("returns the rule-based brief when OPENAI_API_KEY is missing", async () => {
  const enhanced = await enhanceBriefWithOpenAI(baseBrief, pages, {
    apiKey: "",
    fetcher: async () => {
      throw new Error("OpenAI should not be called without a key");
    },
  });

  assert.equal(enhanced.recommendedAngle, baseBrief.recommendedAngle);
  assert.equal(enhanced.ai.used, false);
  assert.equal(enhanced.ai.status, "fallback");
  assert.match(enhanced.ai.reason, /OPENAI_API_KEY/);
});

test("merges structured OpenAI enrichment into the account brief", async () => {
  let requestBody;
  const enhanced = await enhanceBriefWithOpenAI(baseBrief, pages, {
    apiKey: "test-openai-key",
    model: "gpt-5.4-mini",
    fetcher: async (url, init) => {
      assert.equal(url, "https://api.openai.com/v1/responses");
      assert.equal(init.method, "POST");
      assert.equal(init.headers.authorization, "Bearer test-openai-key");
      requestBody = JSON.parse(init.body);

      return {
        ok: true,
        json: async () => ({
          output_text: JSON.stringify({
            aiSummary: "Acme has an AI-ready intake workflow opportunity.",
            recommendedAngle: "Lead with intake automation and faster clinic routing.",
            painHypotheses: [
              "Manual intake creates admin drag for clinic teams.",
              "Growth could make patient routing harder to manage consistently.",
              "Sales outreach should connect automation to patient response time.",
            ],
            contextPoints: [
              "Acme discusses patient intake workflows on its homepage.",
              "The strongest angle is reducing manual intake coordination.",
              "Use clinic growth pressure as the outreach hook.",
            ],
            nextActionSummary: "Use AI-enriched messaging for a targeted outreach step.",
            nextActionReasons: [
              "The site contains explicit workflow language.",
              "The account has a clear operational automation angle.",
            ],
          }),
        }),
      };
    },
  });

  assert.equal(requestBody.model, "gpt-5.4-mini");
  assert.match(requestBody.instructions, /sales intelligence analyst/);
  assert.equal(requestBody.text.format.type, "json_schema");
  assert.equal(enhanced.ai.used, true);
  assert.equal(enhanced.ai.status, "enhanced");
  assert.equal(enhanced.ai.model, "gpt-5.4-mini");
  assert.equal(enhanced.aiSummary, "Acme has an AI-ready intake workflow opportunity.");
  assert.equal(enhanced.recommendedAngle, "Lead with intake automation and faster clinic routing.");
  assert.deepEqual(enhanced.painHypotheses, [
    "Manual intake creates admin drag for clinic teams.",
    "Growth could make patient routing harder to manage consistently.",
    "Sales outreach should connect automation to patient response time.",
  ]);
  assert.equal(enhanced.nextAction.summary, "Use AI-enriched messaging for a targeted outreach step.");
  assert.deepEqual(enhanced.nextAction.reasons, [
    "The site contains explicit workflow language.",
    "The account has a clear operational automation angle.",
  ]);
});

test("falls back to the rule-based brief when the OpenAI request fails", async () => {
  const enhanced = await enhanceBriefWithOpenAI(baseBrief, pages, {
    apiKey: "test-openai-key",
    fetcher: async () => ({
      ok: false,
      status: 429,
      text: async () => "rate limited",
    }),
  });

  assert.equal(enhanced.recommendedAngle, baseBrief.recommendedAngle);
  assert.equal(enhanced.ai.used, false);
  assert.equal(enhanced.ai.status, "error");
  assert.match(enhanced.ai.reason, /OpenAI request failed/);
});
