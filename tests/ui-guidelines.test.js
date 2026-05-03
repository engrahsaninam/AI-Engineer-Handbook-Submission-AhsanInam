import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("top search and website fields satisfy form accessibility guidelines", () => {
  assert.match(page, /type="search"/);
  assert.match(page, /name="search"/);
  assert.match(page, /aria-label="Search accounts"/);
  assert.match(page, /autoComplete="off"/);
  assert.match(page, /placeholder="Search accounts, signals, pages\.\.\."/);
  assert.match(page, /id="websiteUrl"/);
  assert.match(page, /type="url"/);
  assert.match(page, /inputMode="url"/);
  assert.match(page, /autoComplete="url"/);
  assert.match(page, /placeholder="https:\/\/example\.com\.\.\."/);
});

test("sidebar links use meaningful destinations instead of hash placeholders", () => {
  assert.doesNotMatch(page, /href="#"/);
  assert.match(page, /aria-current="page"/);
});

test("dark theme and polish rules are encoded in CSS", () => {
  assert.match(css, /color-scheme:\s*dark/);
  assert.match(css, /-webkit-font-smoothing:\s*antialiased/);
  assert.match(css, /font-variant-numeric:\s*tabular-nums/);
  assert.match(css, /text-wrap:\s*balance/);
  assert.match(css, /text-wrap:\s*pretty/);
  assert.match(css, /touch-action:\s*manipulation/);
});

test("interactive controls have explicit hover, active, and focus-visible feedback", () => {
  assert.match(css, /\.primary-action:hover/);
  assert.match(css, /\.primary-action:active/);
  assert.match(css, /\.primary-action:focus-visible/);
  assert.match(css, /\.secondary-action:hover/);
  assert.match(css, /\.secondary-action:active/);
  assert.match(css, /\.secondary-action:focus-visible/);
  assert.doesNotMatch(css, /transition:\s*all/);
});

test("topbar icons avoid fragile text glyph rendering", () => {
  assert.match(page, /className="icon-menu"/);
  assert.match(page, /className="search-glyph"/);
  assert.match(page, /className="icon-bell"/);
  assert.match(page, /className="icon-user"/);
  assert.doesNotMatch(page, /[\u2630\u2315\u2662\u25cc\u2026\u2304]/);
});

test("weak scan results render an intentional empty buying-signals state", () => {
  assert.match(page, /signals\.length\s*>\s*0/);
  assert.match(page, /No explicit buying signals found/);
});

test("AI-enhanced briefs are visibly distinguished from fallback briefs", () => {
  assert.match(page, /brief\.ai\?\.used/);
  assert.match(page, /AI Enhanced/);
});
