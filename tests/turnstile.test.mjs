import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyTurnstile } from "../lib/security/turnstile.mjs";

test("Turnstile accepts a valid server-verified token", async () => {
  let request;
  const ok = await verifyTurnstile(
    "valid-token",
    "203.0.113.10",
    { TURNSTILE_SECRET_KEY: "server-secret" },
    async (url, init) => {
      request = { url, body: init.body };
      return { ok: true, json: async () => ({ success: true }) };
    },
  );
  assert.equal(ok, true);
  assert.match(request.url, /siteverify$/);
  assert.equal(request.body.get("response"), "valid-token");
  assert.equal(request.body.get("remoteip"), "203.0.113.10");
  assert.equal(request.body.get("secret"), "server-secret");
});

test("Turnstile rejects missing, expired, or already-used tokens", async () => {
  let requests = 0;
  const fetcher = async () => {
    requests += 1;
    return { ok: true, json: async () => ({ success: false, "error-codes": ["timeout-or-duplicate"] }) };
  };
  assert.equal(await verifyTurnstile("", "unknown", { TURNSTILE_SECRET_KEY: "server-secret" }, fetcher), false);
  assert.equal(await verifyTurnstile("expired-token", "unknown", { TURNSTILE_SECRET_KEY: "server-secret" }, fetcher), false);
  assert.equal(requests, 1);
});

test("Turnstile rejects unavailable verification and missing server configuration", async () => {
  assert.equal(
    await verifyTurnstile("valid-token", "unknown", { TURNSTILE_SECRET_KEY: "server-secret" }, async () => ({ ok: false, status: 503 })),
    false,
  );
  await assert.rejects(
    verifyTurnstile("valid-token", "unknown", {}, async () => { throw new Error("should not be called"); }),
    /TURNSTILE_NOT_CONFIGURED/,
  );
});
