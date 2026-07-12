/**
 * Canvas-generated map sprites for the stop flag and vehicle teardrop
 * markers. All sprites are baked (non-SDF) because they are two-color;
 * hover feedback therefore comes from feature-state-driven underlay circle
 * layers rather than icon recoloring (layout properties like icon-image
 * cannot read feature-state).
 */

import { GeneratedImage } from "features/map/hooks/useMapImage";

export const STOP_BLUE = "#1A73E8";
export const SELECTED_RED = "#EA4335";
export const VEHICLE_TRANSIT_BLUE = "#1E88E5";
export const VEHICLE_INCOMING_ORANGE = "#FF9800";
export const VEHICLE_STOPPED_RED = "#F44336";

/** Flag sprite canvas is 64px with a 48px rounded square centered in it. */
export const FLAG_SPRITE_SIZE = 64;
/** Teardrop sprite canvas is 80px; the 44px bulb is centered so rotation
 * pivots around the vehicle position. */
export const TEARDROP_SPRITE_SIZE = 80;
export const TEARDROP_BULB_RADIUS = 22;
/** Standalone glyph canvas is 64px with a 34px-tall bus centered in it. */
export const GLYPH_SPRITE_SIZE = 64;
export const GLYPH_BUS_HEIGHT = 34;

function withCanvas(
  size: number,
  draw: (ctx: CanvasRenderingContext2D) => void
): GeneratedImage | null {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  draw(ctx);
  const imageData = ctx.getImageData(0, 0, size, size);
  return { width: size, height: size, data: imageData.data };
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Front-view bus centered at (cx, cy) with the given overall height.
 * If windshieldColor is omitted the windshield is knocked out to
 * transparent (for the standalone glyph that floats over the teardrop).
 */
function drawBusGlyph(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  height: number,
  color: string,
  windshieldColor?: string
) {
  const h = height;
  const w = h * 0.92;
  const x = cx - w / 2;
  const y = cy - h / 2;

  // Body
  ctx.fillStyle = color;
  roundRectPath(ctx, x, y, w, h * 0.84, h * 0.14);
  ctx.fill();

  // Windshield
  const wsX = x + w * 0.16;
  const wsY = y + h * 0.15;
  const wsW = w * 0.68;
  const wsH = h * 0.27;
  if (windshieldColor === undefined) {
    ctx.globalCompositeOperation = "destination-out";
    roundRectPath(ctx, wsX, wsY, wsW, wsH, h * 0.06);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  } else {
    ctx.fillStyle = windshieldColor;
    roundRectPath(ctx, wsX, wsY, wsW, wsH, h * 0.06);
    ctx.fill();
    ctx.fillStyle = color;
  }

  // Wheels
  ctx.beginPath();
  ctx.arc(x + w * 0.28, y + h * 0.94, h * 0.1, 0, 2 * Math.PI);
  ctx.arc(x + w * 0.72, y + h * 0.94, h * 0.1, 0, 2 * Math.PI);
  ctx.fill();
}

function drawStopFlag(
  ctx: CanvasRenderingContext2D,
  color: string,
  withGlyph: boolean
) {
  const inset = 8;
  const square = FLAG_SPRITE_SIZE - inset * 2;

  ctx.fillStyle = color;
  roundRectPath(ctx, inset, inset, square, square, 13);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4.5;
  ctx.stroke();

  if (withGlyph) {
    drawBusGlyph(
      ctx,
      FLAG_SPRITE_SIZE / 2,
      FLAG_SPRITE_SIZE / 2,
      square * 0.62,
      "#ffffff",
      color
    );
  }
}

function drawTeardrop(ctx: CanvasRenderingContext2D, color: string) {
  const c = TEARDROP_SPRITE_SIZE / 2;
  const r = TEARDROP_BULB_RADIUS;
  // Tangent points where the tip's straight edges meet the bulb
  const tangentX = 15;
  const tangentY = 16;
  const startAngle = Math.atan2(-tangentY, -tangentX);
  const endAngle = Math.atan2(-tangentY, tangentX);

  ctx.beginPath();
  ctx.moveTo(c, 5); // tip (north; icon-rotate points it along the bearing)
  ctx.lineTo(c - tangentX, c - tangentY);
  // Long way around the bottom of the bulb
  ctx.arc(c, c, r, startAngle, endAngle, true);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.stroke();
}

// Module-level factory instances so useMapImage effect deps stay stable

export const createStopFlagFar = () =>
  withCanvas(FLAG_SPRITE_SIZE, (ctx) => drawStopFlag(ctx, STOP_BLUE, false));
export const createStopFlagFarSelected = () =>
  withCanvas(FLAG_SPRITE_SIZE, (ctx) => drawStopFlag(ctx, SELECTED_RED, false));
export const createStopFlagNear = () =>
  withCanvas(FLAG_SPRITE_SIZE, (ctx) => drawStopFlag(ctx, STOP_BLUE, true));
export const createStopFlagNearSelected = () =>
  withCanvas(FLAG_SPRITE_SIZE, (ctx) => drawStopFlag(ctx, SELECTED_RED, true));

export const createTeardropTransit = () =>
  withCanvas(TEARDROP_SPRITE_SIZE, (ctx) =>
    drawTeardrop(ctx, VEHICLE_TRANSIT_BLUE)
  );
export const createTeardropIncoming = () =>
  withCanvas(TEARDROP_SPRITE_SIZE, (ctx) =>
    drawTeardrop(ctx, VEHICLE_INCOMING_ORANGE)
  );
export const createTeardropStopped = () =>
  withCanvas(TEARDROP_SPRITE_SIZE, (ctx) =>
    drawTeardrop(ctx, VEHICLE_STOPPED_RED)
  );

export const createBusGlyph = () =>
  withCanvas(GLYPH_SPRITE_SIZE, (ctx) =>
    drawBusGlyph(
      ctx,
      GLYPH_SPRITE_SIZE / 2,
      GLYPH_SPRITE_SIZE / 2,
      GLYPH_BUS_HEIGHT,
      "#ffffff"
    )
  );
