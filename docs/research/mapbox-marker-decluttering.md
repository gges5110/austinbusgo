# Research: Mapbox Marker Decluttering with Collision Detection and Importance Ranking

## Goal

Achieve a Google Maps-like experience for stop markers: auto-show/hide based on zoom level, collision avoidance, and importance-based priority so that more significant stops surface first.

---

## Current Implementation

Stop markers are rendered using `react-map-gl` `<Marker>` DOM components — one per stop. Decluttering is handled at the **data layer** only:

- Zoom-based limits on nearby stop queries (40 stops at zoom ≤11, 80 at ≤14, 100 at >14)
- Context switching: nearby stops are hidden when a route or search is active
- No visual collision detection — overlapping markers always stack

**Key files:**
- `client/src/features/map/components/Stop/StopMarkers.tsx` — renders one `<Marker>` per stop
- `client/src/features/map/components/Stop/StopPin.tsx` — DOM badge + label UI
- `client/src/features/map/hooks/UseNearByStops.tsx` — zoom-based stop querying

---

## Research Findings

### Option 1: Mapbox GeoJSON Source Clustering (Built-in)

Mapbox GL JS has **native clustering** powered by [Supercluster](https://github.com/mapbox/supercluster). Enabled by `cluster: true` on a `geojson` source.

```js
map.addSource('stops', {
  type: 'geojson',
  data: stopsGeoJSON,
  cluster: true,
  clusterRadius: 50,       // pixel radius per cluster (default 50)
  clusterMaxZoom: 14,      // max zoom where clustering applies
  clusterMinPoints: 2,     // min features to form a cluster
  clusterProperties: {
    'max_priority': ['max', ['get', 'priority']]  // aggregate importance
  }
});
```

Cluster features auto-receive: `cluster: true`, `cluster_id`, `point_count`, `point_count_abbreviated`.

Style clusters vs. individual points using `filter: ['has', 'point_count']`.

**Zoom-to-cluster on click** via `getClusterExpansionZoom(clusterId)` — matches the Google Maps expand-on-click behaviour.

---

### Option 2: Symbol Layer with Native Collision Detection

Migrating from `<Marker>` components to `<Source>` + `<Layer>` (symbol layer) unlocks Mapbox's built-in viewport-wide collision detection pipeline.

**Core collision layout properties:**

| Property | Default | Effect |
|---|---|---|
| `icon-allow-overlap` | `false` | If `true`, icon shows even when it collides |
| `text-allow-overlap` | `false` | Same for text labels |
| `icon-ignore-placement` | `false` | If `true`, icon does not block other symbols |
| `text-ignore-placement` | `false` | Same for text labels |
| `icon-optional` | `false` | Show icon without text when text causes collision |
| `text-optional` | `false` | Show text without icon when icon causes collision |

With defaults (`allow-overlap: false`), Mapbox automatically hides colliding symbols — this is the Google Maps-like auto-hide behaviour.

**Debug visualisation:**
```js
map.showCollisionBoxes = true;
```

---

### Option 3: Importance Ranking via `symbol-sort-key`

`symbol-sort-key` is a **data-driven layout property** — lower value = placed first = wins collision resolution.

```js
layout: {
  'symbol-sort-key': ['get', 'priority']  // data expression
}
```

For bus stops, priority could be derived from:
- Number of routes serving the stop (more routes = lower sort key = higher priority)
- Ridership/boarding data
- Stop type (major terminal vs. regular stop)

**`symbol-z-order`** controls render order (visual stacking) separately from placement priority:

| Value | Behaviour |
|---|---|
| `"auto"` (default) | Respects `symbol-sort-key` if set, else viewport-y |
| `"viewport-y"` | Lower on screen renders on top (depth illusion) |
| `"source"` | Preserves GeoJSON feature order |

---

### Option 4: Zoom-Based Expressions for Show/Hide

Two expression types control visibility at different zoom levels:

**`step` (discrete thresholds):**
```js
// Show stops only at zoom 12+
'icon-opacity': ['step', ['zoom'], 0, 12, 1]
```

**`interpolate` (smooth transitions):**
```js
// Smoothly scale icon size with zoom
'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 14, 1.0, 18, 1.4]
```

> **Important:** `icon-opacity` (paint property) responds to fractional zoom changes continuously. `icon-size` (layout property) only updates at integer zoom crossings. Use `icon-opacity` with `step` for responsive show/hide behaviour.

**Layer-level zoom bounds** (simpler alternative):
```js
map.addLayer({ id: 'stops', minzoom: 12, maxzoom: 20, ... })
```

---

### Option 5: `<Marker>` vs. `<Source>`+`<Layer>` — Performance Comparison

| Aspect | `<Marker>` (current) | `<Source>` + `<Layer>` |
|---|---|---|
| Rendering | HTML DOM elements | WebGL canvas |
| Collision detection | None | Full native support |
| Performance at 200+ markers | Lag on drag | Excellent |
| Custom HTML/CSS | Full support | Limited to style spec |
| Clustering support | Manual (supercluster npm) | Built-in |
| Re-render on pan/zoom | Every animation frame | Cached by tile |

`<Marker>` components re-render on every animation frame during drag. At ~200+ markers, map dragging becomes sluggish. The current app fetches up to 100 stops — already near this threshold.

**Recommended hybrid pattern:**
- Render all stops via `<Layer>` (WebGL, collision-aware)
- Use a single `<Marker>` only for the currently selected stop (for custom HTML popup)

---

## How Mapbox's Collision Detection Pipeline Works

This is the mechanism that produces the Google Maps auto-appear/reappear on zoom effect:

1. **Tile load**: Symbol candidates identified in worker threads
2. **Background layout**: Glyph shaping and anchor placement in tile coordinates
3. **Foreground placement**: Global collision detection on main thread using a `GridIndex` in viewport coordinates
4. **CrossTileSymbolIndex**: Matches same symbols across zoom-level tiles to prevent flicker on zoom
5. **Opacity buffer**: Each symbol gets `current-opacity` → `target-opacity` (1 or 0)
6. **GPU fade**: Smooth fade-in/fade-out animation as symbols appear/disappear
7. **Cross-source detection**: Since v0.42.0, collision detection works across multiple sources simultaneously

---

## Recommended Implementation Approach

Combine **Options 2 + 3 + 4** for the Google Maps-like experience without full clustering:

```tsx
// Convert stops to GeoJSON with priority property
const stopsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
  type: 'FeatureCollection',
  features: stops.map(stop => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: stop.stopLoc?.coordinates ?? [0, 0]
    },
    properties: {
      stopId: stop.stopId,
      stopName: stop.stopName,
      stopCode: stop.stopCode,
      // Fewer routes = lower priority (higher number); more routes = higher priority
      priority: Math.max(1, 10 - (stop.routes?.length ?? 0))
    }
  }))
}), [stops]);

// In JSX:
<Source id="stops" type="geojson" data={stopsGeoJSON}>
  <Layer
    id="stop-icons"
    type="symbol"
    layout={{
      'icon-image': 'bus-stop',
      'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 14, 1.0, 18, 1.4],
      'symbol-sort-key': ['get', 'priority'],  // more routes win collisions
      'icon-allow-overlap': false,             // native collision detection
      'text-allow-overlap': false,
      'text-optional': true,                   // show icon even if text collides
      'text-field': ['step', ['zoom'], '', 14, ['get', 'stopName']],  // labels at zoom 14+
    }}
    paint={{
      'icon-opacity': ['step', ['zoom'], 0, 11, 1]  // hide below zoom 11
    }}
  />
</Source>
```

For full Google Maps clustering UX at low zoom, also add **Option 1** (GeoJSON clustering) to group stops into cluster circles before zoom 14.

---

## References

- [Mapbox – Optimize Map Label Placement](https://docs.mapbox.com/help/troubleshooting/optimize-map-label-placement/)
- [Mapbox Style Spec – Layers Reference](https://docs.mapbox.com/style-spec/reference/layers/)
- [Mapbox GL JS – Cluster Example](https://docs.mapbox.com/mapbox-gl-js/example/cluster/)
- [Mapbox Style Spec – Sources Reference](https://docs.mapbox.com/style-spec/reference/sources/)
- [Mapbox Style Spec – Expressions Reference](https://docs.mapbox.com/style-spec/reference/expressions/)
- [Supercluster – GitHub](https://github.com/mapbox/supercluster)
- [react-map-gl – Tips and Tricks](https://visgl.github.io/react-map-gl/docs/get-started/tips-and-tricks)
- [react-map-gl – Marker vs Layer Discussion](https://github.com/visgl/react-map-gl/discussions/1511)
- [react-map-gl – 200+ Markers Performance Issue](https://github.com/visgl/react-map-gl/issues/750)
- [Mapbox Collision Detection – mapbox-gl-native Wiki](https://github.com/mapbox/mapbox-gl-native/wiki/Collision-Detection)
- [Guide to Sources and Layers in React + Mapbox GL JS](https://www.lostcreekdesigns.co/writing/a-complete-guide-to-sources-and-layers-in-react-and-mapbox-gl-js/)
