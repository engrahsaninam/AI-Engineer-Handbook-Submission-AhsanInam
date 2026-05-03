import assert from "node:assert/strict";
import test from "node:test";

import { GET, POST } from "../app/api/scan/route.js";

test("Next API route rejects non-POST requests", async () => {
  const response = await GET();

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("Next API route rejects missing website URLs", async () => {
  const request = new Request("http://localhost/api/scan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ companyName: "Acme" }),
  });
  const response = await POST(request);

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Website URL is required" });
});
