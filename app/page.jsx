"use client";

import { useEffect, useState } from "react";

const sampleBrief = {
  companyName: "Northstar Clinics",
  websiteUrl: "https://northstar-clinics.example",
  score: 91,
  grade: "A",
  recommendedAngle:
    "Northstar Clinics is a grade A lead because automation need is visible. Open with the business impact of reducing manual intake work and routing high-intent patient inquiries faster.",
  nextAction: {
    label: "Contact now",
    tone: "high",
    summary: "Prioritize this account for personalized outreach.",
    reasons: [
      "Workflow or automation language creates a direct AI-readiness angle.",
      "A public pricing motion makes buyer segmentation and outreach easier.",
      "Hiring activity suggests growth pressure and operational urgency.",
    ],
  },
  productHandoffs: [
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
  ],
  signals: [
    {
      id: "automation_need",
      label: "Automation need is visible",
      weight: 16,
      confidence: 0.85,
      reason: "Explicit workflow pain is a strong fit for AI-enabled operations tooling.",
      evidence: ["manual work", "workflow", "intake"],
      sourceUrl: "https://northstar-clinics.example",
    },
    {
      id: "pricing",
      label: "Pricing page is public",
      weight: 14,
      confidence: 0.75,
      reason: "Public pricing suggests measurable buyer intent.",
      evidence: ["pricing", "plans"],
      sourceUrl: "https://northstar-clinics.example/pricing",
    },
    {
      id: "hiring",
      label: "Hiring or growth activity",
      weight: 12,
      confidence: 0.75,
      reason: "Hiring signals operational pressure.",
      evidence: ["hiring", "customer success"],
      sourceUrl: "https://northstar-clinics.example/careers",
    },
  ],
  painHypotheses: [
    "Northstar Clinics likely has manual workflow steps that could be reduced with AI routing or enrichment.",
    "Hiring activity suggests the team may need repeatable processes before headcount creates coordination drag.",
    "Analytics language suggests stakeholders care about measurable pipeline quality and attribution.",
  ],
  contextPoints: [
    "Northstar Clinics shows automation need based on manual work, workflow, and intake signals from its homepage.",
    "The public pricing page suggests an active product motion and a cleaner path to segmenting likely buyers.",
    "Careers content points to growth in customer success, which creates a timely operations angle.",
  ],
  scannedPages: [
    { title: "Home", url: "https://northstar-clinics.example" },
    { title: "Pricing", url: "https://northstar-clinics.example/pricing" },
    { title: "Careers", url: "https://northstar-clinics.example/careers" },
  ],
  generatedAt: new Date().toISOString(),
};

const placeholderSignals = [
  "ICP fit, pricing, hiring, integrations, and automation signals will appear here.",
  "Each signal includes evidence terms and a business reason.",
];

const placeholderPain = [
  "Likely workflow, growth, support, and data-quality pains will appear after a scan.",
  "Use these hypotheses to shape the pitch instead of sending generic outreach.",
];

const placeholderContext = [
  "The scanner will generate ready-to-use context points for outbound email and LinkedIn messages.",
  "These points are written to be pasted into the existing SaaSQuatch generators.",
];

const placeholderPages = [
  { title: "Homepage", detail: "Primary website positioning" },
  { title: "Pricing / Careers / Customers", detail: "Additional public pages when readable" },
];

