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

/**
 * Reading order across the wall: top row left-to-right, then the next row down,
 * with the slot id as the final tie-break so the sequence is fixed for a given
 * layout and identical on every device.
 *
 * Spatial rather than by entry time or manifest order, because while a tile is
 * zoomed the wall is out of sight and "the angle next to this one" is the only
 * mental model a viewer can still hold. Adding a clip later reorders whatever
 * sits after its slot -- which is what a viewer would expect from a position on
 * the wall, and is why paths are keyed on path_code and never on this index.
 */
export function stepOrder(clips) {
  return [...clips].sort((a, b) =>
    a.slot.y - b.slot.y ||
    a.slot.x - b.slot.x ||
    (a.slot.slot_id < b.slot.slot_id ? -1 : a.slot.slot_id > b.slot.slot_id ? 1 : 0));
}

/**
 * The next clip that is actually live at time t, `direction` places along the
 * order from `current`, wrapping. Null when nothing else is showing -- the
 * caller should stay put rather than drop to the wall.
 */
export function stepTarget(order, current, direction, t) {
  const from = order.indexOf(current);
  if (from < 0 || order.length < 2) return null;

  for (let i = 1; i < order.length; i += 1) {
    const at = (((from + direction * i) % order.length) + order.length) % order.length;
    if (isLive(order[at], t)) return order[at];
  }
  return null;
}

/** Is this clip live at wall-relative time t? */
export function isLive(clip, t) {
  return t >= clip.enter_s && t < clip.exit_s;
}

export function liveCount(clips, t) {
  return clips.reduce((n, c) => n + (isLive(c, t) ? 1 : 0), 0);
}

/**
 * The one clip showing, or null when it is none or more than one.
 *
 * The wall opens and closes on the spine by itself -- twenty seconds before
 * anyone else's recording starts, and a moment at the end after the last one
 * runs out. A grid of nineteen black rectangles around one lit tile is not a
 * wall, so those stretches are shown as that clip alone.
 */
export function soloLiveClip(clips, t) {
  let solo = null;
  for (const clip of clips) {
    if (!isLive(clip, t)) continue;
    if (solo) return null;
    solo = clip;
  }
  return solo;
}
