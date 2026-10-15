import { CONFIG } from '../config.js';

export class Bullet {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 4;
    this.damage = 1;
    this.isEnemy = false;
    this.isHoming = false;
    this.target = null;
    this.angle = -Math.PI / 2;
    this.speed = 0;
    this.lifeTime = 0;
  }

  initPlayerLaser(x, y, vx, vy, damage = 1) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 4;
    this.damage = damage;
    this.isEnemy = false;
    this.isHoming = false;
    this.lifeTime = 0;
  }

  initHomingMissile(x, y, target, initialAngle = -Math.PI / 2) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.angle = initialAngle;
    this.speed = 360;
    this.radius = 6;
    this.damage = 2.5;
    this.isEnemy = false;
    this.isHoming = true;
    this.lifeTime = 0;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
  }

  initEnemyBullet(x, y, vx, vy, radius = 5, damage = 1) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.damage = damage;
    this.isEnemy = true;
    this.isHoming = false;
    this.lifeTime = 0;
  }

  update(dt, enemiesList, boss) {
    this.lifeTime += dt;

    if (this.isHoming) {
      // Find new target if current target died or inactive
      if (!this.target || !this.target._active || this.target.y < -50 || this.target.y > CONFIG.CANVAS_HEIGHT) {
        this.target = this.findBestTarget(enemiesList, boss);
      }

      if (this.target) {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const desiredAngle = Math.atan2(dy, dx);

        // Smooth angular steering
        let angleDiff = desiredAngle - this.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

        const maxTurn = 6.0 * dt;
        this.angle += Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
      }

      // Accelerate homing missile over time
      this.speed = Math.min(680, this.speed + 400 * dt);
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Check bounds
    const isOutOfBounds =
      this.x < -30 ||
      this.x > CONFIG.CANVAS_WIDTH + 30 ||
      this.y < -40 ||
      this.y > CONFIG.CANVAS_HEIGHT + 40;

    return !isOutOfBounds && this.lifeTime < 5.0;
  }

  findBestTarget(enemiesList, boss) {
    if (boss && boss._active && boss.isVulnerable) {
      return boss;
    }

    let closest = null;
    let minDistSq = Infinity;

    for (let i = 0; i < enemiesList.length; i++) {
      const e = enemiesList[i];
      if (e._active && e.y > 0 && e.y < CONFIG.CANVAS_HEIGHT * 0.9) {
        const dx = e.x - this.x;
        const dy = e.y - this.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          closest = e;
        }
      }
    }
    return closest;
  }
}
