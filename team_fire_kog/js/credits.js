/**
 * Every angle belongs to the person who recorded it. The credit is visible
 * whenever a tile is focused and always links back to the original post --
 * uploaders are the people this project depends on, and the original post is
 * where the real thing lives.
 */

import { displayName, angleCount, contributorCount } from "./manifest.js";

export function showCredit(container, link, clip) {
  if (!clip) {
    container.hidden = true;
    return;
  }
  const name = displayName(clip);
  link.textContent = `Recorded by ${name}`;
  link.href = clip.credit.permalink || clip.credit.profile || "#";
  link.setAttribute(
    "aria-label",
    `Open the original post by ${name} on Threads`
  );
  container.hidden = false;
}

export function showCollectionCredit(container, link, manifest) {
  // Counted, not typed: the same reason the gate copy is derived.
  const angles = angleCount(manifest);
  const people = contributorCount(manifest);
  link.textContent = `${angles} angles from ${people} people — see the original thread`;
  link.href = manifest.collection_post;
  link.setAttribute("aria-label", "Open the collection post on Threads");
  container.hidden = false;
}
