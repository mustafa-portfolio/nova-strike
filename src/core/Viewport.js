import { CONFIG } from '../config.js';

export class Viewport {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    
    this.logicalWidth = CONFIG.CANVAS_WIDTH;
    this.logicalHeight = CONFIG.CANVAS_HEIGHT;

    this.scale = 1;
    this.dpr = 1;
    this.displayWidth = 0;
    this.displayHeight = 0;
    this.offsetLeft = 0;
    this.offsetTop = 0;

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize, { passive: true });
    window.addEventListener('orientationchange', this.resize, { passive: true });
    this.resize();
  }

  resize() {
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;

    // Cap DPR to 2.5 for mobile performance & battery efficiency while maintaining retina sharpness
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    // Maintain aspect ratio while scaling to maximum visible area
    const scaleX = windowW / this.logicalWidth;
    const scaleY = windowH / this.logicalHeight;
    this.scale = Math.min(scaleX, scaleY);

    this.displayWidth = Math.round(this.logicalWidth * this.scale);
    this.displayHeight = Math.round(this.logicalHeight * this.scale);

    this.canvas.style.width = `${this.displayWidth}px`;
    this.canvas.style.height = `${this.displayHeight}px`;

    // Real pixel buffer dimensions
    this.canvas.width = Math.round(this.displayWidth * this.dpr);
    this.canvas.height = Math.round(this.displayHeight * this.dpr);

    // Update screen offset bounds
    const rect = this.canvas.getBoundingClientRect();
    this.offsetLeft = rect.left;
    this.offsetTop = rect.top;
  }

  prepareContext() {
    // Re-apply scale transform to 2D context every frame or after resize
    this.ctx.setTransform(this.scale * this.dpr, 0, 0, this.scale * this.dpr, 0, 0);
  }

  // Convert raw client touch/mouse coordinates into virtual game coordinates
  screenToVirtual(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;

    const vx = px / this.scale;
    const vy = py / this.scale;

    return {
      x: Math.max(0, Math.min(this.logicalWidth, vx)),
      y: Math.max(0, Math.min(this.logicalHeight, vy)),
      inside: px >= 0 && px <= rect.width && py >= 0 && py <= rect.height
    };
  }
}
