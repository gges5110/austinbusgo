/**
 * IndexNow: tells Bing (and engines that use its index, like DuckDuckGo,
 * Yahoo and ChatGPT search) which pages were added or removed, so they
 * don't wait for the next sitemap crawl.
 *
 * Only *changed* URLs are sent: the new build's sitemap is compared with the
 * live one before deploying. Resending all ~2,400 URLs on every deploy
 * would be spam.
 *
 *   node indexnow.mjs plan URLS_FILE    before deploy: write changed URLs
 *   node indexnow.mjs submit URLS_FILE  after deploy: notify IndexNow
 *
 * Ownership is proven by the key file at https://austinbusgo.com/<KEY>.txt
 * (client/public/<KEY>.txt). The key is public by design.
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE } from "./pages.mjs";

export const INDEXNOW_KEY = "92d032e000708fa3b1cc7341880eb134";
const ENDPOINT = "https://api.indexnow.org/indexnow";
// IndexNow accepts up to 10,000 URLs per request
const MAX_URLS = 10000;
const BUILD_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../build");

/** All <loc> URLs in a sitemap. */
export const sitemapUrls = (xml) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) =>
    url.replace(/&amp;/g, "&")
  );

/** URLs added or removed between two sitemaps (both need notifying). */
export const changedUrls = (liveUrls, builtUrls) => {
  const live = new Set(liveUrls);
  const built = new Set(builtUrls);
  return [
    ...builtUrls.filter((url) => !live.has(url)),
    ...liveUrls.filter((url) => !built.has(url)),
  ];
};

export const indexNowPayload = (urls) => ({
  host: new URL(SITE).host,
  key: INDEXNOW_KEY,
  keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
  urlList: urls.slice(0, MAX_URLS),
});

const plan = async (outFile) => {
  const built = sitemapUrls(
    await readFile(join(BUILD_DIR, "sitemap.xml"), "utf8")
  );
  const response = await fetch(`${SITE}/sitemap.xml`);
  // No live sitemap yet (first deploy): everything is new
  const live = response.ok ? sitemapUrls(await response.text()) : [];
  const urls = changedUrls(live, built);
  await writeFile(outFile, urls.join("\n"));
  console.log(`IndexNow: ${urls.length} changed URLs (of ${built.length})`);
};

const submit = async (urlsFile) => {
  const urls = (await readFile(urlsFile, "utf8")).split("\n").filter(Boolean);
  if (urls.length === 0) {
    console.log("IndexNow: nothing changed, not notifying");
    return;
  }
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(indexNowPayload(urls)),
  });
  // 200 OK and 202 Accepted are both success
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  console.log(
    `IndexNow: notified ${urls.length} URLs (HTTP ${response.status})`
  );
};

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const [command, file] = process.argv.slice(2);
  const run = { plan, submit }[command];
  if (!run || !file) {
    console.error("usage: indexnow.mjs plan|submit URLS_FILE");
    process.exit(2);
  }
  run(file).catch((error) => {
    console.error(`IndexNow ${command} failed: ${error.message}`);
    process.exit(1);
  });
}
