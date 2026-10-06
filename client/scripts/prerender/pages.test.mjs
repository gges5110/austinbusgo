import { describe, expect, test } from "vitest";

import {
  cleanName,
  escapeHtml,
  renderPage,
  routeName,
  routePage,
  sitemap,
  stopPage,
  stopsByRoute,
} from "./pages.mjs";

const TEMPLATE = `<!DOCTYPE html><html><head>
<meta name="description" content="Home description" />
<link rel="canonical" href="https://austinbusgo.com/" />
<meta property="og:url" content="https://austinbusgo.com/" />
<meta property="og:title" content="Home" />
<meta property="og:description" content="Home description" />
<meta name="twitter:url" content="https://austinbusgo.com/" />
<meta name="twitter:title" content="Home" />
<meta name="twitter:description" content="Home description" />
<title>Home</title>
</head><body><div id="root" style="height:100vh"></div></body></html>`;

const route7 = {
  routeId: "7",
  routeShortName: "7",
  routeLongName: "7-Duval/Dove Springs",
};
const route20 = {
  routeId: "20",
  routeShortName: "20",
  routeLongName: "20-Riverside",
};

const stop = {
  stopId: "1002",
  stopCode: "1002",
  stopName: "Riverside/Burton",
  stopLoc: { type: "Point", coordinates: [-97.727308, 30.240341] },
  routes: [route20, route7],
};

const jsonLd = (html) =>
  [
    ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g),
  ].map(([, json]) => JSON.parse(json));

describe("stopPage", () => {
  const html = stopPage(TEMPLATE, stop);

  test("gives the stop its own title, description and canonical URL", () => {
    expect(html).toContain(
      "<title>Riverside/Burton Bus Stop (1002) – Live Arrivals | Austin Bus Go</title>"
    );
    expect(html).toContain(
      '<link rel="canonical" href="https://austinbusgo.com/stop/1002" />'
    );
    expect(html).toContain(
      '<meta property="og:url" content="https://austinbusgo.com/stop/1002" />'
    );
    expect(html).toContain("Served by routes 7 and 20.");
    expect(html).not.toContain("Home description");
  });

  test("puts a crawlable summary with route links in #root", () => {
    expect(html).toContain('<div id="root" style="height:100vh"><main>');
    expect(html).toContain("<h1>Riverside/Burton bus stop</h1>");
    // Routes sorted by number, linked to their pages
    expect(html.indexOf("Route 7:")).toBeLessThan(html.indexOf("Route 20:"));
    expect(html).toContain(
      '<a href="/route/7/direction/0">Route 7: Duval/Dove Springs</a>'
    );
  });

  test("describes the stop as structured data", () => {
    expect(jsonLd(html)).toEqual([
      {
        "@context": "https://schema.org",
        "@type": "BusStop",
        name: "Riverside/Burton",
        identifier: "1002",
        url: "https://austinbusgo.com/stop/1002",
        geo: {
          "@type": "GeoCoordinates",
          latitude: 30.240341,
          longitude: -97.727308,
        },
      },
    ]);
  });

  test("escapes feed text in HTML and in structured data", () => {
    const tricky = stopPage(TEMPLATE, {
      ...stop,
      stopName: 'Lamar & 5th "<script>"</script>',
    });

    expect(tricky).not.toContain('<script>"</script>');
    expect(tricky).toContain("Lamar &amp; 5th &quot;&lt;script&gt;&quot;");
    expect(jsonLd(tricky)[0].name).toBe('Lamar & 5th "<script>"</script>');
  });
});

describe("routePage", () => {
  test("lists the route's stops alphabetically with links", () => {
    const html = routePage(TEMPLATE, route20, [
      { ...stop, stopId: "2", stopName: "Zilker  Park" },
      { ...stop, stopId: "1", stopName: "Airport" },
    ]);

    expect(html).toContain(
      "<title>Route 20 Riverside – Live Bus Tracker | Austin Bus Go</title>"
    );
    expect(html).toContain(
      '<link rel="canonical" href="https://austinbusgo.com/route/20/direction/0" />'
    );
    expect(html).toContain("arrival predictions at all 2 stops");
    expect(html.indexOf("Airport")).toBeLessThan(html.indexOf("Zilker Park"));
    expect(html).toContain('<a href="/stop/1">Airport</a>');
  });
});

test("renderPage fails loudly when the template lacks a tag it must replace", () => {
  const withoutCanonical = TEMPLATE.replace(/<link rel="canonical"[^>]*>/, "");

  expect(() =>
    renderPage(withoutCanonical, {
      title: "t",
      description: "d",
      path: "/stop/1",
      body: "",
    })
  ).toThrow(/canonical/);
});

test.each([
  ["801-MetroRapid North Lamar", "MetroRapid North Lamar"],
  ["2- Rosewood/Cesar Chavez", "Rosewood/Cesar Chavez"],
  ["", "Route 9"],
])("routeName(%s) → %s", (longName, expected) => {
  expect(
    routeName({ routeId: "9", routeShortName: "9", routeLongName: longName })
  ).toBe(expected);
});

test("cleanName collapses feed double spaces", () => {
  expect(cleanName("31st Street Rapid  Station (NB) ")).toBe(
    "31st Street Rapid Station (NB)"
  );
});

test("stopsByRoute groups stops under every route that serves them", () => {
  const grouped = stopsByRoute([
    stop,
    { ...stop, stopId: "9", routes: [route7] },
  ]);

  expect(grouped.get("7").map((s) => s.stopId)).toEqual(["1002", "9"]);
  expect(grouped.get("20").map((s) => s.stopId)).toEqual(["1002"]);
});

test("sitemap lists absolute URLs with a lastmod", () => {
  const xml = sitemap(["/", "/stop/1002"], "2026-10-06");

  expect(xml).toContain(
    "<url><loc>https://austinbusgo.com/stop/1002</loc><lastmod>2026-10-06</lastmod></url>"
  );
  expect(xml.match(/<url>/g)).toHaveLength(2);
});

test("escapeHtml", () => {
  expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
    "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;"
  );
});
