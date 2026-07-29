/**
 * The master track: one media element, streamed through one gain node, on the
 * clock's context.
 *
 * The soundtrack is a composed arrangement rendered at build time -- the spine,
 * all nineteen crowd recordings, and a cue sheet that shapes the balance from
 * the singalong through the ribbon burst to the fade. Focusing a tile changes
 * the picture only. Everything that used to live here (per-clip gains,
 * cross-ducking between mix states) is baked into the file the pipeline emits.
 *
 * What is left is playback and volume -- and the rule that no gain change is
 * ever instant, because a step on a running source clicks.
 *
 * **It streams; it is not decoded into a buffer.** decodeAudioData used to load
 * it, which meant inflating 140 s of stereo into ~54 MB of float RAM (more,
 * where the context runs at 48 kHz and the file is 44.1, because the whole
 * thing is resampled on the way in). An iPhone 15 refused: EncodingError
 * "Decoding failed", with the full 3,400,579 bytes present and the context
 * already running, so neither the network nor the missing user gesture explained
 * it. A media element streams the same file through the same graph with none of
 * that allocation, and it is the path that phone was already playing video
 * through. What it gives up is the sample-lock: an AudioBufferSourceNode cannot
 * drift from ctx.currentTime, and an element can. Measured over the full track
 * it stays inside a few milliseconds, which is under the corrector's one-frame
 * threshold -- see the v1.1.0 devlog entry before assuming that is free.
 */

/** MediaError codes carry no message of their own worth showing. */
const MEDIA_ERRORS = {
  1: "MEDIA_ERR_ABORTED (fetch aborted)",
  2: "MEDIA_ERR_NETWORK (network failed mid-download)",
  3: "MEDIA_ERR_DECODE (decoder refused the bytes)",
  4: "MEDIA_ERR_SRC_NOT_SUPPORTED (format or URL not usable)",
};

function describe(el, url) {
  const error = el.error;
  const code = error ? MEDIA_ERRORS[error.code] || `code ${error.code}` : "no error set";
  const detail = error && error.message ? `: ${error.message}` : "";
  return `${url}: ${code}${detail} [readyState ${el.readyState}, network ${el.networkState}]`;
}

/**
 * Resolve once the element knows its own position: metadata in, and a
 * `currentTime` that is actually a number.
 *
 * Bounded, and resolves either way. A clock anchored a beat late is a few
 * milliseconds of drift the corrector absorbs; a start that never happens is a
 * dead page, and the caller has a fallback for the position anyway.
 */
function positionKnown(el, timeoutMs = 2000) {
  const usable = () => el.readyState >= 1 && Number.isFinite(el.currentTime);
  if (usable()) return Promise.resolve(true);

  return new Promise((resolve) => {
    const check = () => { if (usable()) finish(true); };
    const finish = (value) => {
      clearTimeout(timer);
      for (const type of ["loadedmetadata", "loadeddata", "timeupdate", "playing"]) {
        el.removeEventListener(type, check);
      }
      resolve(value);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    for (const type of ["loadedmetadata", "loadeddata", "timeupdate", "playing"]) {
      el.addEventListener(type, check);
    }
  });
}

export class Mixer {
  constructor(clock, audioConfig) {
    this.clock = clock;
    this.ctx = clock.ctx;
    this.config = audioConfig;
    this.rampS = audioConfig.ramp_s ?? 0.3;

    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0;              // faded up on start; see start()
    this.gain.connect(this.ctx.destination);

    this.el = null;
    this.source = null;                    // MediaElementAudioSourceNode
    this.volume = audioConfig.volume ?? 1;
  }

  /** True once there is an element wired into the graph to start. */
  get ready() {
    return this.el !== null;
  }

  /**
   * Attach the track and wire it into the graph. Does **not** wait for the
   * audio to be playable.
   *
   * iOS will not fetch media before a user gesture however preload is set, so
   * waiting for `canplay` here would hang on exactly the devices this exists
   * for -- and the play button, which is the gesture, only appears once this
   * resolves. Buffering is start()'s problem, inside the tap.
   */
  async load(url) {
    const el = new Audio();
    el.preload = "auto";                   // honoured on desktop, ignored on iOS
    el.src = url;
    // Same origin, so the graph gets real samples. A tainted cross-origin
    // element feeds createMediaElementSource silence, which would look exactly
    // like a mixing bug.
    el.load();

    this.el = el;
    this.source = this.ctx.createMediaElementSource(el);
    this.source.connect(this.gain);
    this.url = url;
    return el;
  }

  /**
   * Start the master at wall-relative `offset`, from inside a user gesture.
   *
   * Returns the context timestamp the track began at, which is what the clock
   * anchors to -- the audio decides when t = 0 is, and everything else follows.
   * The anchor is read after playback is actually running and is derived from
   * the element's own position, so the clock describes where the sound is
   * rather than when this function happened to be called.
   *
   * Rejects if the element cannot play. The caller keeps the gate up: without
   * audio there is no clock.
   */
  async start(offset = 0) {
    if (!this.el) throw new Error("mixer.load() must run before start()");
    const el = this.el;
    const at = Math.max(0, offset);

    // A replay arrives here on an ended element; currentTime is how it rewinds.
    if (Math.abs(el.currentTime - at) > 0.01) el.currentTime = at;

    // An element that already failed stays failed: play() on it does not
    // re-fetch, and the listener below would wait for an `error` event that
    // already happened. Reattaching the source is what makes the retry button
    // mean anything. The source node follows the element, so the graph stays
    // wired -- and a second createMediaElementSource on it would throw.
    if (el.error) {
      el.src = this.url;
      el.load();
      if (at > 0) el.currentTime = at;
    }

    const failed = new Promise((_resolve, reject) => {
      el.addEventListener("error", () => reject(new Error(describe(el, this.url))),
                          { once: true });
    });
    // play() rejects on an autoplay refusal but stays pending through a slow
    // network, and a decode failure arrives as an `error` event rather than a
    // rejection -- so both routes have to be raced.
    await Promise.race([el.play(), failed]);

    // The anchor is only meaningful once the element can say where it is. On
    // iOS play() resolves while the element is still at HAVE_NOTHING, and its
    // currentTime there is not a usable number -- which made the anchor NaN,
    // and then the clock. Nothing throws: every comparison against a NaN
    // playhead is simply false, so no tile was ever live, the solo rule never
    // fired, the wall never reached its end card, and the sound played on over
    // a still, silent-looking grid. That is what an iPhone 15 showed as
    // "0 個視角播放中".
    await Promise.race([positionKnown(el), failed]);
    const position = Number.isFinite(el.currentTime) ? el.currentTime : at;
    const startedAt = this.ctx.currentTime - (position - at);

    // From silence, not from full: entering a waveform mid-flight is a
    // discontinuity like any other.
    this._ramp(this.volume);
    return startedAt;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this._ramp(this.volume);
    return this.volume;
  }

  stop() {
    if (!this.el) return;
    const el = this.el;
    this._ramp(0);
    // Let the ramp finish before the sound is cut, or it clicks anyway. The
    // element is kept, wired and loaded: a replay reuses it, and a second
    // createMediaElementSource on the same element is not allowed.
    setTimeout(() => {
      if (this.el === el && el.paused === false) el.pause();
    }, this.rampS * 1000 + 60);
  }

  _ramp(value) {
    const now = this.ctx.currentTime;
    const param = this.gain.gain;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + this.rampS);
  }
}
