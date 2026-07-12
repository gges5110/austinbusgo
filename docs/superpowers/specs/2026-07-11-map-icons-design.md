# Map Icon Redesign: Stop Flags & Vehicle Teardrops

**Date:** 2026-07-11 · **Status:** Approved (option B of three directions)

## Goal

Make the map icons transit-recognizable: stops read as "bus stop", vehicles
read as "bus", at a glance. Direction chosen from three visual mockups:
rounded-square stop flags and rotating teardrop vehicle pointers, keeping the
existing status colors (blue in transit / orange incoming / red stopped) and
all decluttering behavior from the native-collision work (PR #165).

## Constraints that shape the design

- SDF sprites (today's stop dot) are single-color; the flag and teardrop are
  two-color (colored body + white glyph), so sprites are **baked (non-SDF)
  canvas images**.
- `icon-image` is a layout property: it can switch on zoom and feature
  properties, but **not** on `feature-state` — so hover cannot recolor a
  baked sprite. Hover feedback moves to a feature-state-driven **underlay
  circle layer** (soft red ring, invisible unless hovered).
- A glyph baked into a rotating sprite would rotate with it (upside-down bus
  heading south), so the vehicle glyph is a **separate viewport-aligned
  symbol layer** that never rotates.

## Stop layer

- Sprites (all canvas-generated via `useMapImage`): `stop-flag-far`
  (rounded square, no glyph) and `stop-flag` (square + white bus glyph),
  each in blue and selected-red — 4 images.
- `icon-image`: zoom `step` picks far/near at z13 (glyphs are unreadable
  below ~14px), nested `case` on `selectedStopId` picks the red variant.
- Hover: `stops-hover` circle layer under the symbol layer;
  `circle-opacity`/`circle-stroke-opacity` are 0 unless
  `feature-state.hovered`.
- Unchanged from PR #165: collision decluttering, zoom-interpolated
  `icon-padding`, `symbol-sort-key` by route count, `text-variable-anchor`
  labels, `icon-allow-overlap` on route pages (`disableLod`).

## Vehicle layer

- Sprites: three teardrops (blue/orange/red, white outline), bulb centered
  on the canvas so `icon-rotate: bearing` pivots around the bus position;
  tip replaces the old chevron layer. Plus one white bus glyph.
- Layers, in order: `vehicles-hover` underlay circle (feature-state ring) →
  `vehicle-markers` teardrop symbol layer (`icon-image` matches
  `currentStatus`, `icon-rotation-alignment: map`) → glyph layer
  (viewport-aligned, `icon-ignore-placement`, non-interactive) → existing
  route-number label layer.
- The old circle layer, arrow layer, and hover-darkened color variants are
  deleted. Interactive layer id changes ripple to Map.tsx and tests.

## Testing

- Unit: layer ids/registration updates in StopLayer/VehicleLayer/Map tests;
  sprite factories return null without canvas (jsdom) — covered by the
  existing `useMapImage` null contract.
- Visual (Chrome): far/near zoom appearance, glyph switch at z13, hover
  ring, selected red flag, teardrop rotation matching bearing, route pages
  showing all stops.

## Risk / fallback

If rotating teardrops read badly with dense downtown traffic, keep the
bulb-with-glyph and reinstate the rim chevron; everything else stands.
