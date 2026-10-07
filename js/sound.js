/**
 * sound.js - Lightweight Web Audio API synthesizer for playful UI SFX
 * Works 100% offline with zero external audio assets.
 */

class SoundEffects {
  constructor() {
    this.ctx = null;
    this._initialized = false;
  }

  _initContext() {
    if (!this._initialized) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
          this._initialized = true;
        }
      } catch (e) {
        console.warn('Web Audio API not supported in this browser.', e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  isEnabled() {
    return window.db ? window.db.isSoundEnabled() : true;
  }

  playPop() {
    if (!this.isEnabled()) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  playSelect() {
    if (!this.isEnabled()) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  playSuccess() {
    if (!this.isEnabled()) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const start = now + idx * 0.09;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch (e) {}
  }

  playFanfare() {
    if (!this.isEnabled()) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Arpeggio chord with celebratory vibe
      const melody = [
        { f: 523.25, t: 0.0, d: 0.12 }, // C5
        { f: 659.25, t: 0.12, d: 0.12 }, // E5
        { f: 783.99, t: 0.24, d: 0.12 }, // G5
        { f: 1046.50, t: 0.36, d: 0.45 }, // C6
        { f: 880.00, t: 0.50, d: 0.15 }, // A5
        { f: 1046.50, t: 0.65, d: 0.60 }  // C6 long
      ];

      melody.forEach(item => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const start = now + item.t;
        osc.frequency.setValueAtTime(item.f, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + item.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + item.d);
      });
    } catch (e) {}
  }

  playWhoosh() {
    if (!this.isEnabled()) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }
}

window.sfx = new SoundEffects();
