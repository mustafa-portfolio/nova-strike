import { CONFIG } from '../config.js';

export class Boss {
  constructor() {
    this.reset();
  }

  reset() {
    this._active = false;
    this.x = CONFIG.CANVAS_WIDTH / 2;
    this.y = -120;
    this.targetY = 150;
    this.hp = CONFIG.BOSS.BASE_HP;
    this.maxHp = CONFIG.BOSS.BASE_HP;
    this.phase = 1; // 1, 2, or 3
    this.isVulnerable = false;
    this.hitboxRadius = CONFIG.BOSS.HITBOX_RADIUS;
    this.hitFlashTimer = 0;
    this.time = 0;

    // Pattern Timers
    this.attackTimer = 0;
    this.spiralAngle = 0;
    this.secondaryTimer = 0;

    // State
    this.isEntering = false;
    this.isDying = false;
    this.deathTimer = 0;
  }

  spawn(waveNumber) {
    this.reset();
    this._active = true;
    this.isEntering = true;
    this.isVulnerable = false;

    // Scale HP with wave cycle
    const cycle = Math.floor(waveNumber / CONFIG.BOSS.INTERVAL_WAVES);
    this.maxHp = CONFIG.BOSS.BASE_HP + (cycle - 1) * CONFIG.BOSS.HP_PER_CYCLE;
    this.hp = this.maxHp;
    this.phase = 1;
    this.x = CONFIG.CANVAS_WIDTH / 2;
    this.y = -120;
  }

  update(dt, player, bulletPool, audio, particles, onDeathComplete) {
    if (!this._active) return;
    this.time += dt;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    // Dying animation: cascading explosions across hull
    if (this.isDying) {
      this.deathTimer -= dt;
      if (Math.random() < 0.6) {
        const ox = (Math.random() * 2 - 1) * 60;
        const oy = (Math.random() * 2 - 1) * 35;
        particles.spawnExplosion(this.x + ox, this.y + oy, 0.7);
        audio.playExplosionSmall();
      }

      if (this.deathTimer <= 0) {
        this._active = false;
        this.isDying = false;
        if (onDeathComplete) onDeathComplete(this);
      }
      return;
    }

    // Entrance descent
    if (this.isEntering) {
      this.y += 65 * dt;
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.isEntering = false;
        this.isVulnerable = true;
      }
      return;
    }

    // Determine combat phase
    const hpRatio = this.hp / this.maxHp;
    if (hpRatio <= CONFIG.BOSS.PHASE_3_THRESHOLD) {
      this.phase = 3;
    } else if (hpRatio <= CONFIG.BOSS.PHASE_2_THRESHOLD) {
      this.phase = 2;
    } else {
      this.phase = 1;
    }

    // Horizontal swaying movement
    const swaySpeed = this.phase === 3 ? 1.4 : this.phase === 2 ? 1.0 : 0.7;
    const swayAmp = this.phase === 3 ? 120 : 90;
    this.x = CONFIG.CANVAS_WIDTH / 2 + Math.sin(this.time * swaySpeed) * swayAmp;

    // Execute combat attack patterns based on phase
    this.updateAttacks(dt, player, bulletPool, audio);
  }

  updateAttacks(dt, player, bulletPool, audio) {
    this.attackTimer -= dt;
    this.secondaryTimer -= dt;

    if (this.phase === 1) {
      // Phase 1: 5-way spread volley every 1.5s
      if (this.attackTimer <= 0) {
        this.attackTimer = 1.5;
        const count = 5;
        const startAngle = Math.PI / 2 - 0.45;
        const step = 0.9 / (count - 1);
        const speed = 230;

        for (let i = 0; i < count; i++) {
          const angle = startAngle + i * step;
          const b = bulletPool.obtain();
          b.initEnemyBullet(this.x, this.y + 40, Math.cos(angle) * speed, Math.sin(angle) * speed, 5, 1);
        }
        audio.playEnemyLaser();
      }
    } else if (this.phase === 2) {
      // Phase 2: Dual wing pod aimed volleys + center circular burst
      if (this.attackTimer <= 0) {
        this.attackTimer = 1.2;
        // Fire from left & right pods aimed at player
        [-46, 46].forEach((ox) => {
          const dx = player.x - (this.x + ox);
          const dy = player.y - (this.y + 10);
          const dist = Math.hypot(dx, dy) || 1;
          const speed = 250;

          const b = bulletPool.obtain();
          b.initEnemyBullet(this.x + ox, this.y + 10, (dx / dist) * speed, (dy / dist) * speed, 5, 1);
        });
        audio.playEnemyLaser();
      }

      if (this.secondaryTimer <= 0) {
        this.secondaryTimer = 2.4;
        // Circular ring burst (8 bullets)
        const ringCount = 8;
        const speed = 180;
        for (let i = 0; i < ringCount; i++) {
          const angle = (i * Math.PI * 2) / ringCount;
          const b = bulletPool.obtain();
          b.initEnemyBullet(this.x, this.y + 20, Math.cos(angle) * speed, Math.sin(angle) * speed, 5, 1);
        }
        audio.playEnemyLaser();
      }
    } else {
      // Phase 3: Berserk Spiral Bullet Hell Storm!
      this.spiralAngle += 0.28;
      if (this.attackTimer <= 0) {
        this.attackTimer = 0.12; // Fast continuous stream
        const speed = 220;
        // Twin opposite spirals
        [0, Math.PI].forEach((offset) => {
          const angle = this.spiralAngle + offset;
          const b = bulletPool.obtain();
          b.initEnemyBullet(this.x, this.y + 20, Math.cos(angle) * speed, Math.sin(angle) * speed, 5, 1);
        });
        audio.playEnemyLaser();
      }

      if (this.secondaryTimer <= 0) {
        this.secondaryTimer = 1.8;
        // Targeted heavy cluster directly at player
        const dx = player.x - this.x;
        const dy = player.y - (this.y + 40);
        const dist = Math.hypot(dx, dy) || 1;
        const speed = 280;

        [-0.15, 0, 0.15].forEach((spread) => {
          const angle = Math.atan2(dy, dx) + spread;
          const b = bulletPool.obtain();
          b.initEnemyBullet(this.x, this.y + 40, Math.cos(angle) * speed, Math.sin(angle) * speed, 6, 1);
        });
        audio.playEnemyLaser();
      }
    }
  }

  takeDamage(amount) {
    if (!this.isVulnerable || this.isDying) return false;
    this.hp -= amount;
    this.hitFlashTimer = 0.08;

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDying = true;
      this.isVulnerable = false;
      this.deathTimer = 1.6;
      return true; // Boss defeated!
    }
    return false;
  }
}
