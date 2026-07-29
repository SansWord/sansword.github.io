/**
 * The grid: one marker per tile, positioned in mosaic coordinates inside the
 * transformed frame, so markers scale with the video automatically.
 *
 * Light-up is manifest-driven. The mosaic already shows black until a clip
 * enters -- that falls out of the render -- and this adds the interactive half:
 * a live tile gets a border, a name, and a click target; a tile that has not
 * started is invisible and not clickable.
 *
 * A tile is two controls, not one: a button covering the whole rectangle that
 * zooms it, and the recorder's name in the corner, which is a link to their
 * original post. That is why the tile itself is a <div> -- an <a> inside a
 * <button> is not valid, and the credit has to be the thing you can click.
 */

import { tileStyle, isLive, liveCount } from "./geometry.js";
import { displayName } from "./manifest.js";

// The zoom button for a tile, without hanging an expando off the element or
// re-querying the DOM 60 times a second in updateLiveState().
const hitAreas = new WeakMap();

export function buildTiles(container, manifest, onFocus) {
  container.textContent = "";
  const tiles = new Map();

  for (const clip of manifest.clips) {
    const name = displayName(clip);

    const el = document.createElement("div");
    el.className = "tile";
    el.dataset.clipId = clip.id;
    Object.assign(el.style, tileStyle(clip.slot));

    const hit = document.createElement("button");
    hit.type = "button";
    hit.className = "tile-hit";
    hit.setAttribute("aria-label", `放大 ${name} 拍攝的視角`);
    hit.addEventListener("click", () => {
      if (!el.classList.contains("live")) return;
      onFocus(clip);
    });

    // Always on, never only on hover: this is the credit, and it is the only
    // one the wall shows. It sits above the zoom button so the name is the
    // link and the rest of the rectangle is the zoom.
    const label = document.createElement("a");
    label.className = "tile-name";
    label.textContent = name;
    label.href = clip.credit.permalink || clip.credit.profile || "#";
    label.target = "_blank";
    label.rel = "noopener noreferrer";
    label.setAttribute("aria-label", `在 Threads 開啟 ${name} 的原始貼文`);

    el.append(hit, label);
    hitAreas.set(el, hit);
    container.append(el);
    tiles.set(clip.id, el);
  }
  return tiles;
}

export function updateLiveState(tiles, manifest, t, focusedId) {
  for (const clip of manifest.clips) {
    const el = tiles.get(clip.id);
    if (!el) continue;
    const live = isLive(clip, t);
    el.classList.toggle("live", live);
    el.classList.toggle("focused", live && clip.id === focusedId);
    const hit = hitAreas.get(el);
    if (hit) hit.disabled = !live;
  }
  return liveCount(manifest.clips, t);
}
