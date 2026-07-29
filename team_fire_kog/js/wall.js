/**
 * The grid: one marker per tile, positioned in mosaic coordinates inside the
 * transformed frame, so markers scale with the video automatically.
 *
 * Light-up is manifest-driven. The mosaic already shows black until a clip
 * enters -- that falls out of the render -- and this adds the interactive half:
 * a live tile gets a border, a name, and a click target; a tile that has not
 * started is invisible and not clickable.
 *
 * A tile carries two controls: a button covering the whole rectangle that zooms
 * it, and the recorder's name in the corner, which links to their original post.
 * That is why the tile itself is a <div> -- an <a> inside a <button> is not
 * valid, and the credit has to be able to be a link.
 *
 * Which of the two is live depends on the view. Across the wall the name is a
 * label and the whole rectangle zooms; on the angle being looked at, the name
 * becomes the link. A name renders at a fixed 11px however small the tile is, so
 * on a phone it was a large off-site target sitting on top of the zoom button --
 * see the .tile-name rules in wall.css. The reachability half is here, in
 * updateLiveState(), because the tab order is a property, not a style.
 */

import { tileStyle, isLive, liveCount } from "./geometry.js";
import { displayName } from "./manifest.js";

// The zoom button and the credit link for a tile, without hanging an expando off
// the element or re-querying the DOM 60 times a second in updateLiveState().
const hitAreas = new WeakMap();
const nameLinks = new WeakMap();

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
    nameLinks.set(el, label);
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

    // The name is only reachable when it is actually a link -- on the angle
    // being looked at. CSS takes the pointer away on the wall, but a link with
    // pointer-events: none is still a tab stop, so Tab would walk twenty names
    // that do nothing. This also covers a tile that has not entered yet, whose
    // name has been invisible and tabbable all along.
    const label = nameLinks.get(el);
    if (label) {
      const reachable = live && clip.id === focusedId ? 0 : -1;
      // Compared before writing: this runs on every frame for every tile.
      if (label.tabIndex !== reachable) label.tabIndex = reachable;
    }
  }
  return liveCount(manifest.clips, t);
}
