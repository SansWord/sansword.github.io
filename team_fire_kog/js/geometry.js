/**
 * Pure geometry for the wall. No DOM access, so it is unit-testable.
 *
 * The mosaic renders at its natural pixel size inside a container with
 * transform-origin at 0 0. Both the grid view and a focused tile are the same
 * operation -- fit a rectangle in mosaic coordinates to the viewport and centre
 * it -- which is why focusing is instant and cannot desync: it is a transform
 * on a frame that has already been decoded.
 */

export function canvasRect(canvas) {
  return { x: 0, y: 0, w: canvas.width, h: canvas.height };
}

export function slotRect(slot) {
  return { x: slot.x, y: slot.y, w: slot.w, h: slot.h };
}

export function fitTransform(rect, viewport) {
  const vw = Math.max(1, viewport.width || 0);
  const vh = Math.max(1, viewport.height || 0);
  const w = Math.max(1, rect.w);
  const h = Math.max(1, rect.h);

  const scale = Math.min(vw / w, vh / h);
  return {
    scale,
    x: vw / 2 - scale * (rect.x + w / 2),
    y: vh / 2 - scale * (rect.y + h / 2),
  };
}

export function transformCss(t) {
  return `translate(${t.x}px, ${t.y}px) scale(${t.scale})`;
}

/** Absolute placement for a marker overlaying a tile, in mosaic coordinates. */
export function tileStyle(slot) {
  return {
    left: `${slot.x}px`,
    top: `${slot.y}px`,
    width: `${slot.w}px`,
    height: `${slot.h}px`,
  };
}

/** Is this clip live at wall-relative time t? */
export function isLive(clip, t) {
  return t >= clip.enter_s && t < clip.exit_s;
}

export function liveCount(clips, t) {
  return clips.reduce((n, c) => n + (isLive(c, t) ? 1 : 0), 0);
}
