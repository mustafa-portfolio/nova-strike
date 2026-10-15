import { CONFIG } from '../config.js';

export class Enemy {
  constructor() {
    this.reset();
  }

  reset() {
    this.type = 'scout';
    this.x = 0;
    this.y = 0;
    this.startX = 0;
    this.hp = 1;
    this.maxHp = 1;
    this.speed = 100;
    this.hitboxRadius = 16;
    this.score = 100;
    this.dropChance = 0.2;
    this.rotation = 0;

    this.hitFlashTimer = 0;
    this.time = 0;
    this.fireTimer = 0;

    // Type-specific state
    this.amplitude = 0;
    this.frequency = 0;
    this.isDiving = false;
    this.diveTargetX = 0;
    this.diveTargetY = 0;
    this.diveAngle = 0;
    this.trackTimer = 0;
  }

  init(type = 'scout', x = 0, y = 0, options = {}) {
    this.reset();
    this.type = type || 'scout';
    this.x = x;
    this.y = y;
    this.startX = x;

    const key = (this.type || 'scout').toUpperCase();
    const cfg = CONFIG.ENEMIES[key] || CONFIG.ENEMIES.SCOUT;
    this.hp = options.hp || cfg.hp;
    this.maxHp = this.hp;
    this.speed = options.speed || cfg.speed;
    this.hitboxRadius = cfg.hitboxRadius;
    this.score = cfg.score;
    this.dropChance = cfg.dropChance;

    if (type === 'zigzag') {
      this.amplitude = options.amplitude || cfg.amplitude;
      this.frequency = options.frequency || cfg.frequency;
    } else if (type === 'gunship') {
      this.fireTimer = options.fireInterval || cfg.fireInterval;
    } else if (type === 'kamikaze') {
      this.trackTimer = cfg.trackDuration;
      this.isDiving = false;
    }
  }

  update(dt, player, bulletPool, audio) {
    this.time += dt;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    switch (this.type) {
      case 'scout':
        this.y += this.speed * dt;
        break;

      case 'zigzag':
        this.y += this.speed * dt;
        this.x = this.startX + Math.sin(this.time * this.frequency) * this.amplitude;
        // Clamp to screen edges
        this.x = Math.max(20, Math.min(CONFIG.CANVAS_WIDTH - 20, this.x));
        // Rotate into turn
        this.rotation = Math.cos(this.time * this.frequency) * 0.25;
        break;

      case 'gunship':
        // Descend to combat height, then patrol horizontally
        if (this.y < 160) {
          this.y += this.speed * dt;
        } else {
          this.x += Math.sin(this.time * 1.5) * 60 * dt;
          this.y += 15 * dt; // Slow creeping advance
        }

        // Fire aimed plasma burst at player
        this.fireTimer -= dt;
        if (this.fireTimer <= 0 && this.y > 40 && this.y < CONFIG.CANVAS_HEIGHT * 0.75) {
          this.fireTimer = CONFIG.ENEMIES.GUNSHIP.fireInterval;
          const dx = player.x - this.x;
          const dy = player.y - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          const bSpeed = CONFIG.ENEMIES.GUNSHIP.bulletSpeed;

          // Dual cannon shot
          [-14, 14].forEach((ox) => {
            const b = bulletPool.obtain();
            b.initEnemyBullet(this.x + ox, this.y + 16, (dx / dist) * bSpeed, (dy / dist) * bSpeed, 5, 1);
          });

          audio.playEnemyLaser();
        }
        break;

      case 'kamikaze':
        if (!this.isDiving) {
          this.y += this.speed * 0.45 * dt;
          this.trackTimer -= dt;

          // Track player X position before committing
          this.x += (player.x - this.x) * 2.5 * dt;

          if (this.trackTimer <= 0) {
            // Lock target and begin high-speed dive
            this.isDiving = true;
            this.diveTargetX = player.x;
            this.diveTargetY = player.y;
            this.diveAngle = Math.atan2(this.diveTargetY - this.y, this.diveTargetX - this.x);
            this.rotation = this.diveAngle - Math.PI / 2;
          }
        } else {
          // Dive in committed direction with afterburner speed
          this.x += Math.cos(this.diveAngle) * this.speed * dt;
          this.y += Math.sin(this.diveAngle) * this.speed * dt;
        }
        break;
    }

    // Return false if out of arena
    const isOffscreen = this.y > CONFIG.CANVAS_HEIGHT + 50 || this.x < -60 || this.x > CONFIG.CANVAS_WIDTH + 60;
    return !isOffscreen;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlashTimer = 0.08;
    return this.hp <= 0;
  }
}
