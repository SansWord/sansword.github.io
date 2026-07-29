/**
 * Viewer paths: a sequence of focus changes encoded into the URL fragment.
 *
 * Format v1 -- '1' then 4 characters per event: 3 base36 digits of deciseconds
 * (0..46655 ds, about 77 minutes) plus 1 base36 character for the clip's
 * path_code. '0' means grid view.
 *
 * Codes come from the manifest, never from a grid index, so re-laying out the
 * wall cannot break a link somebody already shared. No backend is involved --
 * what circulates is a hundred bytes of choices, not a copy of anyone's video.
 */

const VERSION = "1";
const TIME_DIGITS = 3;
const MAX_DECISECONDS = Math.pow(36, TIME_DIGITS) - 1;

function toBase36(n, width) {
  return Math.max(0, Math.min(MAX_DECISECONDS, Math.round(n)))
    .toString(36)
    .padStart(width, "0");
}

export function encodePath(events) {
  const parts = [VERSION];
  let previous = null;
  for (const event of events) {
    if (!event || typeof event.code !== "string" || event.code.length !== 1) continue;
    if (event.code === previous) continue;          // collapse repeats
    previous = event.code;
    parts.push(toBase36((event.t || 0) * 10, TIME_DIGITS) + event.code);
  }
  return parts.join("");
}

export function decodePath(encoded) {
  if (typeof encoded !== "string" || encoded.length === 0) return [];
  if (encoded[0] !== VERSION) return [];

  const body = encoded.slice(1);
  const events = [];
  for (let i = 0; i + TIME_DIGITS < body.length; i += TIME_DIGITS + 1) {
    const timePart = body.slice(i, i + TIME_DIGITS);
    const code = body[i + TIME_DIGITS];
    if (!/^[0-9a-z]+$/.test(timePart) || !/^[0-9a-z]$/.test(code)) continue;
    const ds = parseInt(timePart, 36);
    if (!Number.isFinite(ds)) continue;
    events.push({ t: ds / 10, code });
  }

  events.sort((a, b) => a.t - b.t);

  const collapsed = [];
  for (const event of events) {
    if (collapsed.length && collapsed[collapsed.length - 1].code === event.code) continue;
    collapsed.push(event);
  }
  return collapsed;
}

export function readFragment(hash) {
  if (typeof hash !== "string" || hash.length < 2) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get("p");
}

export function writeFragment(encoded) {
  return `#p=${encoded}`;
}

/** The clip code in effect at wall-relative time t, or '0' for grid view. */
export function codeAt(events, t) {
  let code = "0";
  for (const event of events) {
    if (event.t > t) break;
    code = event.code;
  }
  return code;
}
