const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini";

const ENRICHMENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "aiSummary",
    "recommendedAngle",
    "painHypotheses",
    "contextPoints",
    "nextActionSummary",
    "nextActionReasons",
  ],
  properties: {
    aiSummary: { type: "string" },
    recommendedAngle: { type: "string" },
    painHypotheses: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: { type: "string" },
    },
    contextPoints: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: { type: "string" },
    },
    nextActionSummary: { type: "string" },
    nextActionReasons: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string" },
    },
  },
};

export async function enhanceBriefWithOpenAI(brief, pages, options = {}) {
  const model = options.model || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return withAiStatus(brief, {
      used: false,
      provider: "openai",
      model,
      status: "fallback",
      reason: "OPENAI_API_KEY is not configured",
    });
  }

  try {
    const fetcher = options.fetcher || fetch;
    const response = await fetcher(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildOpenAIRequestBody(brief, pages, model)),
      signal: AbortSignal.timeout(options.timeoutMs ?? 30000),
    });

    if (!response.ok) {
      const detail = typeof response.text === "function" ? await response.text() : "";
      throw new Error(`OpenAI request failed with ${response.status}${detail ? `: ${detail.slice(0, 160)}` : ""}`);
    }

    const payload = await response.json();
    const enrichment = parseOpenAIEnrichment(payload);
    return mergeAiEnrichment(brief, enrichment, model);
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI enrichment failed";
    return withAiStatus(brief, {
      used: false,
      provider: "openai",
      model,
      status: "error",
      reason: message,
    });
  }
}

export async function scanCompanyWebsiteWithAI(scan, input, options = {}) {
  const { brief, pages } = await scan(input);
  return enhanceBriefWithOpenAI(brief, pages, options);
}

function buildOpenAIRequestBody(brief, pages, model) {
  return {
    model,
    instructions:
      "You are a B2B sales intelligence analyst. Use the supplied website scan and rule-based signals to improve the account brief. Be specific, concise, and honest about weak evidence. Return only schema-valid JSON.",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify({
              companyName: brief.companyName,
              websiteUrl: brief.websiteUrl,
              score: brief.score,
              grade: brief.grade,
              nextAction: brief.nextAction,
              detectedSignals: brief.signals,
              ruleBasedPainHypotheses: brief.painHypotheses,
              ruleBasedContextPoints: brief.contextPoints,
              scannedPages: pages.slice(0, 5).map((page) => ({
                title: page.title,
                url: page.url,
                text: String(page.text || "").slice(0, 3500),
              })),
            }),
          },
        ],
      },
    ],
    max_output_tokens: 1400,
    text: {
      format: {
        type: "json_schema",
        name: "lead_enrichment",
        strict: true,
        schema: ENRICHMENT_SCHEMA,
      },
    },
  };
}

function parseOpenAIEnrichment(payload) {
  const outputText = payload.output_text || extractOutputText(payload.output);
  if (!outputText) {
    throw new Error("OpenAI response did not include output_text");
  }

  return JSON.parse(outputText);
}

function extractOutputText(outputItems = []) {
  const chunks = [];
  for (const item of outputItems) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("");
}

function mergeAiEnrichment(brief, enrichment, model) {
  return {
    ...brief,
    aiSummary: cleanText(enrichment.aiSummary),
    recommendedAngle: cleanText(enrichment.recommendedAngle) || brief.recommendedAngle,
    painHypotheses: cleanList(enrichment.painHypotheses, brief.painHypotheses, 5),
    contextPoints: cleanList(enrichment.contextPoints, brief.contextPoints, 4),
    nextAction: {
      ...brief.nextAction,
      summary: cleanText(enrichment.nextActionSummary) || brief.nextAction?.summary,
      reasons: cleanList(enrichment.nextActionReasons, brief.nextAction?.reasons || [], 4),
    },
    ai: {
      used: true,
      provider: "openai",
      model,
      status: "enhanced",
    },
  };
}

function withAiStatus(brief, ai) {
  return {
    ...brief,
    ai,
  };
}

function cleanList(value, fallback, limit) {
  const cleaned = Array.isArray(value)
    ? value.map(cleanText).filter(Boolean)
    : [];
  return (cleaned.length ? cleaned : fallback).slice(0, limit);
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
