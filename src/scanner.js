const COMMON_PATHS = [
  "/",
  "/about",
  "/pricing",
  "/customers",
  "/case-studies",
  "/careers",
  "/integrations",
  "/contact",
  "/blog",
];

const SIGNAL_RULES = [
  {
    id: "pricing",
    label: "Pricing page is public",
    weight: 14,
    terms: ["pricing", "plans", "subscription", "free trial"],
    reason: "Public pricing often signals a product-led motion with measurable buyer intent.",
  },
  {
    id: "hiring",
    label: "Hiring or growth activity",
    weight: 12,
    terms: ["careers", "we are hiring", "join our team", "open roles", "rapid growth"],
    reason: "Hiring signals operational pressure and a likely need for scalable workflows.",
  },
  {
    id: "integrations",
    label: "Integration surface",
    weight: 10,
    terms: ["integrations", "connectors", "salesforce", "hubspot", "zapier", "slack"],
    reason: "Integration language makes CRM and workflow automation easier to position.",
  },
  {
    id: "customer_proof",
    label: "Customer proof exists",
    weight: 10,
    terms: ["customers", "case study", "case studies", "testimonial", "trusted by"],
    reason: "Customer proof suggests an established market and enough traction for targeted outreach.",
  },
  {
    id: "automation_need",
    label: "Automation need is visible",
    weight: 16,
    terms: ["manual work", "workflow", "automate", "automation", "intake", "routing"],
    reason: "Explicit workflow pain is a strong fit for AI-enabled lead generation and operations tooling.",
  },
  {
    id: "analytics",
    label: "Analytics or reporting emphasis",
    weight: 8,
    terms: ["analytics", "dashboard", "reporting", "insights", "metrics"],
    reason: "Analytics-heavy companies tend to value enriched, well-scored lead data.",
  },
  {
    id: "api",
    label: "API or developer surface",
    weight: 6,
    terms: ["api", "developer", "webhook", "sdk"],
    reason: "An API surface suggests technical maturity and easier integration paths.",
  },
  {
    id: "support_pressure",
    label: "Support or response-time pressure",
    weight: 8,
    terms: ["support", "customer success", "response time", "service", "help center"],
    reason: "Support pressure creates a clear angle for automation and better data routing.",
  },
];