export default function Page() {
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [brief, setBrief] = useState(null);
  const [status, setStatus] = useState("Ready");
  const [toast, setToast] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setStatus("Scanning");

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ companyName, websiteUrl }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Scan failed");
      }

      setBrief(payload);
      setStatus(briefStatusLabel(payload));
      showToast("Scan complete");
    } catch (error) {
      setStatus("Error");
      showToast(error instanceof Error ? error.message : "Scan failed");
    } finally {
      setIsLoading(false);
    }
  }

  function loadSample() {
    setCompanyName(sampleBrief.companyName);
    setWebsiteUrl(sampleBrief.websiteUrl);
    setBrief(sampleBrief);
    setStatus(briefStatusLabel(sampleBrief));
    showToast("Sample loaded");
  }

  async function copyJson() {
    if (!brief) return;
    await navigator.clipboard.writeText(JSON.stringify(brief, null, 2));
    showToast("JSON copied");
  }

  function downloadCsv() {
    if (!brief) return;
    const blob = new Blob([briefToCsv(brief)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${brief.companyName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-brief.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function showToast(message) {
    setToast(message);
  }

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar" aria-label="Primary navigation">
          <div className="brand" aria-label="SaaSQuatch Leads">
            <div className="brand-mark" aria-hidden="true">
              <span>SQL</span>
            </div>
            <strong>SaaSQuatch</strong>
            <span>Leads</span>
          </div>
          <nav className="nav-list">
            <a href="/lead/companies">Companies</a>
            <a href="/lead/persons">Persons</a>
            <a href="/teams">
              Teams <b>New</b>
            </a>
            <a href="/news">AI News</a>
            <a href="/email-generator">Email Generator</a>
            <a href="/validators">Validators</a>
            <a href="/linkedin-generator">LinkedIn Messenger</a>
            <a href="/" className="active" aria-current="page">
              AI Web Scanner <b>New</b>
            </a>
            <a href="/financial-analysis" className="muted">
              Financial Analysis
            </a>
          </nav>
        </aside>

        <main className="workspace">
          <header className="topbar">
            <button className="icon-button" type="button" aria-label="Open menu">
              <span className="icon-menu" aria-hidden="true" />
            </button>
            <div className="search-box">
              <span className="search-glyph" aria-hidden="true" />
              <input
                type="search"
                name="search"
                aria-label="Search accounts"
                autoComplete="off"
                placeholder="Search accounts, signals, pages..."
              />
            </div>
            <button className="primary-small" type="button">
              Search
            </button>
            <button className="ghost-small" type="button">
              Help <span className="chevron-icon" aria-hidden="true" />
            </button>
            <button className="icon-button" type="button" aria-label="Notifications">
              <span className="icon-bell" aria-hidden="true" />
            </button>
            <button className="icon-button" type="button" aria-label="Account">
              <span className="icon-user" aria-hidden="true" />
            </button>
          </header>

          <section className="scanner-header">
            <div>
              <p className="eyebrow">Lead Intelligence Scanner</p>
              <h1>AI Web Scanner</h1>
            </div>
            <div className="status-pill">{status}</div>
          </section>

          <section className="scan-layout">
            <form className="scan-panel" onSubmit={handleSubmit}>
              <div className="panel-heading">
                <span className="dot green" />
                <h2>Scan Company Website</h2>
              </div>
              <label htmlFor="companyName">
                <span>Company Name</span>
                <input
                  id="companyName"
                  name="companyName"
                  autoComplete="organization"
                  placeholder="Acme Health"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  disabled={isLoading}
                />
              </label>
              <label htmlFor="websiteUrl">
                <span>
                  Website URL <b>*</b>
                </span>
                <input
                  id="websiteUrl"
                  name="websiteUrl"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="https://example.com..."
                  value={websiteUrl}
                  onChange={(event) => setWebsiteUrl(event.target.value)}
                  disabled={isLoading}
                  required
                />
              </label>
              <div className="button-row">
                <button className="primary-action" type="submit" disabled={isLoading}>
                  Scan Website
                </button>
                <button className="secondary-action" type="button" onClick={loadSample} disabled={isLoading}>
                  Load Sample
                </button>
              </div>
              <div className="scan-hint">
                <strong>What this adds:</strong>
                <span>Finds ICP fit, buying signals, pain hypotheses, and outreach context from a public website.</span>
              </div>
            </form>

            <section className="score-panel" aria-live="polite">
              <div className="panel-heading">
                <span className="dot blue" />
                <h2>Account Brief</h2>
              </div>
              {brief ? <ScoreContent brief={brief} /> : <EmptyScore />}
            </section>
          </section>

          {brief ? <ActionGrid brief={brief} showToast={showToast} /> : null}

          <section className="insight-grid">
            <SignalsList brief={brief} />
            <ListPanel title="Pain Hypotheses" dot="red" items={brief?.painHypotheses || placeholderPain} />
            <ListPanel title="Outreach Context" dot="green" items={brief?.contextPoints || placeholderContext} />
            <PagesList brief={brief} />
          </section>

          {brief ? (
            <section className="export-strip">
              <span>Ready for sales workflow</span>
              <div className="export-row">
                <button className="secondary-action compact" type="button" onClick={copyJson}>
                  Copy JSON
                </button>
                <button className="secondary-action compact" type="button" onClick={downloadCsv}>
                  Download CSV
                </button>
              </div>
            </section>
          ) : null}
        </main>
      </div>

      <div className={`toast${toast ? "" : " hidden"}`} role="status">
        {toast}
      </div>
    </>
  );
}

function EmptyScore() {
  return (
    <div className="empty-state">
      <div className="lens" />
      <strong>Ready to scan</strong>
      <span>Enter a website or load the sample account.</span>
    </div>
  );
}

function ScoreContent({ brief }) {
  return (
    <div className="score-content">
      <div className="score-left">
        <div className="score-ring">
          <span>{brief.score}</span>
          <small>Grade {brief.grade}</small>
        </div>
        <div className="next-action-badge" data-tone={brief.nextAction?.tone || "medium"}>
          {brief.nextAction?.label || "Review"}
        </div>
      </div>
      <div className="score-copy">
        <h3>{brief.companyName}</h3>
        <p>{brief.recommendedAngle}</p>
      </div>
    </div>
  );
}

function ActionGrid({ brief, showToast }) {
  const handoffs = brief.productHandoffs || fallbackHandoffs();
  return (
    <section className="action-grid">
      <article className="next-action-card">
        <div className="panel-heading tight">
          <span className="dot green" />
          <h2>Recommended Next Action</h2>
        </div>
        <div className="action-headline">
          <strong>{brief.nextAction?.label || "Review account"}</strong>
          <span>{brief.nextAction?.summary || "Review the account brief before outreach."}</span>
        </div>
        <ul className="reason-list">
          {(brief.nextAction?.reasons || []).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </article>

      <article className="handoff-card">
        <div className="panel-heading tight">
          <span className="dot blue" />
          <h2>Product Handoffs</h2>
        </div>
        <div className="handoff-list">
          {handoffs.map((handoff) => (
            <button
              className="handoff-button"
              type="button"
              key={handoff.id || handoff.label}
              onClick={() => showToast(`${handoff.label} queued for demo handoff`)}
            >
              <strong>{handoff.label}</strong>
              <span>{handoff.description}</span>
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}

function SignalsList({ brief }) {
  const signals = brief?.signals || [];
  return (
    <article className="insight-panel">
      <div className="panel-heading">
        <span className="dot yellow" />
        <h2>Buying Signals</h2>
      </div>
      <div className="signal-list">
        {brief ? (
          signals.length > 0 ? (
            signals.map((signal) => <SignalItem key={signal.id || signal.label} signal={signal} />)
          ) : (
            <EmptySignalCard />
          )
        ) : (
          placeholderSignals.map((text) => <PlaceholderSignal key={text} text={text} />)
        )}
      </div>
    </article>
  );
}

function SignalItem({ signal }) {
  return (
    <div className="signal-item">
      <div className="signal-topline">
        <span>{signal.label}</span>
        <span>+{signal.weight}</span>
      </div>
      <p>{signal.reason}</p>
      <small>{(signal.evidence || []).join(", ")}</small>
    </div>
  );
}

function PlaceholderSignal({ text }) {
  return (
    <div className="signal-item placeholder">
      <div className="signal-topline">
        <span>Awaiting scan</span>
        <span>--</span>
      </div>
      <p>{text}</p>
    </div>
  );
}

function EmptySignalCard() {
  return (
    <div className="signal-item placeholder">
      <div className="signal-topline">
        <span>No explicit buying signals found</span>
        <span>0</span>
      </div>
      <p>Use the research-more recommendation and enrich this account before outreach.</p>
    </div>
  );
}

function ListPanel({ title, dot, items }) {
  return (
    <article className="insight-panel">
      <div className="panel-heading">
        <span className={`dot ${dot}`} />
        <h2>{title}</h2>
      </div>
      <ol className="clean-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </article>
  );
}

function PagesList({ brief }) {
  return (
    <article className="insight-panel">
      <div className="panel-heading">
        <span className="dot blue" />
        <h2>Scanned Pages</h2>
      </div>
      <div className="page-list">
        {brief
          ? brief.scannedPages.map((page) => (
              <a href={page.url} target="_blank" rel="noreferrer" key={page.url}>
                <strong>{page.title || "Page"}</strong>
                <span>{page.url}</span>
              </a>
            ))
          : placeholderPages.map((page) => (
              <div className="page-placeholder" key={page.title}>
                <strong>{page.title}</strong>
                <span>{page.detail}</span>
              </div>
            ))}
      </div>
    </article>
  );
}

function fallbackHandoffs() {
  return [
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
  ];
}

function briefStatusLabel(brief) {
  return brief.ai?.used ? "AI Enhanced" : "Brief Ready";
}

function briefToCsv(brief) {
  const headers = ["Company", "Website", "Score", "Grade", "Top Signals", "Recommended Angle"];
  const values = [
    brief.companyName,
    brief.websiteUrl,
    brief.score,
    brief.grade,
    brief.signals.map((signal) => signal.label).join("; "),
    brief.recommendedAngle,
  ];
  return `${headers.join(",")}\n${values.map(csvEscape).join(",")}`;
}

function csvEscape(value) {
  const raw = String(value ?? "");
  return /[",\n]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;
}
