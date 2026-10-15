import { CONFIG } from '../config.js';

export class Player {
  constructor(audioService) {
    this.audio = audioService;
    this.reset();
  }

  reset() {
    this.x = CONFIG.CANVAS_WIDTH / 2;
    this.y = CONFIG.CANVAS_HEIGHT * 0.82;
    this.targetX = this.x;
    this.targetY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.tiltAngle = 0;

    this.hitboxRadius = CONFIG.PLAYER.HITBOX_RADIUS;
    this.lives = CONFIG.PLAYER.INITIAL_LIVES;
    this.bombs = CONFIG.PLAYER.INITIAL_BOMBS;
    this.weaponTier = 1;
    this.hasShield = false;

    this.invulnerableTimer = 0;
    this.fireTimer = 0;
    this.missileTimer = 0;

    // Powerup boost timers
    this.magnetTimer = 0;
    this.scoreMultiplierTimer = 0;

    // Scoring & Combo
    this.score = 0;
    this.combo = 0;
    this.comboMultiplier = 1.0;
    this.comboTimer = 0;
    this.maxCombo = 0;

    // Accuracy stats
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.kills = 0;
  }

  update(dt, input, bulletPool, particles, enemiesList, boss) {
    // 1. Smooth movement towards target
    this.targetX = input.targetX;
    this.targetY = input.targetY;

    // Clamp target within virtual arena boundaries
    const margin = 24;
    const clampedTargetX = Math.max(margin, Math.min(CONFIG.CANVAS_WIDTH - margin, this.targetX));
    const clampedTargetY = Math.max(margin + 20, Math.min(CONFIG.CANVAS_HEIGHT - margin - 30, this.targetY));

    const prevX = this.x;
    const prevY = this.y;

    const lerp = CONFIG.CONTROLS.TOUCH_LERP;
    this.x += (clampedTargetX - this.x) * lerp;
    this.y += (clampedTargetY - this.y) * lerp;

    this.vx = (this.x - prevX) / dt;
    this.vy = (this.y - prevY) / dt;

    // 2. Banking tilt animation based on horizontal velocity
    const targetTilt = Math.max(
      -CONFIG.CONTROLS.BANKING_MAX_ANGLE,
      Math.min(CONFIG.CONTROLS.BANKING_MAX_ANGLE, (this.vx / 450) * CONFIG.CONTROLS.BANKING_MAX_ANGLE)
    );
    this.tiltAngle += (targetTilt - this.tiltAngle) * CONFIG.CONTROLS.BANKING_LERP;

    // 3. Timers
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }
    if (this.magnetTimer > 0) {
      this.magnetTimer -= dt;
    }
    if (this.scoreMultiplierTimer > 0) {
      this.scoreMultiplierTimer -= dt;
    }

