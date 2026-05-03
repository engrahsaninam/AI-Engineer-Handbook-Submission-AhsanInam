import { loadEnvFile } from "../../../src/env.js";
import { enhanceBriefWithOpenAI } from "../../../src/openai-enrichment.js";
import { scanCompanyWebsiteWithPages } from "../../../src/scanner.js";

loadEnvFile();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.websiteUrl || !String(body.websiteUrl).trim()) {
      return Response.json({ error: "Website URL is required" }, { status: 400 });
    }

    const { brief, pages } = await scanCompanyWebsiteWithPages({
      companyName: body.companyName || "",
      websiteUrl: body.websiteUrl,
    });
    const enrichedBrief = await enhanceBriefWithOpenAI(brief, pages);

    return Response.json(enrichedBrief);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