export function normalizeWebsiteUrl(input) {
  const raw = String(input || "").trim();
  if (!raw) {
    throw new Error("Website URL is required");
  }

  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  const parsed = new URL(withProtocol);
  parsed.hash = "";
  parsed.search = "";

  const normalized = parsed.toString();
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

export function htmlToReadableText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildCandidateUrls(websiteUrl) {
  const root = normalizeWebsiteUrl(websiteUrl);
  const base = new URL(root);
  return COMMON_PATHS.map((path) => {
    const next = new URL(path, base);
    return next.toString().replace(/\/$/, "");
  });
}

export async function fetchWebsitePages(websiteUrl, options = {}) {
  const urls = buildCandidateUrls(websiteUrl);
  const timeoutMs = options.timeoutMs ?? 6000;
  const fetcher = options.fetcher || fetch;
  const pages = [];

  for (const url of urls) {
    try {
      const response = await fetcher(url, {
        headers: {
          "user-agent": "SaaSQuatch-AI-Web-Scanner/0.1",
          accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("text/html")) {
        continue;
      }

      const html = await response.text();
      const text = htmlToReadableText(html);
      if (text.length < 80) {
        continue;
      }

      pages.push({
        url,
        title: extractTitle(html) || pageLabelFromUrl(url),
        text: text.slice(0, 8000),
      });

      if (url === urls[0] && hasStrongSignalCoverage(text)) {
        break;
      }
    } catch {
      // A single blocked/missing page should not fail the whole scan.
    }
  }

  pages.sort((a, b) => urls.indexOf(a.url) - urls.indexOf(b.url));
  if (pages.length === 0) {
    throw new Error("No readable public pages found for that website");
  }

  return pages;
}

export async function scanCompanyWebsite({ companyName, websiteUrl }) {
  const { brief } = await scanCompanyWebsiteWithPages({ companyName, websiteUrl });
  return brief;
}

export async function scanCompanyWebsiteWithPages({ companyName, websiteUrl }) {
  const normalized = normalizeWebsiteUrl(websiteUrl);
  const pages = await fetchWebsitePages(normalized);
  const brief = buildAccountBrief({ companyName, websiteUrl: normalized, pages });
  return { brief, pages };
}

export function buildAccountBrief({ companyName, websiteUrl, pages }) {
  const normalizedUrl = normalizeWebsiteUrl(websiteUrl);
  const inferredName = inferCompanyName(companyName, normalizedUrl);
  const cleanPages = normalizePages(pages);
  const combinedText = cleanPages.map((page) => `${page.title} ${page.text}`).join(" ");
  const signals = detectSignals(cleanPages, combinedText);
  const score = scoreSignals(signals, cleanPages);
  const grade = gradeScore(score);
  const painHypotheses = buildPainHypotheses(signals, inferredName);
  const contextPoints = buildContextPoints(signals, inferredName, cleanPages);
  const recommendedAngle = buildRecommendedAngle(inferredName, grade, signals);
  const nextAction = buildNextAction(score, signals, cleanPages);
  const productHandoffs = buildProductHandoffs(signals);

  return {
    companyName: inferredName,
    websiteUrl: normalizedUrl,
    scannedPages: cleanPages.map(({ url, title }) => ({ url, title })),
    score,
    grade,
    signals,
    painHypotheses,
    contextPoints,
    recommendedAngle,
    nextAction,
    productHandoffs,
    generatedAt: new Date().toISOString(),
  };
}

export function formatBriefAsCsv(brief) {
  const headers = ["Company", "Website", "Score", "Grade", "Top Signals", "Recommended Angle"];
  const topSignals = brief.signals.map((signal) => signal.label).join("; ");
  const values = [
    brief.companyName,
    brief.websiteUrl,
    String(brief.score),
    brief.grade,
    topSignals,
    brief.recommendedAngle,
  ];

  return `${headers.join(",")}\n${values.map(csvEscape).join(",")}`;
}

function normalizePages(pages = []) {
  return pages
    .filter((page) => page && (page.text || page.html))
    .map((page) => ({
      url: page.url || "",
      title: page.title || pageLabelFromUrl(page.url || ""),
      text: page.text ? String(page.text) : htmlToReadableText(page.html),
    }));
}

function hasStrongSignalCoverage(text) {
  const haystack = String(text || "").toLowerCase();
  const matchedRuleCount = SIGNAL_RULES.filter((rule) => (
    rule.terms.some((term) => haystack.includes(term))
  )).length;
  return matchedRuleCount >= 3;
}

function detectSignals(pages, combinedText) {
  const haystack = combinedText.toLowerCase();

  return SIGNAL_RULES.map((rule) => {
    const matchedTerms = rule.terms.filter((term) => haystack.includes(term));
    if (matchedTerms.length === 0) {
      return null;
    }

    const page = pages.find((candidate) => {
      const pageText = `${candidate.title} ${candidate.text}`.toLowerCase();
      return matchedTerms.some((term) => pageText.includes(term));
    });

    return {
      id: rule.id,
      label: rule.label,
      weight: rule.weight,
      confidence: Math.min(0.95, 0.55 + matchedTerms.length * 0.1),
      reason: rule.reason,
      evidence: matchedTerms.slice(0, 4),
      sourceUrl: page?.url || "",
    };
  })
    .filter(Boolean)
    .sort((a, b) => b.weight - a.weight);
}

function scoreSignals(signals, pages) {
  const signalScore = signals.reduce((sum, signal) => sum + signal.weight, 35);
  const pageDepthBonus = Math.min(8, Math.max(0, pages.length - 1) * 2);
  return Math.min(97, Math.round(signalScore + pageDepthBonus));
}

function gradeScore(score) {
  if (score >= 85) return "A";
  if (score >= 72) return "B";
  if (score >= 58) return "C";
  return "D";
}

function buildPainHypotheses(signals, companyName) {
  const signalIds = new Set(signals.map((signal) => signal.id));
  const hypotheses = [];

  if (signalIds.has("automation_need")) {
    hypotheses.push(`${companyName} likely has manual workflow steps that could be reduced with AI routing or enrichment.`);
  }
  if (signalIds.has("hiring")) {
    hypotheses.push(`Hiring activity suggests the team may need repeatable processes before headcount creates more coordination drag.`);
  }
  if (signalIds.has("integrations") || signalIds.has("api")) {
    hypotheses.push(`The existing integration surface creates a practical path to connect lead data with CRM and outreach systems.`);
  }
  if (signalIds.has("analytics")) {
    hypotheses.push(`Analytics language suggests stakeholders care about measurable pipeline quality and attribution.`);
  }
  if (signalIds.has("support_pressure")) {
    hypotheses.push(`Customer support or success language points to response-time pressure that better account intelligence can improve.`);
  }
  if (hypotheses.length < 3) {
    hypotheses.push(`${companyName} may benefit from cleaner account research that reduces prep time before outreach.`);
    hypotheses.push(`A concise account brief could help sales teams personalize messages without manually reading every page.`);
  }

  return hypotheses.slice(0, 5);
}

function buildContextPoints(signals, companyName, pages) {
  const topSignals = signals.slice(0, 4);
  const sourceList = pages.slice(0, 3).map((page) => page.title).join(", ");
  const points = topSignals.map((signal) => (
    `${companyName} shows ${signal.label.toLowerCase()} based on ${signal.evidence.join(", ")} signals${signal.sourceUrl ? ` from ${signal.sourceUrl}` : ""}.`
  ));

  points.push(`Recent site review covered ${pages.length} public page${pages.length === 1 ? "" : "s"}${sourceList ? ` including ${sourceList}` : ""}.`);

  const fallbackPoints = [
    `${companyName} has limited explicit buying signals, so qualify fit before direct outreach.`,
    `Use the scanned website copy to keep outreach grounded in public context instead of generic claims.`,
    `A concise account brief can reduce manual research time before a salesperson writes the first message.`,
  ];

  for (const fallbackPoint of fallbackPoints) {
    if (points.length >= 3) break;
    points.push(fallbackPoint);
  }

  return points.slice(0, 4);
}

function buildRecommendedAngle(companyName, grade, signals) {
  const top = signals[0];
  if (!top) {
    return `Position SaaSQuatch as a fast way for ${companyName} to turn public account research into cleaner outreach data.`;
  }

  return `${companyName} is a grade ${grade} lead because ${top.label.toLowerCase()}. Open with the business impact of ${top.reason.toLowerCase()}`;
}

function buildNextAction(score, signals, pages) {
  const signalIds = new Set(signals.map((signal) => signal.id));
  const reasons = [];

  if (signals.length <= 1) {
    reasons.push("Few explicit buying signals were found on the public website.");
  }
  if (pages.length <= 1) {
    reasons.push("Only one readable page was available, so enrichment depth is limited.");
  }
  if (signalIds.has("automation_need")) {
    reasons.push("Workflow or automation language creates a direct AI-readiness angle.");
  }
  if (signalIds.has("pricing")) {
    reasons.push("A public pricing motion makes buyer segmentation and outreach easier.");
  }
  if (signalIds.has("hiring")) {
    reasons.push("Hiring activity suggests growth pressure and operational urgency.");
  }
  if (signalIds.has("integrations") || signalIds.has("api")) {
    reasons.push("Integration language suggests the company can act on enriched lead data.");
  }
  if (signalIds.has("analytics")) {
    reasons.push("Analytics language suggests measurable pipeline quality will matter.");
  }

  if (score >= 72 && signals.length >= 3) {
    return {
      label: "Contact now",
      tone: "high",
      summary: "Prioritize this account for personalized outreach.",
      reasons: reasons.slice(0, 4),
    };
  }

  if (score >= 58 || signals.length >= 2) {
    return {
      label: "Warm nurture",
      tone: "medium",
      summary: "Keep this account in the pipeline and enrich before direct outreach.",
      reasons: reasons.slice(0, 4),
    };
  }

  return {
    label: "Research more",
    tone: "low",
    summary: "Gather more context before spending sales time on this account.",
    reasons: reasons.slice(0, 4),
  };
}

function buildProductHandoffs(signals) {
  const signalIds = new Set(signals.map((signal) => signal.id));
  const handoffs = [
    {
      id: "email_generator",
      label: "Send to Email Generator",
      description: "Use the context points to create a personalized outbound email.",
    },
    {
      id: "linkedin_messenger",
      label: "Create LinkedIn Message",
      description: "Turn the top signal into a concise connection request.",
    },
    {
      id: "export_brief",
      label: "Export Lead Brief",
      description: "Share the account brief with sales or research teammates.",
    },
  ];

  if (signalIds.has("integrations") || signalIds.has("api")) {
    handoffs.unshift({
      id: "crm_sync",
      label: "Prepare CRM Sync",
      description: "Map the brief into CRM fields for routing and follow-up.",
    });
  }

  return handoffs.slice(0, 4);
}

function inferCompanyName(companyName, websiteUrl) {
  const cleanName = String(companyName || "").trim();
  if (cleanName) return cleanName;

  const host = new URL(websiteUrl).hostname.replace(/^www\./, "");
  const root = host.split(".")[0] || "Target Company";
  return root
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractTitle(html) {
  const match = String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? htmlToReadableText(match[1]) : "";
}

function pageLabelFromUrl(url) {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split("/").filter(Boolean).pop();
    return last ? titleCase(last.replace(/[-_]/g, " ")) : "Home";
  } catch {
    return "Page";
  }
}

function titleCase(value) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function csvEscape(value) {
  const raw = String(value ?? "");
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}
