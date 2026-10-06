// Run with `npm test` (Node's built-in test runner; Node >= 22.18 strips
// the TypeScript types natively, so no test dependencies are needed)
import assert from "node:assert/strict";
import { test } from "node:test";

import { RT_TTL, STATIC_TTL, ttlForPath } from "./ttl.ts";

const realtimePaths = [
  "/api/rt/vehicle-positions",
  "/api/routes/801/earliest-arrival-times",
  "/api/stops/1002/upcoming",
];

for (const path of realtimePaths) {
  test(`real-time endpoint ${path} uses the short TTL`, () => {
    assert.equal(ttlForPath(path), RT_TTL);
  });
}

for (const path of ["/api/stops", "/api/routes/801", "/api/search"]) {
  test(`static endpoint ${path} uses the long TTL`, () => {
    assert.equal(ttlForPath(path), STATIC_TTL);
  });
}

test("non-API paths are not cached", () => {
  assert.equal(ttlForPath("/docs"), undefined);
});
