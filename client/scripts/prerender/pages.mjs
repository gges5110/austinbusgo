/**
 * Static HTML for every stop and route page, built from the app's own
 * index.html. GitHub Pages serves the app's deep links through 404.html
 * (HTTP 404), so search engines never index them; these files give each
 * stop/route URL a real 200 page with its own title, description, canonical
 * URL, and a crawlable summary. The app replaces the summary when it mounts
 * (createRoot clears #root), so riders see the normal app.
 *
 * Pure functions only; run.mjs does the fetching and writing.
 */

export const SITE = "https://austinbusgo.com";
const BRAND = "Austin Bus Go";

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

/** Collapse the stray double spaces in some feed names. */
export const cleanName = (name) =>
  String(name ?? "")
    .replace(/\s+/g, " ")
    .trim();

/** "801-MetroRapid North Lamar" → "MetroRapid North Lamar" */
export const routeName = (route) =>
  cleanName(route.routeLongName).replace(/^[\w]+\s*-\s*/, "") ||
  `Route ${route.routeShortName ?? route.routeId}`;

const routeLabel = (route) => route.routeShortName ?? route.routeId;

export const stopPath = (stop) => `/stop/${encodeURIComponent(stop.stopId)}`;
export const routePath = (route) =>
  `/route/${encodeURIComponent(route.routeId)}/direction/0`;

const byRouteNumber = (a, b) =>
  Number(routeLabel(a)) - Number(routeLabel(b)) ||
  String(routeLabel(a)).localeCompare(String(routeLabel(b)));

/** "1, 7 and 20" */
const listRoutes = (routes) => {
  const labels = routes.map(routeLabel);
  return labels.length <= 1
    ? labels.join("")
    : `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
};

/**
 * Swap the template's page-level head tags and fill #root.
 * Every replaced tag must exist in the template, so a template change that
 * drops one fails loudly instead of shipping pages with the home page's
 * title or canonical URL.
 */
export const renderPage = (
  template,
  { title, description, path, body, jsonLd }
) => {
  const url = `${SITE}${path}`;
  const tag = (pattern, replacement) => [pattern, () => replacement];
  const replacements = [
    tag(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`),
    tag(
      /<meta name="description" content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escapeHtml(description)}" />`
    ),
    tag(
      /<link rel="canonical" href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${escapeHtml(url)}" />`
    ),
    tag(
      /<meta property="og:url" content="[^"]*"\s*\/?>/,
      `<meta property="og:url" content="${escapeHtml(url)}" />`
    ),
    tag(
      /<meta property="og:title" content="[^"]*"\s*\/?>/,
      `<meta property="og:title" content="${escapeHtml(title)}" />`
    ),
    tag(
      /<meta property="og:description" content="[^"]*"\s*\/?>/,
      `<meta property="og:description" content="${escapeHtml(description)}" />`
    ),
    tag(
      /<meta name="twitter:url" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:url" content="${escapeHtml(url)}" />`
    ),
    tag(
      /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:title" content="${escapeHtml(title)}" />`
    ),
    tag(
      /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:description" content="${escapeHtml(description)}" />`
    ),
    [
      /(<div id="root"[^>]*>)(<\/div>)/,
      (_, open, close) => open + body + close,
    ],
  ];

  let html = template;
  for (const [pattern, replacer] of replacements) {
    if (!pattern.test(html)) {
      throw new Error(`Template is missing ${pattern}`);
    }
    html = html.replace(pattern, replacer);
  }

  if (jsonLd) {
    // "<" escaped so a stop name can never close the script tag
    const json = JSON.stringify(jsonLd).replace(/</g, "\\u003c");
    html = html.replace(
      "</head>",
      `<script type="application/ld+json">${json}</script>\n</head>`
    );
  }
  return html;
};

export const stopPage = (template, rawStop) => {
  const stop = { ...rawStop, stopName: cleanName(rawStop.stopName) };
  const routes = [...(stop.routes ?? [])].sort(byRouteNumber);
  const code = stop.stopCode ?? stop.stopId;
  const title = `${stop.stopName} Bus Stop (${code}) – Live Arrivals | ${BRAND}`;
  const description =
    `Live CapMetro bus arrivals and bus locations at ${stop.stopName} ` +
    `(stop ${code}) in Austin, TX. Served by route${routes.length === 1 ? "" : "s"} ` +
    `${listRoutes(routes)}.`;
  const [longitude, latitude] = stop.stopLoc?.coordinates ?? [];

  const body = [
    `<main>`,
    `<h1>${escapeHtml(stop.stopName)} bus stop</h1>`,
    `<p>CapMetro stop ${escapeHtml(code)} in Austin, Texas. ` +
      `See live arrival predictions and where each bus is right now.</p>`,
    `<h2>Routes at this stop</h2>`,
    `<ul>`,
    ...routes.map(
      (route) =>
        `<li><a href="${routePath(route)}">Route ${escapeHtml(routeLabel(route))}: ` +
        `${escapeHtml(routeName(route))}</a></li>`
    ),
    `</ul>`,
    `</main>`,
  ].join("");

  return renderPage(template, {
    title,
    description,
    path: stopPath(stop),
    body,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BusStop",
      name: stop.stopName,
      identifier: code,
      url: `${SITE}${stopPath(stop)}`,
      ...(latitude !== undefined && {
        geo: { "@type": "GeoCoordinates", latitude, longitude },
      }),
    },
  });
};

export const routePage = (template, route, stops) => {
  const label = routeLabel(route);
  const name = routeName(route);
  const title = `Route ${label} ${name} – Live Bus Tracker | ${BRAND}`;
  const description =
    `Track CapMetro Route ${label} (${name}) live: real-time bus locations ` +
    `and arrival predictions at all ${stops.length} stops in Austin, TX.`;
  const sortedStops = stops
    .map((stop) => ({ ...stop, stopName: cleanName(stop.stopName) }))
    .sort((a, b) => a.stopName.localeCompare(b.stopName));

  const body = [
    `<main>`,
    `<h1>Route ${escapeHtml(label)}: ${escapeHtml(name)}</h1>`,
    `<p>Live bus locations and arrival predictions for CapMetro Route ` +
      `${escapeHtml(label)} in Austin, Texas.</p>`,
    `<h2>Stops on this route</h2>`,
    `<ul>`,
    ...sortedStops.map(
      (stop) =>
        `<li><a href="${stopPath(stop)}">${escapeHtml(stop.stopName)}</a></li>`
    ),
    `</ul>`,
    `</main>`,
  ].join("");

  return renderPage(template, {
    title,
    description,
    path: routePath(route),
    body,
  });
};

/** Stops by route id, from the stops' own route lists. */
export const stopsByRoute = (stops) => {
  const map = new Map();
  for (const stop of stops) {
    for (const route of stop.routes ?? []) {
      if (!map.has(route.routeId)) map.set(route.routeId, []);
      map.get(route.routeId).push(stop);
    }
  }
  return map;
};

export const sitemap = (paths, lastmod) =>
  [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...paths.map(
      (path) =>
        `  <url><loc>${escapeHtml(`${SITE}${path}`)}</loc>` +
        `<lastmod>${lastmod}</lastmod></url>`
    ),
    `</urlset>`,
    ``,
  ].join("\n");
