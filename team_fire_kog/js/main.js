import { loadManifest, angleCount, contributorCount, songCaption } from "./manifest.js";
import {
  canvasRect, slotRect, fitTransform, transformCss, stepOrder, stepTarget,
  soloLiveClip,
} from "./geometry.js";
import { buildTiles, updateLiveState } from "./wall.js";
import { Clock } from "./clock.js";
import { Mixer } from "./mixer.js";
import { showCollectionCredit, renderCreditRoll } from "./credits.js";
import { encodePath, decodePath, readFragment, writeFragment } from "./path.js";
import { lockZoom } from "./zoomlock.js";

const stage = document.getElementById("stage");
const frame = document.getElementById("frame");
const video = document.getElementById("mosaic");
const tilesEl = document.getElementById("tiles");
const liveCountEl = document.getElementById("live-count");
const hud = document.getElementById("hud");
const gate = document.getElementById("gate");
const gateTitle = document.getElementById("gate-title");
const gateSub = document.getElementById("gate-sub");
const gateDetail = document.getElementById("gate-detail");
const gateSong = document.getElementById("gate-song");
const startButton = document.getElementById("start");
const shareButton = document.getElementById("share");
const focusControls = document.getElementById("focus-controls");
const backButton = document.getElementById("back");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");
const swipeHint = document.getElementById("swipe-hint");
const tapHint = document.getElementById("tap-hint");
const endEl = document.getElementById("end");
const replayButton = document.getElementById("replay");
const creditEl = document.getElementById("credit");
const creditLink = document.getElementById("credit-link");
const creditsPanel = document.getElementById("credits");
const showCreditsButton = document.getElementById("show-credits");
const closeCreditsButton = document.getElementById("credits-close");

// Armed before anything else, and never lifted: the wall has its own zoom and a
// browser zoom on top of it hides the controls that undo it.
lockZoom();

let manifest = null;
let tiles = null;
let clock = null;
let mixer = null;
let order = [];              // stepping order for the prev/next controls

let focused = null;          // the clip currently focused, or null for the grid
let finished = false;        // the wall has run out and the end card is up
let autoFocused = false;     // the current focus was chosen by the solo rule
let soloLock = false;        // only one angle is live: there is nowhere to go
let myPath = [];             // this viewer's own edit decision list
let replayPath = [];         // a shared path being replayed, if any
let replayIndex = 0;
let audioError = null;       // the last master-track failure, retried on play

// The wall is fitted into the band between the chrome, not the whole window.
// The counter sits at the top and the collection credit at the bottom, and now
// that every tile carries a name there is always something down there for the
// credit to land on top of. Roughly a line of text plus its padding, each end.
const CHROME_TOP_PX = 34;
const CHROME_BOTTOM_PX = 44;

function viewport() {
  return {
    width: window.innerWidth,
    height: Math.max(1, window.innerHeight - CHROME_TOP_PX - CHROME_BOTTOM_PX),
  };
}

function applyView() {
  const canvas = manifest.mosaic.canvas;
  const rect = focused ? slotRect(focused.slot) : canvasRect(canvas);
  const fitted = fitTransform(rect, viewport());
  // fitTransform centres within the band; this drops the band into place.
  const t = { ...fitted, y: fitted.y + CHROME_TOP_PX };

  // Same transform, applied two ways. The markers ride a CSS transform because
  // they are cheap DOM boxes; the video is laid out at the size it is actually
  // displayed, because transforming it is what the compositor cannot afford.
  frame.style.transform = transformCss(t);
  video.style.left = `${t.x}px`;
  video.style.top = `${t.y}px`;
  video.style.width = `${canvas.width * t.scale}px`;
  video.style.height = `${canvas.height * t.scale}px`;

  // The tile names ride the same transform as the markers, which would render
  // them at ~7px across the whole wall and hugely on a focused tile. This is
  // the inverse, so a name is the same size on screen at either end. The CSS
  // does the scaling; see .tile-name.
  frame.style.setProperty("--label-scale", String(1 / t.scale));
}

