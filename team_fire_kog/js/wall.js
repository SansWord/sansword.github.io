/**
 * The grid: one marker per tile, positioned in mosaic coordinates inside the
 * transformed frame, so markers scale with the video automatically.
 *
 * Light-up is manifest-driven. The mosaic already shows black until a clip
 * enters -- that falls out of the render -- and this adds the interactive half:
 * a live tile gets a border, a name, and a click target; a tile that has not
 * started is invisible and not clickable.
 */

import { tileStyle, isLive, liveCount } from "./geometry.js";
import { displayName } from "./manifest.js";

export function buildTiles(container, manifest, onFocus) {
  container.textContent = "";
  const tiles = new Map();

  for (const clip of manifest.clips) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "tile";
    el.dataset.clipId = clip.id;
    el.setAttribute("aria-label", `Focus the angle recorded by ${displayName(clip)}`);
    Object.assign(el.style, tileStyle(clip.slot));

    const name = document.createElement("span");
    name.className = "tile-name";
    name.textContent = displayName(clip);
    el.append(name);

    el.addEventListener("click", () => {
      if (!el.classList.contains("live")) return;
      onFocus(clip);
    });

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
    el.disabled = !live;
  }
  return liveCount(manifest.clips, t);
}
