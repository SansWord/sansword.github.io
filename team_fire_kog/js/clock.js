/**
 * The AudioContext is the master clock. The video follows it.
 *
 * ctx.currentTime is a monotonic, sample-derived clock; video.currentTime is
 * whatever the decoder managed. Making the audio authoritative and correcting
 * the muted mosaic toward it means the picture can drift by a frame, but the
 * playhead every other part of the page reads -- tile light-up, viewer-path
 * replay -- never does.
 */

const NUDGE_THRESHOLD_S = 0.033;   // one frame at 30fps
const SEEK_THRESHOLD_S = 0.25;
const MAX_RATE_TRIM = 0.05;
const CORRECT_INTERVAL_MS = 250;

// A seek is not free. It sends the decoder back to the previous keyframe and
// makes it decode forward to the target, which on a phone already at its limit
// costs more time than the gap being corrected -- so it falls further behind,
// seeks again, and locks up. Measured on an A12-class iPhone: the picture ran
// at ~5 fps and froze. The cooldown makes a struggling decoder drift instead,
// which is what the design can afford: the audio is the clock, and a picture a
// few frames late is worth far more than a picture that has stopped.
const SEEK_COOLDOWN_MS = 3000;

export class Clock {
  constructor(video) {
    this.video = video;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.startedAt = null;
    this.startOffset = 0;
    this.duration = 0;
    this.seeks = 0;               // read by the ?debug=1 panel
    this._timer = null;
    this._lastSeekAt = 0;
    this._generation = 0;         // see _raf()
    this._listeners = new Set();
  }

  /**
   * Resume the context from inside a user gesture, before the track starts.
   *
   * A context built at load time is suspended, and everything the mixer feeds
   * into it lands in silence until it is running. iOS only allows the resume
   * from a tap. Calling this outside a gesture is harmless and does nothing.
   */
  async unlock() {
    try { await this.ctx.resume(); } catch (_) { /* start() surfaces the failure */ }
    return this.ctx.state;
  }

  /** Wall-relative playhead in seconds. */
  get time() {
    if (this.startedAt === null) return this.startOffset;
    return this.startOffset + (this.ctx.currentTime - this.startedAt);
  }

  get running() {
    return this.startedAt !== null;
  }

  onTick(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  /**
   * `when` is the context timestamp the clock treats as t = offset. Pass the
   * value `Mixer.start()` returned: the clock must be anchored to the instant
   * the audio actually began, not to the instant this function was reached.
   * Reading ctx.currentTime here instead would set the anchor before the
   * awaited video.play() below, so the master track would start however long
   * that took *after* t = 0 and stay there -- and nothing corrects the audio,
   * only the video, so the gap would be permanent.
   */
  async start(offset = 0, when = null) {
    await this.ctx.resume();
    this.startOffset = offset;

    // A non-finite anchor does not throw; it poisons every comparison made
    // against the playhead. `t >= enter_s` is false, so no tile is ever live;
    // the solo rule never fires; `t >= duration_s` is false, so the wall never
    // ends. The page looks alive -- sound playing, picture moving -- and is
    // wired to nothing. Refuse it loudly and anchor to now instead.
    if (when !== null && !Number.isFinite(when)) {
      console.error("clock: refused a non-finite anchor, using now instead", when);
      when = null;
    }
    this.startedAt = when === null ? this.ctx.currentTime : when;

    this.video.currentTime = offset;
    // A rejected play() must not abort startup. Chrome pauses muted,
    // video-only media in a backgrounded tab and rejects the pending play()
    // with AbortError; letting that throw here would skip the correction timer
    // and the rAF loop below, so the page would come back to a dead player
    // rather than a stalled picture. The audio is the clock and is already
    // running -- _correct() retries the video.
    await this.video.play().catch(() => {});

    this._timer = setInterval(() => this._correct(), CORRECT_INTERVAL_MS);
    this._raf();
    return this.time;
  }

  stop() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    this.startedAt = null;
    this.video.pause();
    this.video.playbackRate = 1;
  }

  _raf() {
    // The next frame is scheduled after the listeners run, so a listener that
    // stops the clock -- which is how the wall now ends -- leaves one frame
    // already pending. Restart inside that frame and the old loop would find
    // `running` true again and keep going alongside the new one, ticking
    // everything twice. The generation makes a restart disown the old loop.
    const generation = ++this._generation;
    const step = () => {
      if (!this.running || generation !== this._generation) return;
      const t = this.time;
      for (const fn of this._listeners) fn(t);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  _correct() {
    if (!this.running || this.video.readyState < 2) return;

    // An ended element is not a stalled one. play() on it seeks back to 0 and
    // starts over -- which is how the wall used to loop silently once the
    // picture ran out, since the audio buffer source does not come back with
    // it. Whoever owns the timeline decides what happens at the end; the
    // corrector's job stops here.
    if (this.video.ended) return;

    // The tab was backgrounded, or the OS paused the video to save power. The
    // sound never stopped, so recovery is to jump the picture to where the
    // sound now is and start it again -- not to nudge it back over minutes.
    if (this.video.paused) {
      this.video.currentTime = this.time;
      this.video.playbackRate = 1;
      this.video.play().catch(() => {});
      return;
    }

    const error = this.video.currentTime - this.time;
    const magnitude = Math.abs(error);

    if (magnitude > SEEK_THRESHOLD_S) {
      // A stall or a backgrounded tab. Nudging would take minutes to recover.
      // Note this branch is the one that needs the host to answer HTTP Range:
      // `python -m http.server` does not, and a seek there silently snaps back
      // to what is already buffered, so drift never recovers locally.
      //
      // Rate-limited: see SEEK_COOLDOWN_MS. A decoder that cannot hold 30 fps
      // re-earns this gap within a frame or two, and seeking every 250 ms is
      // how the picture stops altogether.
      if (performance.now() - this._lastSeekAt < SEEK_COOLDOWN_MS) return;
      this._lastSeekAt = performance.now();
      this.seeks += 1;
      this.video.currentTime = this.time;
      this.video.playbackRate = 1;
      return;
    }

    if (magnitude > NUDGE_THRESHOLD_S) {
      // Proportional trim. Inaudible because the video carries no audio.
      const trim = Math.max(-MAX_RATE_TRIM, Math.min(MAX_RATE_TRIM, error));
      this.video.playbackRate = 1 - trim;
      return;
    }

    if (this.video.playbackRate !== 1) this.video.playbackRate = 1;
  }
}
