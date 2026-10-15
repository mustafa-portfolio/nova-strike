import { CONFIG } from '../config.js';

export class AudioService {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.hapticsEnabled = true;
    this.isUnlocked = false;

    // Load persisted settings
    try {
      const savedMute = localStorage.getItem(CONFIG.STORAGE_KEYS.SOUND_ENABLED);
      if (savedMute !== null) {
        this.isMuted = savedMute === 'false';
      }
      const savedHaptics = localStorage.getItem(CONFIG.STORAGE_KEYS.HAPTICS_ENABLED);
      if (savedHaptics !== null) {
        this.hapticsEnabled = savedHaptics === 'true';
      }
    } catch {
      // Storage access may fail in private mode
    }

    // Noise buffer for realistic explosions
    this.noiseBuffer = null;
  }

  unlock() {
    if (this.isUnlocked) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // Generate 1-second white noise buffer for explosions & thruster effects
      const bufferSize = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.isUnlocked = true;
    } catch {
      // Web Audio unsupported or locked
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.SOUND_ENABLED, (!muted).toString());
    } catch {}
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return !this.isMuted;
  }

  setHaptics(enabled) {
    this.hapticsEnabled = enabled;
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.HAPTICS_ENABLED, enabled.toString());
    } catch {}
  }

  toggleHaptics() {
    this.setHaptics(!this.hapticsEnabled);
    if (this.hapticsEnabled) {
      this.vibrate(30);
    }
    return this.hapticsEnabled;
  }

  vibrate(pattern) {
    if (!this.hapticsEnabled) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  // --- Sound Synthesis Routines ---

  playLaser(tier = 1) {
    if (!this.isUnlocked || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = tier >= 3 ? 'triangle' : 'sawtooth';
    const baseFreq = tier === 1 ? 880 : tier === 2 ? 1050 : 1200;
    
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playMissileLaunch() {
    if (!this.isUnlocked || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playEnemyLaser() {
    if (!this.isUnlocked || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  playHit() {
    if (!this.isUnlocked || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.04);

    this.vibrate(12);
  }

  playExplosionSmall() {
    if (!this.isUnlocked || this.isMuted || !this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    // Filtered noise
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.3);

    this.vibrate(25);
  }

  playExplosionLarge() {
    if (!this.isUnlocked || this.isMuted || !this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    // Noise layer
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + 0.7);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    // Deep sub bass oscillator layer
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, now);
    sub.frequency.exponentialRampToValueAtTime(30, now + 0.6);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.5, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.7);
    sub.start(now);
    sub.stop(now + 0.6);

    this.vibrate([40, 30, 80]);
  }

  playPowerup() {
    if (!this.isUnlocked || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Fast 3-note ascending arpeggio (C6 - E6 - G6)
    const notes = [1046.5, 1318.5, 1567.98];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.2, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.12);
    });

    this.vibrate([15, 20, 25]);
  }

  playShieldAbsorb() {
    if (!this.isUnlocked || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);

    this.vibrate(35);
  }

  playBomb() {
    if (!this.isUnlocked || this.isMuted || !this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    // Resonant EMP rumble
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3;
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 1.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 1.2);

    this.vibrate([70, 40, 120, 50, 180]);
  }

  playBossWarning() {
    if (!this.isUnlocked || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Dual-tone klaxon alarm siren
    [0, 0.45, 0.9, 1.35].forEach((offset) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now + offset);
      osc.frequency.linearRampToValueAtTime(640, now + offset + 0.3);

      gain.gain.setValueAtTime(0.25, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + offset);
      osc.stop(now + offset + 0.35);
    });

    this.vibrate([100, 50, 100, 50, 100]);
  }

  playPlayerHit() {
    if (!this.isUnlocked || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);

    this.vibrate([60, 40, 90]);
  }

  playGameOver() {
    if (!this.isUnlocked || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const notes = [440, 392, 349.2, 293.66, 220];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.16);

      gain.gain.setValueAtTime(0.25, now + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 0.28);
    });
  }

  playCombo(count) {
    if (!this.isUnlocked || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Frequency rises with combo count up to 1800Hz
    const freq = Math.min(1800, 550 + count * 60);
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }
}