    // 4. Combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboMultiplier = 1.0;
      }
    }

    // 5. Thruster exhaust sparks
    if (Math.random() < 0.8) {
      [-10, 10].forEach((tx) => {
        particles.spawnExhaust(this.x + tx, this.y + 22, this.tiltAngle);
      });
    }

    // 6. Auto-fire weapons
    this.fireTimer -= dt;
    this.missileTimer -= dt;

    if (input.isFiring && this.fireTimer <= 0) {
      this.fireWeapon(bulletPool);
    }

    // Homing missiles for Tier 4
    if (input.isFiring && this.weaponTier >= 4 && this.missileTimer <= 0) {
      this.fireMissiles(bulletPool, enemiesList, boss);
    }
  }

  fireWeapon(bulletPool) {
    const tierConfig = CONFIG.WEAPONS[`TIER_${this.weaponTier}`] || CONFIG.WEAPONS.TIER_1;
    this.fireTimer = tierConfig.fireRate;
    const bSpeed = CONFIG.PLAYER.BULLET_SPEED;

    if (this.weaponTier === 1) {
      // Single center laser
      const b = bulletPool.obtain();
      b.initPlayerLaser(this.x, this.y - 20, 0, -bSpeed, 1);
      this.shotsFired++;
    } else if (this.weaponTier === 2) {
      // Twin parallel lasers
      const offset = 14;
      const b1 = bulletPool.obtain();
      b1.initPlayerLaser(this.x - offset, this.y - 12, 0, -bSpeed, 1);
      const b2 = bulletPool.obtain();
      b2.initPlayerLaser(this.x + offset, this.y - 12, 0, -bSpeed, 1);
      this.shotsFired += 2;
    } else {
      // Triple spread lasers
      const angle = 0.14;
      const bCenter = bulletPool.obtain();
      bCenter.initPlayerLaser(this.x, this.y - 20, 0, -bSpeed, 1.2);

      const bLeft = bulletPool.obtain();
      bLeft.initPlayerLaser(this.x - 14, this.y - 12, -Math.sin(angle) * bSpeed, -Math.cos(angle) * bSpeed, 1);

      const bRight = bulletPool.obtain();
      bRight.initPlayerLaser(this.x + 14, this.y - 12, Math.sin(angle) * bSpeed, -Math.cos(angle) * bSpeed, 1);

      this.shotsFired += 3;
    }

    this.audio.playLaser(this.weaponTier);
  }

  fireMissiles(bulletPool, enemiesList, boss) {
    this.missileTimer = CONFIG.PLAYER.HOMING_MISSILE_INTERVAL;
    
    // Launch twin homing micro-missiles from left & right wing pods
    [-22, 22].forEach((offset, idx) => {
      const b = bulletPool.obtain();
      const launchAngle = -Math.PI / 2 + (idx === 0 ? -0.4 : 0.4);
      b.initHomingMissile(this.x + offset, this.y, null, launchAngle);
      this.shotsFired++;
    });

    this.audio.playMissileLaunch();
  }

  registerKill(points) {
    this.kills++;
    this.combo++;
    this.comboTimer = CONFIG.COMBO.TIMEOUT;

    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    // Step up combo multiplier
    this.comboMultiplier = Math.min(
      CONFIG.COMBO.MAX_MULTIPLIER,
      1.0 + (this.combo - 1) * CONFIG.COMBO.INCREMENT
    );

    // Score computation with multiplier power-up boost
    const activeMultiplier = this.scoreMultiplierTimer > 0 ? this.comboMultiplier * 2 : this.comboMultiplier;
    const gained = Math.round(points * activeMultiplier);
    this.score += gained;

    if (this.combo > 1) {
      this.audio.playCombo(this.combo);
    }

    return { gained, combo: this.combo, multiplier: activeMultiplier };
  }

  takeDamage(particles) {
    if (this.invulnerableTimer > 0) return false;

    if (this.hasShield) {
      this.hasShield = false;
      this.audio.playShieldAbsorb();
      particles.spawnShieldBreak(this.x, this.y);
      this.invulnerableTimer = 0.8; // Brief grace period after shield break
      return 'shield_absorbed';
    }

    this.lives--;
    this.weaponTier = Math.max(1, this.weaponTier - 1); // Drop 1 weapon tier
    this.invulnerableTimer = CONFIG.PLAYER.INVULNERABLE_TIME;
    this.combo = 0;
    this.comboMultiplier = 1.0;

    this.audio.playPlayerHit();
    particles.spawnPlayerHit(this.x, this.y);

    return this.lives <= 0 ? 'dead' : 'damaged';
  }

  upgradeWeapon() {
    this.weaponTier = Math.min(4, this.weaponTier + 1);
  }

  addShield() {
    this.hasShield = true;
  }

  addBomb() {
    this.bombs = Math.min(CONFIG.PLAYER.MAX_BOMBS, this.bombs + 1);
  }

  activateMagnet() {
    this.magnetTimer = CONFIG.POWERUPS.DURATION_MAGNET;
  }

  activateScoreMultiplier() {
    this.scoreMultiplierTimer = CONFIG.POWERUPS.DURATION_MULTIPLIER;
  }

  getAccuracy() {
    if (this.shotsFired === 0) return 0;
    return Math.min(100, Math.round((this.shotsHit / this.shotsFired) * 100));
  }
}
