/**
 * ?at=SECONDS is a debug shortcut: start playback at an offset instead of 0, to
 * reach the closing scene (or any moment) without playing the whole track.
 *
 * The clamp is kept pure -- raw query value in, seconds out -- so it can be
 * table-tested without a DOM; main.js reads location.search and hands the raw
 * value here. Anything missing or unparseable (null, "", "abc"), zero, or
 * negative yields 0, a normal start. A value past the end is pulled back to just
 * inside it, so the clock still ticks the last stretch into finish().
 */
export function clampStartOffset(raw, duration) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, Math.max(0, duration - 0.5));
}
