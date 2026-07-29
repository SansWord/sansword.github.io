import { loadManifest, angleCount, contributorCount, songCaption } from "./manifest.js";
import { canvasRect, slotRect, fitTransform, transformCss } from "./geometry.js";
import { buildTiles, updateLiveState } from "./wall.js";
import { Clock } from "./clock.js";
import { Mixer } from "./mixer.js";
import { showCredit, showCollectionCredit } from "./credits.js";
import { encodePath, decodePath, readFragment, writeFragment } from "./path.js";

const frame = document.getElementById("frame");
const video = document.getElementById("mosaic");
const tilesEl = document.getElementById("tiles");
const liveCountEl = document.getElementById("live-count");
const hud = document.getElementById("hud");
const gate = document.getElementById("gate");
const gateTitle = document.getElementById("gate-title");
const gateSub = document.getElementById("gate-sub");
const gateSong = document.getElementById("gate-song");
const startButton = document.getElementById("start");
const shareButton = document.getElementById("share");
const backButton = document.getElementById("back");
const creditEl = document.getElementById("credit");
const creditLink = document.getElementById("credit-link");

let manifest = null;
let tiles = null;
let clock = null;
let mixer = null;

let focused = null;          // the clip currently focused, or null for the grid
let myPath = [];             // this viewer's own edit decision list
let replayPath = [];         // a shared path being replayed, if any
let replayIndex = 0;

function viewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

function applyView() {
  const rect = focused
    ? slotRect(focused.slot)
    : canvasRect(manifest.mosaic.canvas);
  frame.style.transform = transformCss(fitTransform(rect, viewport()));
}

/** Everything on the gate that names a number or the show comes from here. */
function writeGateCopy() {
  const angles = angleCount(manifest);
  const people = contributorCount(manifest);
  gateTitle.textContent = `${angles} angles. One moment.`;
  gateSub.textContent =
    `Recorded by ${people} people standing in different parts of the room.`;

  const caption = songCaption(manifest.song);
  if (!caption) return;
  gateSong.textContent = "";
  for (const [cls, text] of [["song-title", caption.title], ["song-show", caption.show]]) {
    if (!text) continue;
    const span = document.createElement("span");
    span.className = cls;
    span.textContent = text;
    gateSong.append(span);
  }
  gateSong.hidden = !gateSong.childElementCount;
}

function setFocus(clip, { record = true } = {}) {
  if (clip && focused && clip.id === focused.id) return;
  if (!clip && !focused) return;

  focused = clip || null;
  applyView();
  backButton.hidden = !focused;

  if (focused) {
    showCredit(creditEl, creditLink, focused);
  } else {
    showCollectionCredit(creditEl, creditLink, manifest);
  }

  if (record && clock && clock.running) {
    myPath.push({ t: clock.time, code: focused ? focused.path_code : "0" });
  }
}

function applyReplay(t) {
  // Advance through a shared path as its timestamps come up.
  while (replayIndex < replayPath.length && replayPath[replayIndex].t <= t) {
    const event = replayPath[replayIndex];
    replayIndex += 1;
    const clip = event.code === "0" ? null : manifest.clipForCode(event.code);
    setFocus(clip, { record: false });
  }
}

function tick(t) {
  applyReplay(t);
  const live = updateLiveState(tiles, manifest, t, focused ? focused.id : null);
  liveCountEl.textContent = `${live} angle${live === 1 ? "" : "s"} live`;

  // A focused clip that has run out drops back to the grid rather than holding
  // on a black tile.
  if (focused && t >= focused.exit_s) setFocus(null);
}

async function boot() {
  manifest = await loadManifest();

  const { width, height } = manifest.mosaic.canvas;
  for (const el of [video, tilesEl]) {
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
  }
  video.width = width;
  video.height = height;
  video.src = manifest.mosaic.file;

  tiles = buildTiles(tilesEl, manifest, (clip) => {
    replayPath = [];                    // diverging ends the replay
    setFocus(clip);
  });

  clock = new Clock(video);
  mixer = new Mixer(clock, manifest.audio);

  writeGateCopy();
  applyView();
  window.addEventListener("resize", applyView);

  const shared = readFragment(window.location.hash);
  if (shared) {
    replayPath = decodePath(shared);
    if (replayPath.length) {
      gateSub.textContent =
        `Someone's cut of this moment — ${replayPath.length} switches. ` +
        `Press play, then click any tile to make it yours.`;
    }
  }

  // Dynamic, and only on request: a viewer never fetches this file.
  if (new URLSearchParams(window.location.search).has("debug")) {
    import("./diag.js")
      .then((diag) => diag.attach(video, () => clock))
      .catch(() => { /* diagnostics are never worth breaking the page for */ });
  }

  await mixer.load(manifest.audio.master);
  showCollectionCredit(creditEl, creditLink, manifest);

  startButton.disabled = false;
}

startButton.addEventListener("click", async () => {
  gate.hidden = true;
  hud.hidden = false;
  startButton.disabled = true;

  clock.onTick(tick);
  // The audio decides when t = 0 is; the clock anchors to it and the video is
  // corrected toward the clock. Starting the mixer first and handing its
  // timestamp over is what keeps all three describing the same instant.
  const startedAt = mixer.start(0);
  await clock.start(0, startedAt);
});

backButton.addEventListener("click", () => {
  replayPath = [];
  setFocus(null);
});

shareButton.addEventListener("click", async () => {
  const encoded = encodePath(myPath);
  const url = window.location.origin + window.location.pathname + writeFragment(encoded);
  try {
    await navigator.clipboard.writeText(url);
    shareButton.textContent = "Copied";
  } catch (_) {
    window.location.hash = writeFragment(encoded).slice(1);
    shareButton.textContent = "In the URL bar";
  }
  setTimeout(() => { shareButton.textContent = "Copy my cut"; }, 2000);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && focused) {
    replayPath = [];
    setFocus(null);
  }
});

boot().catch((err) => {
  gateSub.textContent = `Could not load: ${err.message}`;
  startButton.disabled = true;
});
