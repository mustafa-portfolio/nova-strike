import { CONFIG } from '../config.js';

export class CollisionSystem {
  constructor(game) {
    this.game = game;
  }

  checkCollisions() {
    const { player, bulletPool, enemyPool, powerupPool, boss, particles, audio, renderer, floatingTexts, loop } = this.game;

    // 1. Player Bullets vs Enemies & Boss
    bulletPool.forEachActive((bullet) => {
      if (bullet.isEnemy) return;

      // Check vs Boss
      if (boss._active && boss.isVulnerable) {
        const dx = bullet.x - boss.x;
        const dy = bullet.y - boss.y;
        const distSq = dx * dx + dy * dy;
        const hitDist = bullet.radius + boss.hitboxRadius;

        if (distSq < hitDist * hitDist) {
          player.shotsHit++;
          particles.spawnHitSparks(bullet.x, bullet.y, 4, '#ffbe0b');
          audio.playHit();
          bulletPool.free(bullet);

          const defeated = boss.takeDamage(bullet.damage);
          if (defeated) {
            // Boss destroyed!
            audio.playExplosionLarge();
            renderer.triggerShake(16, 0.8);
            loop.setTimeScale(0.2); // Dramatic slow-mo!

            setTimeout(() => {
              loop.setTimeScale(1.0);
            }, CONFIG.BOSS.SLOW_MO_DURATION * 1000);

            const killInfo = player.registerKill(CONFIG.BOSS.SCORE);
            floatingTexts.spawn(`BOSS DESTROYED! +${killInfo.gained}`, boss.x, boss.y - 40, '#ffbe0b', 18, 1.8);

            // Drop guaranteed high-tier rewards
            this.spawnPowerup('weapon', boss.x - 40, boss.y);
            this.spawnPowerup('shield', boss.x, boss.y);
            this.spawnPowerup('bomb', boss.x + 40, boss.y);
          }
          return;
        }
      }

      // Check vs Regular Enemies
      enemyPool.forEachActive((enemy) => {
        if (!bullet._active) return;

        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const distSq = dx * dx + dy * dy;
        const hitDist = bullet.radius + enemy.hitboxRadius;

        if (distSq < hitDist * hitDist) {
          player.shotsHit++;
          particles.spawnHitSparks(bullet.x, bullet.y, 5, '#00f5ff');
          audio.playHit();
          bulletPool.free(bullet);

          const isDead = enemy.takeDamage(bullet.damage);
          if (isDead) {
            enemyPool.free(enemy);
            particles.spawnExplosion(enemy.x, enemy.y, enemy.type === 'gunship' ? 1.4 : 1.0);
            
            if (enemy.type === 'gunship') {
              audio.playExplosionLarge();
              renderer.triggerShake(8, 0.35);
            } else {
              audio.playExplosionSmall();
              renderer.triggerShake(4, 0.2);
            }

            const killInfo = player.registerKill(enemy.score);
            floatingTexts.spawn(`+${killInfo.gained}`, enemy.x, enemy.y, '#ffffff', 14, 0.7);

            if (killInfo.combo > 1) {
              const comboColor = killInfo.combo >= 10 ? '#ff007f' : killInfo.combo >= 5 ? '#ffbe0b' : '#00f5ff';
              floatingTexts.spawn(`${killInfo.combo}x COMBO!`, enemy.x, enemy.y - 18, comboColor, 15, 0.9);
            }

            // Powerup drop check
            if (Math.random() < enemy.dropChance) {
              this.spawnRandomPowerup(enemy.x, enemy.y);
            }
          }
        }
      });
    });

    // 2. Enemy Bullets vs Player
    if (player.invulnerableTimer <= 0) {
      bulletPool.forEachActive((bullet) => {
        if (!bullet.isEnemy) return;

        const dx = bullet.x - player.x;
        const dy = bullet.y - player.y;
        const distSq = dx * dx + dy * dy;
        const hitDist = bullet.radius + player.hitboxRadius;

        if (distSq < hitDist * hitDist) {
          bulletPool.free(bullet);
          const result = player.takeDamage(particles);
          if (result === 'shield_absorbed') {
            renderer.triggerShake(6, 0.25);
            floatingTexts.spawn('SHIELD ABSORBED', player.x, player.y - 30, '#00f5ff', 14, 1.0);
          } else if (result) {
            renderer.triggerShake(14, 0.5);
            floatingTexts.spawn('HULL COMPROMISED!', player.x, player.y - 30, '#ff3366', 15, 1.2);
            if (result === 'dead') {
              this.game.handleGameOver();
            }
          }
        }
      });
    }

    // 3. Enemies vs Player (Collision / Ramming)
    if (player.invulnerableTimer <= 0) {
      enemyPool.forEachActive((enemy) => {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distSq = dx * dx + dy * dy;
        const hitDist = enemy.hitboxRadius + player.hitboxRadius;

        if (distSq < hitDist * hitDist) {
          enemyPool.free(enemy);
          particles.spawnExplosion(enemy.x, enemy.y, 1.2);
          const result = player.takeDamage(particles);
          if (result === 'shield_absorbed') {
            renderer.triggerShake(8, 0.3);
            floatingTexts.spawn('SHIELD ABSORBED', player.x, player.y - 30, '#00f5ff', 14, 1.0);
          } else if (result) {
            renderer.triggerShake(16, 0.6);
            floatingTexts.spawn('COLLISION!', player.x, player.y - 30, '#ff0055', 16, 1.2);
            if (result === 'dead') {
              this.game.handleGameOver();
            }
          }
        }
      });

      // Boss Body vs Player
      if (boss._active && boss.isVulnerable) {
        const dx = boss.x - player.x;
        const dy = boss.y - player.y;
        const distSq = dx * dx + dy * dy;
        const hitDist = boss.hitboxRadius + player.hitboxRadius;

        if (distSq < hitDist * hitDist) {
          const result = player.takeDamage(particles);
          renderer.triggerShake(18, 0.6);
          if (result === 'dead') {
            this.game.handleGameOver();
          }
        }
      }
    }

    // 4. Player vs Power-ups
    powerupPool.forEachActive((p) => {
      const dx = p.x - player.x;
      const dy = p.y - player.y;
      const distSq = dx * dx + dy * dy;
      const collectDist = p.radius + 24; // Generous pickup magnet distance

      if (distSq < collectDist * collectDist) {
        powerupPool.free(p);
        audio.playPowerup();
        particles.spawnHitSparks(p.x, p.y, 12, '#ffffff');

        switch (p.type) {
          case 'weapon':
            player.upgradeWeapon();
            const wName = CONFIG.WEAPONS[`TIER_${player.weaponTier}`].name;
            floatingTexts.spawn(`WEAPON UPGRADE: ${wName}`, player.x, player.y - 35, '#00f5ff', 15, 1.2);
            break;
          case 'shield':
            player.addShield();
            floatingTexts.spawn('SHIELD RESTORED!', player.x, player.y - 35, '#38b000', 15, 1.2);
            break;
          case 'bomb':
            player.addBomb();
            floatingTexts.spawn('+1 EMP BOMB', player.x, player.y - 35, '#ff0055', 15, 1.2);
            break;
          case 'multiplier':
            player.activateScoreMultiplier();
            floatingTexts.spawn('2X SCORE BOOST!', player.x, player.y - 35, '#ffbe0b', 15, 1.2);
            break;
          case 'magnet':
            player.activateMagnet();
            floatingTexts.spawn('MAGNET OVERLOAD!', player.x, player.y - 35, '#9d4edd', 15, 1.2);
            break;
        }
      }
    });
  }

