import { CONFIG } from '../config.js';
import { Pool } from '../core/Pool.js';

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.type = 'spark';
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.color = '#ffffff';
    this.size = 2;
    this.alpha = 1;
    this.life = 1;
    this.maxLife = 1;
    this.drag = 0.98;
    this.gravity = 0;
    this.growth = 0;
    this.rotation = 0;
    this.rotSpeed = 0;
  }
}

export class ParticleSystem {
  constructor() {
    this.pool = new Pool(() => new Particle(), CONFIG.POOLS.PARTICLES);
  }

  update(dt) {
    this.pool.forEachActive((p) => {
      p.life -= dt;
      if (p.life <= 0) {
        this.pool.free(p);
        return;
      }

      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size += p.growth * dt;
      p.rotation += p.rotSpeed * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
    });
  }

  render(ctx) {
    this.pool.forEachActive((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, p.size * 0.1);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'debris') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
      } else {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.type === 'spark' ? 6 : 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  spawnExhaust(x, y, tiltAngle) {
    const p = this.pool.obtain();
    p.type = 'exhaust';
    p.x = x + (Math.random() * 4 - 2);
    p.y = y;
    const spread = (Math.random() * 2 - 1) * 30;
    p.vx = spread - tiltAngle * 80;
    p.vy = 160 + Math.random() * 120;
    p.color = Math.random() < 0.6 ? '#00f5ff' : '#ffffff';
    p.size = 2 + Math.random() * 2.5;
    p.maxLife = 0.18 + Math.random() * 0.12;
    p.life = p.maxLife;
    p.drag = 0.94;
    p.growth = -4;
  }

  spawnHitSparks(x, y, count = 6, color = '#00f5ff') {
    for (let i = 0; i < count; i++) {
      const p = this.pool.obtain();
      p.type = 'spark';
      p.x = x;
      p.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 180;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.color = color;
      p.size = 2 + Math.random() * 2;
      p.maxLife = 0.2 + Math.random() * 0.2;
      p.life = p.maxLife;
      p.drag = 0.92;
    }
  }

  spawnExplosion(x, y, scale = 1.0, isBoss = false) {
    // 1. Shockwave ring
    const ring = this.pool.obtain();
    ring.type = 'ring';
    ring.x = x;
    ring.y = y;
    ring.color = isBoss ? '#ffbe0b' : '#ff0055';
    ring.size = 8;
    ring.maxLife = 0.45 * scale;
    ring.life = ring.maxLife;
    ring.growth = 160 * scale;

    // 2. Fiery Sparks
    const sparkCount = Math.round(18 * scale);
    const colors = ['#ffffff', '#ffbe0b', '#fb5607', '#ff006e'];
    for (let i = 0; i < sparkCount; i++) {
      const p = this.pool.obtain();
      p.type = 'spark';
      p.x = x;
      p.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = (90 + Math.random() * 260) * scale;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.color = colors[Math.floor(Math.random() * colors.length)];
      p.size = 2.5 + Math.random() * 3.5;
      p.maxLife = (0.35 + Math.random() * 0.4) * scale;
      p.life = p.maxLife;
      p.drag = 0.93;
    }

    // 3. Hull Debris
    const debrisCount = Math.round(6 * scale);
    for (let i = 0; i < debrisCount; i++) {
      const d = this.pool.obtain();
      d.type = 'debris';
      d.x = x;
      d.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = (60 + Math.random() * 160) * scale;
      d.vx = Math.cos(angle) * speed;
      d.vy = Math.sin(angle) * speed;
      d.color = Math.random() < 0.5 ? '#8d99ae' : '#2b2d42';
      d.size = 3 + Math.random() * 4;
      d.maxLife = 0.6 + Math.random() * 0.4;
      d.life = d.maxLife;
      d.drag = 0.96;
      d.rotSpeed = (Math.random() * 2 - 1) * 12;
    }
  }

  spawnBombShockwave(centerX, centerY) {
    // Huge EMP shockwave expanding across whole canvas
    for (let i = 0; i < 3; i++) {
      const ring = this.pool.obtain();
      ring.type = 'ring';
      ring.x = centerX;
      ring.y = centerY;
      ring.color = i === 0 ? '#ffffff' : i === 1 ? '#00f5ff' : '#ff007f';
      ring.size = 20 + i * 15;
      ring.maxLife = 0.8 + i * 0.15;
      ring.life = ring.maxLife;
      ring.growth = 680;
    }

    // Dispersed EMP energy particles
    for (let i = 0; i < 40; i++) {
      const p = this.pool.obtain();
      p.type = 'spark';
      p.x = centerX + (Math.random() * 2 - 1) * 40;
      p.y = centerY + (Math.random() * 2 - 1) * 40;
      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 450;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.color = Math.random() < 0.5 ? '#00f5ff' : '#ff00ff';
      p.size = 3 + Math.random() * 3;
      p.maxLife = 0.5 + Math.random() * 0.3;
      p.life = p.maxLife;
      p.drag = 0.94;
    }
  }

  spawnShieldBreak(x, y) {
    const ring = this.pool.obtain();
    ring.type = 'ring';
    ring.x = x;
    ring.y = y;
    ring.color = '#00f5ff';
    ring.size = 15;
    ring.maxLife = 0.4;
    ring.life = ring.maxLife;
    ring.growth = 180;

    for (let i = 0; i < 16; i++) {
      const p = this.pool.obtain();
      p.type = 'spark';
      p.x = x;
      p.y = y;
      const angle = (i * Math.PI * 2) / 16;
      p.vx = Math.cos(angle) * 160;
      p.vy = Math.sin(angle) * 160;
      p.color = '#00f5ff';
      p.size = 3;
      p.maxLife = 0.35;
      p.life = p.maxLife;
      p.drag = 0.94;
    }
  }

  spawnPlayerHit(x, y) {
    this.spawnExplosion(x, y, 1.2, true);
  }

  clear() {
    this.pool.clear();
  }
}
