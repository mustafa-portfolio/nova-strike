import { CONFIG } from '../config.js';

export class Input {
  constructor(viewport, onBombTriggered, onAudioUnlock) {
    this.viewport = viewport;
    this.onBombTriggered = onBombTriggered;
    this.onAudioUnlock = onAudioUnlock;

    // Movement state in virtual coordinates
    this.targetX = CONFIG.CANVAS_WIDTH / 2;
    this.targetY = CONFIG.CANVAS_HEIGHT * 0.8;
    this.isInteracting = false;
    this.isFiring = false;

    // Relative movement for keyboard
    this.keyState = {
      up: false,
      down: false,
      left: false,
      right: false
    };

    // Primary touch tracking
    this.primaryTouchId = null;
    this.touchAnchorOffset = { x: 0, y: 0 };
    this.lastTouchCount = 0;

    // Desktop mouse tracking
    this.isMouseDown = false;

    this.bindEvents();
  }

  bindEvents() {
    // Prevent iOS Safari gestures & long presses
    const preventAll = (e) => {
      if (e.cancelable) e.preventDefault();
    };

    window.addEventListener('contextmenu', preventAll, { passive: false });
    window.addEventListener('gesturestart', preventAll, { passive: false });
    window.addEventListener('gesturechange', preventAll, { passive: false });
    window.addEventListener('gestureend', preventAll, { passive: false });

    // Touch events
    window.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    window.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });

    // Mouse events
    window.addEventListener('mousedown', this.handleMouseDown.bind(this), { passive: false });
    window.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: false });
    window.addEventListener('mouseup', this.handleMouseUp.bind(this), { passive: false });

    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // HTML Bomb button
    const bombBtn = document.getElementById('btn-bomb');
    if (bombBtn) {
      bombBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.unlockAudio();
        if (this.onBombTriggered) this.onBombTriggered();
      }, { passive: false });
    }
  }

  unlockAudio() {
    if (this.onAudioUnlock) {
      this.onAudioUnlock();
    }
  }

  handleTouchStart(e) {
    this.unlockAudio();

    // Check for 2nd finger tap to detonate bomb!
    if (e.touches.length >= 2 && this.lastTouchCount < 2) {
      if (this.onBombTriggered) {
        this.onBombTriggered();
      }
    }
    this.lastTouchCount = e.touches.length;

    // Don't override primary ship touch if hitting UI buttons directly
    if (e.target.closest('#touch-controls') || e.target.closest('#ui-overlay')) {
      return;
    }

    if (e.cancelable) e.preventDefault();

    if (this.primaryTouchId === null && e.touches.length > 0) {
      const touch = e.touches[0];
      this.primaryTouchId = touch.identifier;
      this.isInteracting = true;
      this.isFiring = true;

      const pos = this.viewport.screenToVirtual(touch.clientX, touch.clientY);
      // Place target with vertical offset above finger
      this.targetX = pos.x;
      this.targetY = pos.y + CONFIG.CONTROLS.TOUCH_OFFSET_Y;
    }
  }

  handleTouchMove(e) {
    if (e.cancelable) e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.primaryTouchId) {
        const pos = this.viewport.screenToVirtual(touch.clientX, touch.clientY);
        this.targetX = pos.x;
        this.targetY = pos.y + CONFIG.CONTROLS.TOUCH_OFFSET_Y;
        this.isInteracting = true;
        this.isFiring = true;
        break;
      }
    }
  }

  handleTouchEnd(e) {
    this.lastTouchCount = e.touches.length;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.primaryTouchId) {
        this.primaryTouchId = null;
        this.isInteracting = false;
        this.isFiring = false;
        break;
      }
    }

    // If another finger remains, re-assign as primary
    if (this.primaryTouchId === null && e.touches.length > 0) {
      const touch = e.touches[0];
      this.primaryTouchId = touch.identifier;
      this.isInteracting = true;
      this.isFiring = true;
      const pos = this.viewport.screenToVirtual(touch.clientX, touch.clientY);
      this.targetX = pos.x;
      this.targetY = pos.y + CONFIG.CONTROLS.TOUCH_OFFSET_Y;
    }
  }

  handleMouseDown(e) {
    this.unlockAudio();
    if (e.target.closest('#touch-controls') || e.target.closest('#ui-overlay')) {
      return;
    }
    if (e.button === 0) { // Left click
      this.isMouseDown = true;
      this.isInteracting = true;
      this.isFiring = true;
      const pos = this.viewport.screenToVirtual(e.clientX, e.clientY);
      this.targetX = pos.x;
      this.targetY = pos.y + CONFIG.CONTROLS.TOUCH_OFFSET_Y;
    }
  }

  handleMouseMove(e) {
    if (this.isMouseDown) {
      const pos = this.viewport.screenToVirtual(e.clientX, e.clientY);
      this.targetX = pos.x;
      this.targetY = pos.y + CONFIG.CONTROLS.TOUCH_OFFSET_Y;
    }
  }

  handleMouseUp(e) {
    if (e.button === 0) {
      this.isMouseDown = false;
      this.isInteracting = false;
      this.isFiring = false;
    }
  }

  handleKeyDown(e) {
    this.unlockAudio();

    if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keyState.up = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keyState.down = true;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keyState.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keyState.right = true;

    // Bomb trigger via Space or B
    if (e.code === 'Space' || e.code === 'KeyB') {
      e.preventDefault();
      if (this.onBombTriggered) this.onBombTriggered();
    }
  }

  handleKeyUp(e) {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keyState.up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keyState.down = false;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keyState.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keyState.right = false;
  }

  updateKeyboard(dt, currentX, currentY) {
    let dx = 0;
    let dy = 0;

    if (this.keyState.up) dy -= 1;
    if (this.keyState.down) dy += 1;
    if (this.keyState.left) dx -= 1;
    if (this.keyState.right) dx += 1;

    if (dx !== 0 || dy !== 0) {
      // Normalize diagonal vector
      const len = Math.hypot(dx, dy);
      const speed = CONFIG.CONTROLS.KEYBOARD_SPEED * dt;
      this.targetX = Math.max(20, Math.min(CONFIG.CANVAS_WIDTH - 20, currentX + (dx / len) * speed));
      this.targetY = Math.max(30, Math.min(CONFIG.CANVAS_HEIGHT - 30, currentY + (dy / len) * speed));
      this.isInteracting = true;
      this.isFiring = true;
    }
  }

  reset() {
    this.isInteracting = false;
    this.isFiring = false;
    this.isMouseDown = false;
    this.primaryTouchId = null;
    this.keyState = { up: false, down: false, left: false, right: false };
    this.targetX = CONFIG.CANVAS_WIDTH / 2;
    this.targetY = CONFIG.CANVAS_HEIGHT * 0.8;
  }
}
