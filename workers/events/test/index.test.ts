import assert from "node:assert/strict";
import { test } from "node:test";

import worker, { toPoint } from "../src/index.ts";

test("keeps known events and only their declared fields", () => {
  const point = toPoint(
    { e: "search", s: "abc", p: "search", f: ["640", "0", "extra", "x"], v: 5 },
    "US"
  );
  assert.deepEqual(point, {
    indexes: ["search"],
    blobs: ["search", "abc", "search", "640", "0", "", "", "US"],
    doubles: [5, 0],
  });
});

test("drops unknown events and junk bodies", () => {
  assert.equal(toPoint({ e: "nope" }), null);
  assert.equal(toPoint("search"), null);
  assert.equal(toPoint(null), null);
});

test("clamps values, truncates fields, and buckets unknown pages", () => {
  const point = toPoint({
    e: "arrivals",
    p: "/stop/1",
    f: ["x".repeat(200)],
    v: 1e12,
    n: -3,
  });
  assert.equal(point?.blobs[2], "other");
  assert.equal(point?.blobs[3].length, 64);
  assert.deepEqual(point?.doubles, [3_600_000, 0]);
});

const call = async (init: RequestInit & { url?: string }) => {
  const written: unknown[] = [];
  const env = { EVENTS: { writeDataPoint: (p: unknown) => written.push(p) } };
  const response = await worker.fetch(
    new Request(init.url ?? "https://x.workers.dev/e", init),
    env as never
  );
  return { status: response.status, written };
};

test("accepts beacons from the site only", async () => {
  const body = JSON.stringify({ e: "land", f: ["search"] });
  const ok = await call({
    method: "POST",
    body,
    headers: { Origin: "https://austinbusgo.com" },
  });
  assert.equal(ok.status, 204);
  assert.equal(ok.written.length, 1);

  const other = await call({
    method: "POST",
    body,
    headers: { Origin: "https://evil.example" },
  });
  assert.equal(other.status, 403);
  assert.equal(other.written.length, 0);
});

test("rejects other paths, methods and bad JSON", async () => {
  const headers = { Origin: "https://austinbusgo.com" };
  assert.equal((await call({ method: "GET", headers })).status, 404);
  assert.equal(
    (await call({ method: "POST", headers, url: "https://x/other" })).status,
    404
  );
  assert.equal(
    (await call({ method: "POST", headers, body: "{" })).status,
    400
  );
});
