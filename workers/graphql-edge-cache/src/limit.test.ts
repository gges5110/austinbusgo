import assert from "node:assert/strict";
import { test } from "node:test";

import { overLimit } from "./limit.ts";

const request = (ip?: string) =>
  new Request("https://edge.dev/api/routes", {
    headers: ip ? { "CF-Connecting-IP": ip } : {},
  });

/** A limiter that allows `allowed` requests per key */
const limiter = (allowed: number) => {
  const seen = new Map<string, number>();
  return {
    keys: seen,
    async limit({ key }: { key: string }) {
      seen.set(key, (seen.get(key) ?? 0) + 1);
      return { success: (seen.get(key) ?? 0) <= allowed };
    },
  };
};

test("limits each IP separately", async () => {
  const fake = limiter(2);
  assert.equal(await overLimit(request("1.1.1.1"), fake), false);
  assert.equal(await overLimit(request("1.1.1.1"), fake), false);
  assert.equal(await overLimit(request("1.1.1.1"), fake), true);
  assert.equal(await overLimit(request("2.2.2.2"), fake), false);
});

test("no binding (local dev) or no client IP: never limited", async () => {
  assert.equal(await overLimit(request("1.1.1.1"), undefined), false);
  assert.equal(await overLimit(request(), limiter(0)), false);
});
