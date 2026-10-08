import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import {
  changedUrls,
  INDEXNOW_KEY,
  indexNowPayload,
  sitemapUrls,
} from "./indexnow.mjs";
import { sitemap } from "./pages.mjs";

describe("IndexNow", () => {
  test("reads URLs back out of a generated sitemap", () => {
    const xml = sitemap(
      ["/", "/stop/1002", "/route/7/direction/0"],
      "2026-10-07"
    );

    expect(sitemapUrls(xml)).toEqual([
      "https://austinbusgo.com/",
      "https://austinbusgo.com/stop/1002",
      "https://austinbusgo.com/route/7/direction/0",
    ]);
  });

  test("notifies only added and removed URLs", () => {
    const live = ["/", "/stop/1", "/stop/2"];
    const built = ["/", "/stop/2", "/stop/3"];

    expect(changedUrls(live, built)).toEqual(["/stop/3", "/stop/1"]);
    expect(changedUrls(built, built)).toEqual([]);
  });

  test("first deploy (no live sitemap) sends everything", () => {
    expect(changedUrls([], ["/", "/stop/1"])).toEqual(["/", "/stop/1"]);
  });

  test("payload points at the key file", () => {
    expect(indexNowPayload(["https://austinbusgo.com/stop/1"])).toEqual({
      host: "austinbusgo.com",
      key: INDEXNOW_KEY,
      keyLocation: `https://austinbusgo.com/${INDEXNOW_KEY}.txt`,
      urlList: ["https://austinbusgo.com/stop/1"],
    });
  });

  test("the key file served from public/ matches the key", () => {
    const publicDir = join(
      dirname(fileURLToPath(import.meta.url)),
      "../../public"
    );

    expect(
      readFileSync(join(publicDir, `${INDEXNOW_KEY}.txt`), "utf8").trim()
    ).toBe(INDEXNOW_KEY);
  });
});
