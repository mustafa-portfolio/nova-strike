import { CONFIG } from '../config.js';

export class Loop {
  constructor(updateFn, renderFn, onAutoPause) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.onAutoPause = onAutoPause;

    this.fixedDelta = CONFIG.FIXED_STEP;
    this.maxFrameTime = CONFIG.MAX_FRAME_TIME;
    
    this.lastTime = 0;
    this.accumulator = 0;
    this.timeScale = 1.0;
    this.isRunning = false;
    this.isPaused = false;
    this.rafId = null;

    this.tick = this.tick.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);

    window.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('blur', this.handleBlur);
  }

  handleVisibilityChange() {
    if (document.hidden && this.isRunning && !this.isPaused) {
      if (this.onAutoPause) this.onAutoPause();
    }
  }

  handleBlur() {
    if (this.isRunning && !this.isPaused) {
      if (this.onAutoPause) this.onAutoPause();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  setTimeScale(scale) {
    this.timeScale = Math.max(0.05, Math.min(2.0, scale));
  }

  tick(currentTime) {
    if (!this.isRunning) return;

    this.rafId = requestAnimationFrame(this.tick);

    if (this.isPaused) {
      this.lastTime = currentTime;
      return;
    }

    // Delta time in seconds
    let frameTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Prevent spiral of death on huge lag spike or tab switch
    if (frameTime > this.maxFrameTime) {
      frameTime = this.maxFrameTime;
    }

    // Accumulate time multiplied by timeScale (e.g. slow motion)
    this.accumulator += frameTime * this.timeScale;

    // Fixed timestep updates
    let steps = 0;
    while (this.accumulator >= this.fixedDelta && steps < 5) {
      this.updateFn(this.fixedDelta);
      this.accumulator -= this.fixedDelta;
      steps++;
    }

    // Render frame
    const alpha = this.accumulator / this.fixedDelta;
    this.renderFn(alpha);
  }

  destroy() {
    this.stop();
    window.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('blur', this.handleBlur);
  }
}
