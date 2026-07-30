/**
 * On-device diagnostics. Loaded only when the URL carries ?debug=1, via a
 * dynamic import, so nothing here runs -- or is even fetched -- for a viewer.
 *
 * It exists because the interesting device is a phone at the other end of a
 * cable-free connection, and the three plausible causes of "it lags" leave
 * different fingerprints:
 *
 *   dropped frames        the decoder cannot keep up      -> resolution/bitrate
 *   stalls + thin buffer  the bytes are not arriving      -> network
 *   low rAF rate          the main thread or compositor   -> the CSS transform
 *
 * Reading all three at once is what tells them apart. Everything is sampled
 * from the live page on the actual device, so there is no lab-versus-real gap.
 */

const SAMPLE_MS = 500;

function frameStats(video) {
  if (typeof video.getVideoPlaybackQuality === "function") {
    const q = video.getVideoPlaybackQuality();
    return { total: q.totalVideoFrames, dropped: q.droppedVideoFrames };
  }
  // Older WebKit
  if ("webkitDecodedFrameCount" in video) {
    return { total: video.webkitDecodedFrameCount, dropped: video.webkitDroppedFrameCount };
  }
  return { total: 0, dropped: 0 };
}

function bufferAhead(video) {
  const b = video.buffered;
  for (let i = 0; i < b.length; i++) {
    if (video.currentTime >= b.start(i) && video.currentTime <= b.end(i)) {
      return b.end(i) - video.currentTime;
    }
  }
  return 0;
}

/**
 * How large the composited video layer actually is, in device pixels.
 *
 * This is the number that decides whether the GPU can hold the frame: it is
 * the canvas times the view scale times devicePixelRatio, so a 3x phone
 * focusing a tile asks for something several times the width of the screen.
 * Watching it next to the frame counter is what separates "the decoder is
 * slow" from "the layer is too big to composite".
 */
function layerSize(video) {
  // Measured off the video's own box, since it is laid out rather than
  // transformed. Still the number that matters: it is what the compositor has
  // to hold, and it is where the focus freeze lived.
  const box = video.getBoundingClientRect();
  const w = Math.round(box.width * devicePixelRatio);
  const h = Math.round(box.height * devicePixelRatio);
  const scale = video.videoWidth ? box.width / video.videoWidth : 0;
  return `${w}x${h}  (scale ${scale.toFixed(2)}, dpr ${devicePixelRatio})`;
}

/**
 * Where the mosaic is actually streaming from, read off the element's resolved
 * currentSrc rather than the manifest -- this is the URL the decoder is really
 * pulling bytes from. On a phone it is the direct answer to "is this coming from
 * R2 or from the page's own origin": an off-origin host is the R2 bucket.
 */
function source(video) {
  const src = video.currentSrc || video.getAttribute("src") || "";
  if (!src) return "none";
  try {
    const u = new URL(src, location.href);
    const off = u.host !== location.host;
    return `${u.host}  (${off ? "off-origin → R2" : "same-origin"})`;
  } catch (_) {
    return src;
  }
}

/** Rough link speed, where the browser will say. Safari currently will not. */
function link() {
  const c = navigator.connection;
  if (!c) return "unreported";
  return [c.effectiveType, c.downlink ? `~${c.downlink}Mbps` : null]
    .filter(Boolean)
    .join(" ");
}

export function attach(video, getClock) {
  const panel = document.createElement("div");
  panel.id = "diag";
  panel.style.cssText = [
    "position:fixed", "left:0", "top:0", "z-index:100",
    "font:11px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace",
    "background:rgba(0,0,0,0.82)", "color:#f2f2f0",
    "padding:8px 10px", "max-width:min(340px,92vw)",
    "white-space:pre-wrap", "pointer-events:auto",
    "border-bottom-right-radius:6px",
  ].join(";");

  const copy = document.createElement("button");
  copy.textContent = "copy";
  copy.type = "button";
  copy.style.cssText =
    "font:inherit;margin-top:6px;padding:3px 10px;border-radius:4px;" +
    "border:1px solid rgba(242,242,240,0.4);background:transparent;color:inherit";

  const body = document.createElement("div");
  panel.append(body, copy);
  document.body.append(panel);

  let stalls = 0;
  let stalledMs = 0;
  let stalledAt = null;
  let firstFrameMs = null;
  const started = performance.now();

  video.addEventListener("waiting", () => {
    stalls += 1;
    stalledAt = performance.now();
  });
  for (const done of ["playing", "canplay"]) {
    video.addEventListener(done, () => {
      if (stalledAt !== null) {
        stalledMs += performance.now() - stalledAt;
        stalledAt = null;
      }
      if (firstFrameMs === null) firstFrameMs = performance.now() - started;
    });
  }

  // rAF rate, measured over a rolling second. A phone that is compositing a
  // large transformed layer shows it here and nowhere else.
  let frames = 0;
  let fps = 0;
  let windowStart = performance.now();
  const spin = () => {
    frames += 1;
    const now = performance.now();
    if (now - windowStart >= 1000) {
      fps = Math.round((frames * 1000) / (now - windowStart));
      frames = 0;
      windowStart = now;
    }
    requestAnimationFrame(spin);
  };
  requestAnimationFrame(spin);

  let peakDrift = 0;
  let text = "";

  const sample = () => {
    const clock = getClock();
    const f = frameStats(video);
    const drop = f.total ? (f.dropped / f.total) * 100 : 0;
    const drift = clock && clock.running ? video.currentTime - clock.time : 0;
    if (Math.abs(drift) > Math.abs(peakDrift)) peakDrift = drift;
    text = [
      `${screen.width}x${screen.height} @${devicePixelRatio}x  vp ${innerWidth}x${innerHeight}`,
      `video ${video.videoWidth}x${video.videoHeight}  t=${video.currentTime.toFixed(1)}`,
      `source   ${source(video)}`,
      ``,
      `frames   ${f.dropped} dropped / ${f.total}  (${drop.toFixed(1)}%)`,
      `rAF      ${fps} fps`,
      `stalls   ${stalls}  (${(stalledMs / 1000).toFixed(1)}s waiting)`,
      `buffer   ${bufferAhead(video).toFixed(1)}s ahead`,
      `drift    ${drift.toFixed(3)}s  (peak ${peakDrift.toFixed(3)})`,
      `rate     ${video.playbackRate.toFixed(3)}${video.paused ? "  PAUSED" : ""}`,
      `seeks    ${clock ? clock.seeks : 0}`,
      `layer    ${layerSize(video)}`,
      `1st frm  ${firstFrameMs === null ? "-" : Math.round(firstFrameMs) + "ms"}`,
      `link     ${link()}`,
      ``,
      navigator.userAgent,
    ].join("\n");
    body.textContent = text;
  };

  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
      copy.textContent = "copied";
    } catch (_) {
      copy.textContent = "select the text above";
    }
    setTimeout(() => { copy.textContent = "copy"; }, 2000);
  });

  sample();
  setInterval(sample, SAMPLE_MS);
}
