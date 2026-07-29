/**
 * The master track: one buffer source, one gain node, on the clock's context.
 *
 * The soundtrack is a composed arrangement rendered at build time -- the spine,
 * all nineteen crowd recordings, and a cue sheet that shapes the balance from
 * the singalong through the ribbon burst to the fade. Focusing a tile changes
 * the picture only. Everything that used to live here (per-clip gains,
 * cross-ducking between mix states) is baked into the file the pipeline emits.
 *
 * What is left is playback and volume -- and the rule that no gain change is
 * ever instant, because a step on a running source clicks.
 */

export class Mixer {
  constructor(clock, audioConfig) {
    this.clock = clock;
    this.ctx = clock.ctx;
    this.config = audioConfig;
    this.rampS = audioConfig.ramp_s ?? 0.3;

    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0;              // faded up on start; see start()
    this.gain.connect(this.ctx.destination);

    this.buffer = null;
    this.source = null;
    this.volume = audioConfig.volume ?? 1;
  }

  async load(url) {
    this.buffer = await this.clock.decode(url);
    return this.buffer;
  }

  /**
   * Start the master at wall-relative `offset`. Called once, by main.
   *
   * Returns the context timestamp the track begins at, which is what the clock
   * anchors to -- the audio decides when t = 0 is, and everything else follows.
   * Called while the context is still suspended, that timestamp is the moment
   * it resumes, so the two agree to within a render quantum.
   */
  start(offset = 0) {
    if (!this.buffer) throw new Error("mixer.load() must finish before start()");
    this.stop();

    const startedAt = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.gain);
    source.start(startedAt, Math.max(0, offset));
    this.source = source;

    // From silence, not from full: starting a decoded buffer mid-waveform is a
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
    if (!this.source) return;
    const source = this.source;
    this.source = null;
    this._ramp(0);
    // Let the ramp finish before tearing the node down, or it clicks anyway.
    setTimeout(() => {
      try { source.stop(); } catch (_) { /* already stopped */ }
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
