import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("project is configured as a Next.js application", () => {
  assert.equal(packageJson.scripts.dev, "next dev");
  assert.equal(packageJson.scripts.build, "next build");
  assert.equal(packageJson.scripts.start, "next start");
  assert.ok(packageJson.dependencies.next);
  assert.ok(packageJson.dependencies.react);
  assert.ok(packageJson.dependencies["react-dom"]);
});

test("Next.js app router files exist and old static app entrypoints are removed", () => {
  assert.equal(existsSync(new URL("../next.config.mjs", import.meta.url)), true);
  assert.equal(existsSync(new URL("../app/layout.jsx", import.meta.url)), true);
  assert.equal(existsSync(new URL("../app/page.jsx", import.meta.url)), true);
  assert.equal(existsSync(new URL("../app/api/scan/route.js", import.meta.url)), true);
  assert.equal(existsSync(new URL("../public/index.html", import.meta.url)), false);
  assert.equal(existsSync(new URL("../public/app.js", import.meta.url)), false);
  assert.equal(existsSync(new URL("../public/styles.css", import.meta.url)), false);
  assert.equal(existsSync(new URL("../api/scan.js", import.meta.url)), false);
  assert.equal(existsSync(new URL("../src/server.js", import.meta.url)), false);
});

test("client page keeps API keys server-side only", () => {
  const page = readFileSync(new URL("../app/page.jsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/api/scan/route.js", import.meta.url), "utf8");

  assert.doesNotMatch(page, /OPENAI_API_KEY/);
  assert.match(page, /fetch\("\/api\/scan"/);
  assert.match(route, /process\.env\.OPENAI_API_KEY|enhanceBriefWithOpenAI/);
});

test("Next config pins the project root for Turbopack", () => {
  const config = readFileSync(new URL("../next.config.mjs", import.meta.url), "utf8");

  assert.match(config, /agentRules:\s*false/);
  assert.match(config, /turbopack/);
  assert.match(config, /root:\s*process\.cwd\(\)/);
});