/** Everything on the gate that names a number or the show comes from here. */
function writeGateCopy() {
  const angles = angleCount(manifest);
  const people = contributorCount(manifest);
  gateTitle.textContent = `${angles} 個視角，同一個瞬間。`;
  gateSub.textContent = `由 ${people} 位站在場館各個角落的火種拍下。`;

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

/**
 * The credit roll, rendered into both places it appears: the panel you can
 * open from the gate, and the end card. Same list, same order, built once at
 * boot from the manifest so neither copy can drift from the other.
 */
function writeCreditRoll() {
  for (const id of ["credits-roll", "end-roll"]) {
    renderCreditRoll(document.getElementById(id), manifest);
  }
  for (const id of ["credits-thread", "end-thread"]) {
    document.getElementById(id).href = manifest.collection_post;
  }
}

function openCredits() {
  creditsPanel.hidden = false;
  closeCreditsButton.focus();
}

function closeCredits() {
  if (creditsPanel.hidden) return;
  creditsPanel.hidden = true;
  showCreditsButton.focus();
}

/** A focus the viewer chose is theirs; the solo rule must not undo it. */
function userTookOver() {
  autoFocused = false;
}

/**
 * The controls that only make sense with a wall behind them.
 *
 * While the spine is the only thing playing there is no next angle and no wall
 * to go back to, so the whole bar goes away rather than offering three buttons
 * that would do nothing or drop the viewer onto nineteen black rectangles.
 * The swipe and the arrow keys are gated on the same flag.
 */
function applyFocusChrome() {
  const zoomed = Boolean(focused);
  focusControls.hidden = !zoomed || soloLock;
  if (zoomed && !soloLock) maybeShowSwipeHint();
  // soloLock means the spine is the only thing playing, so there is no wall
  // behind the tile and nothing to invite a click on yet.
  if (!zoomed && !soloLock && !finished) maybeShowTapHint();
}

/**
 * Show the spine alone while it is the only thing playing, and open back out
 * to the wall the moment a second angle starts.
 *
 * Only ever undoes its own work: a tile the viewer picked during the wall is
 * left alone, and when it runs out the ordinary exit rule hands over.
 */
function maybeAutoSolo(t) {
  if (replayPath.length) {              // a shared cut outranks this entirely
    soloLock = false;
    applyFocusChrome();
    return;
  }

  const solo = soloLiveClip(manifest.clips, t);
  if (solo) {
    soloLock = true;
    if (!focused) {
      setFocus(solo, { record: false });
      autoFocused = true;
    }
  } else {
    soloLock = false;
    if (focused && autoFocused) setFocus(null, { record: false });
    autoFocused = false;
  }
  applyFocusChrome();
}

/** Move `direction` places through the order, skipping clips that are not live. */
function step(direction) {
  if (!focused || !clock || soloLock) return;
  const target = stepTarget(order, focused, direction, clock.time);
  if (!target) return;                  // nothing else live: stay put
  replayPath = [];                      // stepping is diverging, same as a click
  userTookOver();
  setFocus(target);
}

let hintShown = false;
let tapHintShown = false;

/** Say the gesture exists once, on the device where it is the only control. */
function maybeShowSwipeHint() {
  if (hintShown || !window.matchMedia("(hover: none)").matches) return;
  hintShown = true;
  swipeHint.hidden = false;
  setTimeout(() => { swipeHint.hidden = true; }, 3400);
}

/**
 * Say that a tile can be clicked, once, the first time there is a wall to say
 * it about.
 *
 * Not gated on (hover: none) the way the swipe hint is: a pointer does not make
 * a tile look like a button either, and the first two people to miss this were
 * on a phone and on a laptop. Deliberately fired from the wall rather than at
 * play, because the page opens on the spine alone -- announcing "click any
 * tile" over a single video, before the other nineteen arrive, describes
 * something that is not on screen yet.
 */
function maybeShowTapHint() {
  if (tapHintShown || !clock || !clock.running) return;
  tapHintShown = true;
  tapHint.hidden = false;
  // Matches the tap-hint-fade duration in wall.css; the animation does the
  // fading and this actually withdraws the element.
  setTimeout(() => { tapHint.hidden = true; }, 9000);
}

function setFocus(clip, { record = true } = {}) {
  if (clip && focused && clip.id === focused.id) return;
  if (!clip && !focused) return;

  focused = clip || null;
  applyView();

  tilesEl.classList.toggle("zoomed", Boolean(focused));
  // No per-clip line in the footer any more: the recorder's name is on the
  // tile itself, always visible and linking to their post, so repeating it
  // down here only said the same thing twice and smaller. The footer keeps the
  // one credit the tiles cannot carry -- the collection.
  applyFocusChrome();

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

/**
 * The wall has run out. Stop the clock, park the video, offer it again.
 *
 * Without this the page looped silently: the mosaic and the master track are
 * both exactly wall-length, so the video reaches its end while the clock is
 * still counting, and Clock._correct() finds a paused element and calls play()
 * -- which, on an element that has ended, seeks to 0 and starts over per spec.
 * The audio buffer source does not restart, so the wall replayed mute. The
 * clock stopping is the fix; the guard in _correct() is the belt to its braces.
 */
function finish() {
  if (finished) return;
  finished = true;

  clock.stop();
  mixer.stop();
  setFocus(null, { record: false });
  hud.hidden = true;
  endEl.hidden = false;
  // The end card carries the full roll and its own thread link, so the footer
  // strip would only repeat it, smaller, underneath a list it might overlap.
  creditEl.hidden = true;
  replayButton.focus();
}

async function replayFromStart() {
  if (!finished) return;
  finished = false;
  endEl.hidden = true;
  hud.hidden = false;
  showCollectionCredit(creditEl, creditLink, manifest);

  // A replay is a clean run, not a continuation: whatever cut was being watched
  // or built is spent.
  myPath = [];
  replayPath = [];
  replayIndex = 0;
  autoFocused = false;
  soloLock = false;
  setFocus(null, { record: false });

  const startedAt = mixer.start(0);
  await clock.start(0, startedAt);
}

function tick(t) {
  if (t >= manifest.duration_s) {
    finish();
    return;
  }

  applyReplay(t);

  // A focused clip that has run out drops back to the grid rather than holding
  // on a black tile. Before the solo check, so the last angle ending hands
  // straight over to the spine rather than showing a frame of empty wall.
  if (focused && t >= focused.exit_s) {
    setFocus(null);
    autoFocused = false;
  }
  maybeAutoSolo(t);

  const live = updateLiveState(tiles, manifest, t, focused ? focused.id : null);
  liveCountEl.textContent = `${live} 個視角播放中`;
}

async function boot() {
  manifest = await loadManifest();

  const { width, height } = manifest.mosaic.canvas;
  // The markers layer stays at natural canvas size inside the transform; the
  // video's box is set by applyView() every time the view changes.
  tilesEl.style.width = `${width}px`;
  tilesEl.style.height = `${height}px`;
  video.width = width;
  video.height = height;
  video.src = manifest.mosaic.file;

  tiles = buildTiles(tilesEl, manifest, (clip) => {
    replayPath = [];                    // diverging ends the replay
    userTookOver();
    setFocus(clip);
  });
  order = stepOrder(manifest.clips);

  clock = new Clock(video);
  mixer = new Mixer(clock, manifest.audio);
  // Registered once, here rather than on the play button: replaying restarts
  // the clock, and a listener added per run would stack up copies of tick().
  clock.onTick(tick);

  writeGateCopy();
  writeCreditRoll();
  applyView();
  window.addEventListener("resize", applyView);

  const shared = readFragment(window.location.hash);
  if (shared) {
    replayPath = decodePath(shared);
    if (replayPath.length) {
      gateSub.textContent =
        `有人剪過這個瞬間 — 切換 ${replayPath.length} 次。` +
        `按播放，再點任何一格，就變成你的剪法。`;
    }
  }

  // Dynamic, and only on request: a viewer never fetches this file.
  if (new URLSearchParams(window.location.search).has("debug")) {
    import("./diag.js")
      .then((diag) => diag.attach(video, () => clock))
      .catch(() => { /* diagnostics are never worth breaking the page for */ });
  }

  // A failed decode here is not the end of startup. iOS will refuse to decode
  // AAC through Web Audio for a context that has never seen a user gesture --
  // an in-app browser (a link opened inside Messenger, say) is stricter still
  // -- and rejects with EncodingError "Decoding failed" however sound the file
  // is. The same bytes decode after a tap, so the tap is where this is retried:
  // arm the retry, let the button light up, and say nothing to the viewer yet.
  // Dying here instead is what left a phone holding a gate it could not pass.
  try {
    await mixer.load(manifest.audio.master);
  } catch (err) {
    audioError = err;
    console.warn("master track did not decode at boot; retrying on play", err);
  }
  showCollectionCredit(creditEl, creditLink, manifest);

  startButton.disabled = false;
}

/**
 * Load the master track from inside the play gesture, once boot could not.
 *
 * Resolves true when there is a buffer to start. The gate stays up on failure:
 * without audio there is no clock, so there is nothing to show behind it.
 */
async function loadAudioOnGesture() {
  if (mixer.buffer) return true;

  startButton.disabled = true;
  gateSub.textContent = "正在載入音軌…";
  gateDetail.hidden = true;

  await clock.unlock();
  try {
    await mixer.load(manifest.audio.master);
    audioError = null;
    return true;
  } catch (err) {
    audioError = err;
    console.error("master track failed to decode on play", err);
    gateSub.textContent = "音軌載入失敗。再按一次播放試試看，或用 Safari 直接開啟這個網址。";
    showErrorDetail(err);
    startButton.textContent = "再試一次";
    startButton.disabled = false;
    return false;
  }
}

/** The technical line, for a screenshot sent back by someone two cities away. */
function showErrorDetail(err) {
  gateDetail.textContent = err && err.message ? err.message : String(err);
  gateDetail.hidden = false;
}

startButton.addEventListener("click", async () => {
  // Nothing moves until there is a track. The gate is only lifted once the
  // buffer exists, so a retry that fails again has somewhere to say so.
  if (!await loadAudioOnGesture()) return;

  gate.hidden = true;
  hud.hidden = false;
  startButton.disabled = true;

  // The audio decides when t = 0 is; the clock anchors to it and the video is
  // corrected toward the clock. Starting the mixer first and handing its
  // timestamp over is what keeps all three describing the same instant.
  const startedAt = mixer.start(0);
  await clock.start(0, startedAt);
});

replayButton.addEventListener("click", () => { replayFromStart(); });

showCreditsButton.addEventListener("click", openCredits);
closeCreditsButton.addEventListener("click", closeCredits);
// Clicking the backdrop is the other way out of a panel like this.
creditsPanel.addEventListener("click", (event) => {
  if (event.target === creditsPanel) closeCredits();
});

backButton.addEventListener("click", () => {
  replayPath = [];
  userTookOver();
  setFocus(null);
});

prevButton.addEventListener("click", () => step(-1));
nextButton.addEventListener("click", () => step(1));

shareButton.addEventListener("click", async () => {
  const encoded = encodePath(myPath);
  const url = window.location.origin + window.location.pathname + writeFragment(encoded);
  try {
    await navigator.clipboard.writeText(url);
    shareButton.textContent = "已複製";
  } catch (_) {
    window.location.hash = writeFragment(encoded).slice(1);
    shareButton.textContent = "在網址列";
  }
  setTimeout(() => { shareButton.textContent = "複製我的剪法"; }, 2000);
});

document.addEventListener("keydown", (event) => {
  // The panel is on top of everything, so it gets first refusal on Escape.
  if (!creditsPanel.hidden) {
    if (event.key === "Escape") { event.preventDefault(); closeCredits(); }
    return;
  }
  if (!focused || soloLock) return;

  // Down and Escape both mean out. Escape is the convention; Down is where the
  // hand already is once Left and Right are stepping between angles, and it
  // matches the direction of the movement -- back down to the wall.
  if (event.key === "Escape" || event.key === "ArrowDown") {
    event.preventDefault();
    replayPath = [];
    userTookOver();
    setFocus(null);
    return;
  }
  if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
  if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
});

// --- Swipe, the touch equivalent of the two arrows -------------------------
//
// Only armed while a tile is focused: on the wall a horizontal drag means
// nothing, and arming it there would only put a gesture between a finger and
// the tile it is aiming at.

const SWIPE_MIN_PX = 48;
let touchStart = null;
let swiped = false;

stage.addEventListener("touchstart", (event) => {
  touchStart = focused && !soloLock && event.touches.length === 1
    ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
    : null;
}, { passive: true });

stage.addEventListener("touchend", (event) => {
  const start = touchStart;
  touchStart = null;
  if (!start || !focused || soloLock) return;

  const touch = event.changedTouches[0];
  const dx = touch.clientX - start.x;
  const dy = touch.clientY - start.y;
  // Mostly-horizontal and far enough to be a decision, not a wobble.
  if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return;

  swiped = true;
  setTimeout(() => { swiped = false; }, 400);
  step(dx < 0 ? 1 : -1);            // drag the content left to advance
}, { passive: true });

// A tile is a <button>, so a swipe that lifts off over one still synthesises a
// click. Swallow that click rather than let it fight the step we just made.
document.addEventListener("click", (event) => {
  if (!swiped) return;
  swiped = false;
  event.stopPropagation();
  event.preventDefault();
}, true);

// Whatever reaches here is fatal: the manifest, the tiles, the credit roll.
// The audio no longer arrives by this route -- see loadAudioOnGesture().
boot().catch((err) => {
  console.error("boot failed", err);
  gateSub.textContent = "載入失敗。請重新整理這個頁面。";
  showErrorDetail(err);
  startButton.disabled = true;
});
