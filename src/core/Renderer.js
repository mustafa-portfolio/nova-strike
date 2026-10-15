import { CONFIG } from '../config.js';

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeOffset = { x: 0, y: 0 };
  }

  triggerShake(intensity = 8, duration = 0.25) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  updateShake(dt) {
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const decay = Math.max(0, this.shakeDuration);
      const mag = this.shakeIntensity * (decay / 0.25);
      this.shakeOffset.x = (Math.random() * 2 - 1) * mag;
      this.shakeOffset.y = (Math.random() * 2 - 1) * mag;
      if (this.shakeDuration <= 0) {
        this.shakeIntensity = 0;
        this.shakeOffset.x = 0;
        this.shakeOffset.y = 0;
      }
    }
  }

  clear() {
    this.ctx.fillStyle = '#050711';
    this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
  }

  // --- Procedural Rocket Vector Drawing ---
  drawPlayer(player, customCtx = null) {
    const ctx = customCtx || this.ctx;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.tiltAngle);

    // Blinking effect when invulnerable
    if (player.invulnerableTimer > 0) {
      const blink = Math.floor(player.invulnerableTimer * CONFIG.PLAYER.INVULNERABLE_BLINK_RATE) % 2 === 0;
      if (blink) {
        ctx.globalAlpha = 0.35;
      }
    }

    // Engine exhaust plasma flames (dual thrusters)
    const flameFlicker = 0.8 + Math.random() * 0.4;
    const flameLength = 22 * flameFlicker;

    // Thruster left & right
    [-10, 10].forEach((tx) => {
      ctx.save();
      ctx.translate(tx, 22);

      // Outer orange flame
      const grad = ctx.createLinearGradient(0, 0, 0, flameLength);
      grad.addColorStop(0, 'rgba(0, 245, 255, 0.9)');
      grad.addColorStop(0.3, 'rgba(58, 134, 255, 0.8)');
      grad.addColorStop(1, 'rgba(255, 0, 110, 0)');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.quadraticCurveTo(0, flameLength, 5, 0);
      ctx.closePath();
      ctx.fill();

      // Inner white-hot core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.quadraticCurveTo(0, flameLength * 0.5, 2, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });

    // Main fuselage & swept wings
    ctx.shadowColor = 'rgba(0, 245, 255, 0.6)';
    ctx.shadowBlur = 12;

    // Wings
    const wingGrad = ctx.createLinearGradient(-26, 0, 26, 0);
    wingGrad.addColorStop(0, '#023e8a');
    wingGrad.addColorStop(0.5, '#0096c7');
    wingGrad.addColorStop(1, '#023e8a');
    ctx.fillStyle = wingGrad;

    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-24, 18);
    ctx.lineTo(-12, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(12, 14);
    ctx.lineTo(24, 18);
    ctx.closePath();
    ctx.fill();

    // Wing cannons & weapon pods based on upgrade level
    const cannonGrad = ctx.createLinearGradient(0, -10, 0, 10);
    cannonGrad.addColorStop(0, '#00f5ff');
    cannonGrad.addColorStop(1, '#03045e');
    ctx.fillStyle = cannonGrad;

    // Outer cannons
    ctx.fillRect(-22, 2, 3, 14);
    ctx.fillRect(19, 2, 3, 14);

    if (player.weaponTier >= 2) {
      // Secondary pod cannons
      ctx.fillRect(-12, -4, 3, 16);
      ctx.fillRect(9, -4, 3, 16);
    }

    // Wingtip glowing nav lights
    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.arc(-23, 17, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00f5ff';
    ctx.beginPath();
    ctx.arc(23, 17, 2, 0, Math.PI * 2);
    ctx.fill();

    // Central Rocket Hull
    const hullGrad = ctx.createLinearGradient(0, -28, 0, 24);
    hullGrad.addColorStop(0, '#ffffff');
    hullGrad.addColorStop(0.25, '#caf0f8');
    hullGrad.addColorStop(0.7, '#0077b6');
    hullGrad.addColorStop(1, '#03045e');
    ctx.fillStyle = hullGrad;

    ctx.beginPath();
    ctx.moveTo(0, -26); // Nose cone
    ctx.lineTo(-9, 14);
    ctx.lineTo(-6, 22);
    ctx.lineTo(6, 22);
    ctx.lineTo(9, 14);
    ctx.closePath();
    ctx.fill();

    // Hull armor panel seams
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(0, 22);
    ctx.moveTo(-6, 5);
    ctx.lineTo(6, 5);
    ctx.stroke();

    // Cockpit canopy glow
    const canopyGrad = ctx.createRadialGradient(0, -6, 1, 0, -6, 10);
    canopyGrad.addColorStop(0, '#ffffff');
    canopyGrad.addColorStop(0.4, '#00f5ff');
    canopyGrad.addColorStop(1, '#0077b6');
    ctx.fillStyle = canopyGrad;

    ctx.beginPath();
    ctx.ellipse(0, -6, 4.5, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Active Energy Shield Bubble
    if (player.hasShield) {
      ctx.save();
      const time = performance.now() * 0.003;
      const shieldRadius = CONFIG.PLAYER.SHIP_WIDTH * 0.78;

      ctx.strokeStyle = 'rgba(0, 245, 255, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 16;

      ctx.beginPath();
      ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Shield hex / harmonic ripple nodes
      for (let i = 0; i < 6; i++) {
        const angle = time + (i * Math.PI) / 3;
        const nx = Math.cos(angle) * shieldRadius;
        const ny = Math.sin(angle) * shieldRadius;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Translucent inner shield sheen
      const shieldFill = ctx.createRadialGradient(0, 0, 5, 0, 0, shieldRadius);
      shieldFill.addColorStop(0, 'rgba(0, 245, 255, 0.05)');
      shieldFill.addColorStop(0.85, 'rgba(0, 245, 255, 0.15)');
      shieldFill.addColorStop(1, 'rgba(0, 245, 255, 0.35)');
      ctx.fillStyle = shieldFill;
      ctx.beginPath();
      ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  // --- Procedural Enemy Vector Drawing ---
  drawEnemy(enemy) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.rotation || 0);

    const isHit = enemy.hitFlashTimer > 0;

    switch (enemy.type) {
      case 'scout':
        this.drawScout(ctx, enemy, isHit);
        break;
      case 'zigzag':
        this.drawZigzag(ctx, enemy, isHit);
        break;
      case 'gunship':
        this.drawGunship(ctx, enemy, isHit);
        break;
      case 'kamikaze':
        this.drawKamikaze(ctx, enemy, isHit);
        break;
    }

    ctx.restore();
  }

  drawScout(ctx, enemy, isHit) {
    if (isHit) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
    } else {
      const grad = ctx.createLinearGradient(0, -16, 0, 16);
      grad.addColorStop(0, '#ff0055');
      grad.addColorStop(0.6, '#9b00e8');
      grad.addColorStop(1, '#3a0050');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(255, 0, 85, 0.5)';
      ctx.shadowBlur = 8;
    }

    // Fast swept arrow drone
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.lineTo(-16, -14);
    ctx.lineTo(-6, -8);
    ctx.lineTo(0, -14);
    ctx.lineTo(6, -8);
    ctx.lineTo(16, -14);
    ctx.closePath();
    ctx.fill();

    // Twin red drone eyes
    ctx.fillStyle = isHit ? '#ffffff' : '#00ffff';
    ctx.beginPath();
    ctx.arc(-5, 0, 2, 0, Math.PI * 2);
    ctx.arc(5, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawZigzag(ctx, enemy, isHit) {
    if (isHit) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
    } else {
      const grad = ctx.createLinearGradient(-18, 0, 18, 0);
      grad.addColorStop(0, '#f72585');
      grad.addColorStop(0.5, '#7209b7');
      grad.addColorStop(1, '#f72585');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(247, 37, 133, 0.6)';
      ctx.shadowBlur = 10;
    }

    // Stealth delta fighter
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(-20, -12);
    ctx.lineTo(-12, -18);
    ctx.lineTo(0, -10);
    ctx.lineTo(12, -18);
    ctx.lineTo(20, -12);
    ctx.closePath();
    ctx.fill();

    // Glowing reactor spine
    ctx.fillStyle = isHit ? '#ffffff' : '#4cc9f0';
    ctx.fillRect(-2, -6, 4, 16);
  }

  drawGunship(ctx, enemy, isHit) {
    if (isHit) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 16;
    } else {
      const grad = ctx.createLinearGradient(0, -24, 0, 24);
      grad.addColorStop(0, '#e63946');
      grad.addColorStop(0.5, '#457b9d');
      grad.addColorStop(1, '#1d3557');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(230, 57, 70, 0.6)';
      ctx.shadowBlur = 12;
    }

    // Heavy cruiser armor plating
    ctx.beginPath();
    ctx.moveTo(0, 26);
    ctx.lineTo(-26, 6);
    ctx.lineTo(-26, -18);
    ctx.lineTo(-12, -26);
    ctx.lineTo(12, -26);
    ctx.lineTo(26, -18);
    ctx.lineTo(26, 6);
    ctx.closePath();
    ctx.fill();

    // Armor panel outlines
    ctx.strokeStyle = isHit ? '#ffffff' : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Twin turrets
    ctx.fillStyle = isHit ? '#ffffff' : '#ffbe0b';
    ctx.fillRect(-18, 12, 5, 14);
    ctx.fillRect(13, 12, 5, 14);

    // Command bridge
    ctx.fillStyle = isHit ? '#ffffff' : '#00f5ff';
    ctx.beginPath();
    ctx.arc(0, -6, 6, 0, Math.PI * 2);
    ctx.fill();

    // Mini health indicator for Gunship (since HP = 7)
    if (enemy.hp < CONFIG.ENEMIES.GUNSHIP.hp) {
      const hpPct = enemy.hp / CONFIG.ENEMIES.GUNSHIP.hp;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(-20, -32, 40, 4);
      ctx.fillStyle = '#00f5ff';
      ctx.fillRect(-20, -32, 40 * hpPct, 4);
    }
  }

  drawKamikaze(ctx, enemy, isHit) {
    if (isHit) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 14;
    } else {
      const grad = ctx.createLinearGradient(0, -18, 0, 22);
      grad.addColorStop(0, '#ffbe0b');
      grad.addColorStop(0.4, '#fb5607');
      grad.addColorStop(1, '#ff006e');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(251, 86, 7, 0.7)';
      ctx.shadowBlur = 12;
    }

    // Needle dagger strike drone
    ctx.beginPath();
    ctx.moveTo(0, 26); // Sharp needle tip
    ctx.lineTo(-15, -14);
    ctx.lineTo(-6, -20);
    ctx.lineTo(0, -12);
    ctx.lineTo(6, -20);
    ctx.lineTo(15, -14);
    ctx.closePath();
    ctx.fill();

    // Danger pulse jet
    ctx.fillStyle = isHit ? '#ffffff' : '#fffb00';
    ctx.beginPath();
    ctx.arc(0, -12, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Boss Dreadnought Drawing ---
  drawBoss(boss) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(boss.x, boss.y);

    const isHit = boss.hitFlashTimer > 0;
    const hpRatio = boss.hp / boss.maxHp;

    // Wing pods & heavy dreadnought chassis
    const baseColor = isHit ? '#ffffff' : '#141829';
    const accentColor = hpRatio < 0.33 ? '#ff0055' : hpRatio < 0.66 ? '#ffbe0b' : '#00f5ff';

    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 20;

    // Outer wings
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(0, 48);
    ctx.lineTo(-68, 12);
    ctx.lineTo(-72, -36);
    ctx.lineTo(-38, -48);
    ctx.lineTo(0, -32);
    ctx.lineTo(38, -48);
    ctx.lineTo(72, -36);
    ctx.lineTo(68, 12);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Weapon Pods (Phase 2 & 3 have spinning energy cannons)
    const time = performance.now() * 0.005;
    [-46, 46].forEach((wx) => {
      ctx.fillStyle = isHit ? '#ffffff' : '#2b2d42';
      ctx.beginPath();
      ctx.arc(wx, -6, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing emitter
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(wx, -6, 6 + Math.sin(time) * 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Central Core Reactor
    const coreGrad = ctx.createRadialGradient(0, 2, 2, 0, 2, 22);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, accentColor);
    coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 2, 20, 0, Math.PI * 2);
    ctx.fill();

    // Heavy frontal beam cannons
    ctx.fillStyle = isHit ? '#ffffff' : '#8d99ae';
    ctx.fillRect(-18, 30, 8, 24);
    ctx.fillRect(10, 30, 8, 24);

    // Glowing energy conduits
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-46, -6);
    ctx.lineTo(0, 2);
    ctx.lineTo(46, -6);
    ctx.stroke();

    ctx.restore();
  }

  // --- Bullets Drawing ---
  drawBullet(bullet) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(bullet.x, bullet.y);

    if (bullet.isEnemy) {
      // Enemy plasma sphere
      const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, bullet.radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, '#ff0055');
      grad.addColorStop(1, 'rgba(255, 0, 85, 0)');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius + 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (bullet.isHoming) {
      // Player Homing Missile
      ctx.rotate(bullet.angle);
      ctx.fillStyle = '#ffbe0b';
      ctx.shadowColor = '#fb5607';
      ctx.shadowBlur = 8;

      // Missile body
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, -4);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();

      // Missile exhaust flame
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(-7, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Player high-energy laser beam
      const length = 18;
      const width = 4;
      const grad = ctx.createLinearGradient(0, -length, 0, length);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#00f5ff');
      grad.addColorStop(1, 'rgba(0, 245, 255, 0)');

      ctx.fillStyle = grad;
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(-width / 2, -length / 2, width, length, 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- Power-up Token Drawing ---
  drawPowerup(p) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(p.x, p.y);

    const time = performance.now() * 0.004;
    const pulse = 1 + Math.sin(time) * 0.08;
    ctx.scale(pulse, pulse);

    let color = '#00f5ff';
    let label = 'W';
    switch (p.type) {
      case 'weapon':
        color = '#00f5ff';
        label = 'W';
        break;
      case 'shield':
        color = '#38b000';
        label = 'S';
        break;
      case 'bomb':
        color = '#ff0055';
        label = 'B';
        break;
      case 'multiplier':
        color = '#ffbe0b';
        label = '2X';
        break;
      case 'magnet':
        color = '#9d4edd';
        label = 'M';
        break;
    }

    // Outer rotating beacon ring
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.arc(0, 0, CONFIG.POWERUPS.RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Semi-transparent token back
    ctx.fillStyle = 'rgba(5, 7, 17, 0.85)';
    ctx.beginPath();
    ctx.arc(0, 0, CONFIG.POWERUPS.RADIUS - 2, 0, Math.PI * 2);
    ctx.fill();

    // Icon symbol
    ctx.fillStyle = color;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);

    ctx.restore();
  }
}
