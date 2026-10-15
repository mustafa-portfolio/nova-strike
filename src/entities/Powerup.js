import { CONFIG } from '../config.js';

export class Powerup {
  constructor() {
    this.reset();
  }

  reset() {
    this.type = 'weapon';
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = CONFIG.POWERUPS.SPEED;
    this.radius = CONFIG.POWERUPS.RADIUS;
    this.time = 0;
  }

  init(type = 'weapon', x = 0, y = 0) {
    this.reset();
    this.type = type || 'weapon';
    this.x = x;
    this.y = y;
  }

  update(dt, player) {
    this.time += dt;

    // Check if player has active magnet power-up or is close
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    const isMagnetized = player.magnetTimer > 0 || dist < 60;

    if (isMagnetized) {
      // Rapid magnetic pull towards player
      const speed = CONFIG.POWERUPS.MAGNET_SPEED;
      this.vx = (dx / dist) * speed;
      this.vy = (dy / dist) * speed;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    } else {
      // Gentle downward drift with slight horizontal sway
      this.x += Math.sin(this.time * 2.5) * 20 * dt;
      this.y += this.vy * dt;
    }

    // Out of bounds check
    return this.y <= CONFIG.CANVAS_HEIGHT + 30;
  }
}
