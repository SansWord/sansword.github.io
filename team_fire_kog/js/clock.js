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

export class Clock {
  constructor(video) {
    this.video = video;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.startedAt = null;
    this.startOffset = 0;
    this.duration = 0;
    this._timer = null;
    this._listeners = new Set();
  }

  async decode(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return this.ctx.decodeAudioData(await response.arrayBuffer());
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
    const step = () => {
      if (!this.running) return;
      const t = this.time;
      for (const fn of this._listeners) fn(t);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  _correct() {
    if (!this.running || this.video.readyState < 2) return;

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
