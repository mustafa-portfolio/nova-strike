import { CONFIG } from '../config.js';

export class HUD {
  constructor(game) {
    this.game = game;
    this.displayedScore = 0;
  }

  render(ctx) {
    const { player, spawner, boss } = this.game;

    // Smooth score rolling counter
    this.displayedScore += (player.score - this.displayedScore) * 0.2;
    if (Math.abs(player.score - this.displayedScore) < 1) {
      this.displayedScore = player.score;
    }

    ctx.save();

    // 1. Top HUD Bar
    const topY = 28;

    // Lives: mini rocket vector icons
    for (let i = 0; i < player.lives; i++) {
      this.drawMiniRocket(ctx, 24 + i * 20, topY);
    }

    // Shield status badge
    if (player.hasShield) {
      ctx.fillStyle = '#00f5ff';
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 6;
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('SHIELD [ON]', 24, topY + 16);
    }

    // Centered Score Display
    ctx.shadowColor = 'rgba(0, 245, 255, 0.4)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 22px -apple-system, BlinkMacSystemFont, monospace, sans-serif';
    ctx.textAlign = 'center';
    const scoreStr = Math.round(this.displayedScore).toLocaleString();
    ctx.fillText(scoreStr, CONFIG.CANVAS_WIDTH / 2, topY + 4);

    // Wave number on the right
    ctx.font = '700 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#00f5ff';
    ctx.textAlign = 'right';
    ctx.fillText(`SECTOR 0${spawner.wave}`.slice(-9), CONFIG.CANVAS_WIDTH - 20, topY + 2);

    // 2. Combo & Multiplier Progress Bar
    if (player.combo > 1 && player.comboTimer > 0) {
      const comboRatio = Math.max(0, player.comboTimer / CONFIG.COMBO.TIMEOUT);
      const barW = 120;
      const barH = 4;
      const barX = (CONFIG.CANVAS_WIDTH - barW) / 2;
      const barY = topY + 14;

      // Background track
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(barX, barY, barW, barH);

      // Filled progress
      const color = player.comboMultiplier >= 4 ? '#ff0055' : player.comboMultiplier >= 2.5 ? '#ffbe0b' : '#00f5ff';
      ctx.fillStyle = color;
      ctx.fillRect(barX, barY, barW * comboRatio, barH);

      // Multiplier Label
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(`${player.comboMultiplier.toFixed(1)}x COMBO`, CONFIG.CANVAS_WIDTH / 2, barY + 14);
    }

    // 3. Power-up active badges (Multiplier 2X, Magnet)
    let badgeY = topY + 36;
    if (player.scoreMultiplierTimer > 0) {
      ctx.fillStyle = '#ffbe0b';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`★ 2X SCORE: ${Math.ceil(player.scoreMultiplierTimer)}s`, 24, badgeY);
      badgeY += 14;
    }
    if (player.magnetTimer > 0) {
      ctx.fillStyle = '#9d4edd';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`🧲 MAGNET: ${Math.ceil(player.magnetTimer)}s`, 24, badgeY);
    }

    // 4. Boss Health Bar (when Boss is active)
    if (boss._active) {
      const barW = 300;
      const barH = 10;
      const barX = (CONFIG.CANVAS_WIDTH - barW) / 2;
      const barY = 56;
      const hpPct = Math.max(0, boss.hp / boss.maxHp);

      // Title & Phase
      ctx.fillStyle = '#ffbe0b';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`DREADNOUGHT // PHASE ${boss.phase}`, barX, barY - 5);

      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(hpPct * 100)}%`, barX + barW, barY - 5);

      // Health bar frame
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

      // Bar gradient fill
      const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      grad.addColorStop(0, '#ff0055');
      grad.addColorStop(0.5, '#ffbe0b');
      grad.addColorStop(1, '#00f5ff');
      ctx.fillStyle = grad;
      ctx.fillRect(barX, barY, barW * hpPct, barH);

      // Phase threshold markers (at 33% and 66%)
      ctx.fillStyle = '#ffffff';
      [0.33, 0.66].forEach((pct) => {
        ctx.fillRect(barX + barW * pct - 1, barY - 2, 2, barH + 4);
      });
    }

    // 5. Boss Dramatic WARNING Banner
    if (spawner.warningActive) {
      const flash = Math.sin(performance.now() * 0.015) > 0;
      const bannerH = 75;
      const bannerY = CONFIG.CANVAS_HEIGHT * 0.34;

      // Dark translucent banner band
      ctx.fillStyle = flash ? 'rgba(255, 0, 85, 0.35)' : 'rgba(10, 0, 20, 0.75)';
      ctx.fillRect(0, bannerY, CONFIG.CANVAS_WIDTH, bannerH);

      // Border lines
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, bannerY);
      ctx.lineTo(CONFIG.CANVAS_WIDTH, bannerY);
      ctx.moveTo(0, bannerY + bannerH);
      ctx.lineTo(CONFIG.CANVAS_WIDTH, bannerY + bannerH);
      ctx.stroke();

      // Flashing text
      ctx.textAlign = 'center';
      ctx.fillStyle = flash ? '#ffffff' : '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 20;
      ctx.font = '900 24px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('⚠ DANGER // BOSS INCOMING ⚠', CONFIG.CANVAS_WIDTH / 2, bannerY + 34);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#ffbe0b';
      ctx.shadowBlur = 0;
      ctx.fillText('HEAVY DREADNOUGHT WARPING INTO SECTOR', CONFIG.CANVAS_WIDTH / 2, bannerY + 56);
    }

    ctx.restore();
  }

  drawMiniRocket(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#00f5ff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(-5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
