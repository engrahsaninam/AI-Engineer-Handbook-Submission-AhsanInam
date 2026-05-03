import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { loadEnvFile } from "../src/env.js";

test("loads OPENAI_API_KEY from a local env file without overriding existing values", async () => {
  const dir = await mkdtemp(join(tmpdir(), "scanner-env-"));
  const envPath = join(dir, ".env");
  const previousKey = process.env.OPENAI_API_KEY;
  const previousModel = process.env.OPENAI_MODEL;

  try {
    delete process.env.OPENAI_API_KEY;
    process.env.OPENAI_MODEL = "already-set";
    await writeFile(envPath, 'OPENAI_API_KEY="test-key"\nOPENAI_MODEL=gpt-5.4-mini\n');

    const loaded = loadEnvFile(envPath);

    assert.equal(loaded, true);
    assert.equal(process.env.OPENAI_API_KEY, "test-key");
    assert.equal(process.env.OPENAI_MODEL, "already-set");
  } finally {
    if (previousKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = previousKey;
    }

    if (previousModel === undefined) {
      delete process.env.OPENAI_MODEL;
    } else {
      process.env.OPENAI_MODEL = previousModel;
    }

    await rm(dir, { recursive: true, force: true });
  }
});
