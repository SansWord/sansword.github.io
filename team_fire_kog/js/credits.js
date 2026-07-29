/**
 * Every angle belongs to the person who recorded it. Per-clip credit lives on
 * the tile itself -- always visible, and a link to the original post; see
 * buildTiles() in wall.js. What is left for the footer is the one credit no
 * single tile can carry: the collection, and the thread it came from.
 */

import { angleCount, contributorCount, contributors } from "./manifest.js";

function postLink(href, text, label) {
  const a = document.createElement("a");
  a.textContent = text;
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  if (label) a.setAttribute("aria-label", label);
  return a;
}

/**
 * The credit roll: every contributor, linking to the post their angle came
 * from. Rendered into both the panel behind the gate and the end card, so the
 * names are reachable before you watch and are the thing you land on after.
 *
 * A person who sent two angles gets one row and a second numbered link rather
 * than appearing twice -- the roll lists the people, and both posts stay one
 * click away.
 */
export function renderCreditRoll(list, manifest) {
  list.textContent = "";
  for (const person of contributors(manifest)) {
    const row = document.createElement("li");
    const href = person.posts[0] || person.profile || "#";
    row.append(postLink(href, person.name, `在 Threads 開啟 ${person.name} 的貼文`));

    person.posts.slice(1).forEach((url, i) => {
      const extra = postLink(url, String(i + 2), `${person.name} 的第 ${i + 2} 個視角`);
      extra.className = "credit-extra";
      row.append(extra);
    });

    list.append(row);
  }
  return list;
}

export function showCollectionCredit(container, link, manifest) {
  // Counted, not typed: the same reason the gate copy is derived.
  const angles = angleCount(manifest);
  const people = contributorCount(manifest);
  link.textContent = `${people} 位火種的 ${angles} 個視角 — 看原始討論串`;
  link.href = manifest.collection_post;
  link.setAttribute("aria-label", "在 Threads 開啟原始討論串");
  container.hidden = false;
}
