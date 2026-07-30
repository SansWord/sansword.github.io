/**
 * Format a playback position and total length as "M:SS/M:SS" (e.g. "1:16/2:20").
 *
 * Pure and DOM-free so it can be unit-tested. Seconds are floored, not rounded,
 * so the readout never shows a second the clock has not reached. The current
 * value is clamped to [0, duration]; a negative or non-finite current floors to
 * zero, which is what the clock can briefly report before it is anchored.
 */
export function formatTimecode(currentSeconds, durationSeconds) {
  const dur = Math.max(0, Math.floor(durationSeconds || 0));
  let cur = Math.floor(currentSeconds);
  if (!Number.isFinite(cur) || cur < 0) cur = 0;
  if (cur > dur) cur = dur;
  return `${clockText(cur)}/${clockText(dur)}`;
}

function clockText(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