  triggerBomb() {
    const { player, bulletPool, enemyPool, boss, particles, audio, renderer, floatingTexts } = this.game;

    if (player.bombs <= 0) return false;

    player.bombs--;
    audio.playBomb();
    renderer.triggerShake(20, 0.8);
    particles.spawnBombShockwave(player.x, player.y);

    floatingTexts.spawn('EMP DETONATED!', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT * 0.45, '#00f5ff', 22, 1.5);

    // 1. Vaporize all enemy bullets
    bulletPool.forEachActive((bullet) => {
      if (bullet.isEnemy) {
        particles.spawnHitSparks(bullet.x, bullet.y, 4, '#00f5ff');
        bulletPool.free(bullet);
      }
    });

    // 2. Annihilate/Damage all active enemies
    enemyPool.forEachActive((enemy) => {
      particles.spawnExplosion(enemy.x, enemy.y, 1.2);
      const isDead = enemy.takeDamage(CONFIG.PLAYER.BOMB_DAMAGE || 50);
      if (isDead) {
        enemyPool.free(enemy);
        const killInfo = player.registerKill(enemy.score);
        floatingTexts.spawn(`+${killInfo.gained}`, enemy.x, enemy.y, '#ffffff', 13, 0.7);
      }
    });

    // 3. Heavy damage to Boss
    if (boss._active && boss.isVulnerable) {
      particles.spawnExplosion(boss.x, boss.y, 1.8, true);
      const defeated = boss.takeDamage(35);
      if (defeated) {
        audio.playExplosionLarge();
        const killInfo = player.registerKill(CONFIG.BOSS.SCORE);
        floatingTexts.spawn(`BOSS DESTROYED! +${killInfo.gained}`, boss.x, boss.y - 40, '#ffbe0b', 18, 1.8);
      }
    }

    return true;
  }

  spawnRandomPowerup(x, y) {
    const rand = Math.random();
    let accumulated = 0;
    let chosenType = 'weapon';

    for (let i = 0; i < CONFIG.POWERUPS.TYPES.length; i++) {
      accumulated += CONFIG.POWERUPS.WEIGHTS[i];
      if (rand <= accumulated) {
        chosenType = CONFIG.POWERUPS.TYPES[i];
        break;
      }
    }

    this.spawnPowerup(chosenType, x, y);
  }

  spawnPowerup(type, x, y) {
    const p = this.game.powerupPool.obtain();
    p.init(type, x, y);
  }
}
