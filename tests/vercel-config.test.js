import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Vercel uses the Next.js framework preset without custom routing", () => {
  const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));

  assert.equal(config.framework, "nextjs");
  assert.equal(config.builds, undefined);
  assert.equal(config.routes, undefined);
});
