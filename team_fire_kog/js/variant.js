/**
 * Pick one mosaic variant at page load from the client's screen and network.
 *
 * Pure and side-effect-free: same inputs, same output, no globals, no DOM. The
 * caller reads the environment (window/navigator/URL) and passes it in, so this
 * is unit-testable under node. Selection is frozen at load -- there is no
 * mid-stream switching, which would fight the audio-is-the-clock invariant.
 * See docs/superpowers/specs/2026-07-30-adaptive-mosaic-resolution-design.md.
 *
 * @param {Array<{id,url,width,height}>} variants  from manifest.mosaic.variants
 * @param {{viewportWidth:number, dpr:number, saveData?:boolean,
 *          effectiveType?:string, override?:string|null}} env
 * @returns {?{id,url,width,height,reason}}  the chosen variant plus why, or null
 *   when there are no variants (an old manifest) -- the caller then falls back
 *   to manifest.mosaic.file.
 */
export function selectVariant(variants, env) {
  if (!Array.isArray(variants) || variants.length === 0) return null;

  const sorted = [...variants].sort((a, b) => a.width - b.width);

  // 1. Explicit override wins, when it names a variant that exists.
  if (env.override) {
    const forced = sorted.find((v) => v.id === env.override);
    if (forced) return { ...forced, reason: "override" };
    // an unknown id falls through to auto-selection
  }

  // 2. Weak or metered network: never upgrade past base (the smallest). iOS
  // Safari reports no navigator.connection, so this simply does not fire there
  // and selection falls to the screen target -- base is already the safe
  // default and the tier we add is an upgrade for big screens, not a downgrade.
  const slow = env.saveData === true
    || ["slow-2g", "2g", "3g"].includes(env.effectiveType);
  if (slow) return { ...sorted[0], reason: "network" };

  // 3. Screen target: the smallest variant whose intrinsic width covers the
  // device's real pixels, capped at the largest. A focused non-hero tile is
  // blown up to fill the screen, so screen * dpr is what the viewer sees.
  const target = (env.viewportWidth || 0) * (env.dpr || 1);
  const fit = sorted.find((v) => v.width >= target) || sorted[sorted.length - 1];
  return { ...fit, reason: "screen" };
}
