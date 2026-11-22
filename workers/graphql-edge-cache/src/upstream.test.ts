import assert from "node:assert/strict";
import { test } from "node:test";

import { upstreamUrl } from "./upstream.ts";

const ORIGIN = "https://backend.example.run.app";

test("forwards API paths with their query to the backend, sorted", () => {
  assert.equal(
    upstreamUrl("https://edge.dev/api/stops/1/upcoming?limit=5&date=x", ORIGIN)
      ?.href,
    `${ORIGIN}/api/stops/1/upcoming?date=x&limit=5`,
  );
});

test("drops query parameters the API doesn't read (no cache busting)", () => {
  assert.equal(
    upstreamUrl("https://edge.dev/api/routes?x=123&cb=9", ORIGIN)?.href,
    `${ORIGIN}/api/routes`,
  );
  assert.equal(
    upstreamUrl("https://edge.dev/api/search?q=lamar&x=1", ORIGIN)?.href,
    `${ORIGIN}/api/search?q=lamar`,
  );
});

test("never leaves the backend's host", () => {
  for (const path of ["//evil.example/api/x", "/api//evil.example/x"]) {
    const url = upstreamUrl(`https://edge.dev${path}`, ORIGIN);
    assert.ok(!url || url.host === new URL(ORIGIN).host, path);
  }
});

test("refuses everything outside the API", () => {
  for (const path of ["/", "//evil.example/", "/docs", "/openapi.json"]) {
    assert.equal(upstreamUrl(`https://edge.dev${path}`, ORIGIN), undefined);
  }
});
