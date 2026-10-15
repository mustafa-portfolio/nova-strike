import { CONFIG } from '../config.js';
import { Viewport } from './Viewport.js';
import { Loop } from './Loop.js';
import { AudioService } from './Audio.js';
import { Renderer } from './Renderer.js';
import { Input } from './Input.js';
import { Pool } from './Pool.js';

import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { Bullet } from '../entities/Bullet.js';
import { Powerup } from '../entities/Powerup.js';

import { Background } from '../systems/Background.js';
import { ParticleSystem } from '../systems/Particles.js';
import { FloatingTextManager } from '../systems/FloatingText.js';
import { CollisionSystem } from '../systems/Collision.js';
import { Spawner } from '../systems/Spawner.js';

import { HUD } from '../ui/HUD.js';
import { MenuController } from '../ui/Menus.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.viewport = new Viewport(canvas);
    this.renderer = new Renderer(this.viewport.ctx);
    this.audio = new AudioService();

    // Zero-allocation Pools
    this.bulletPool = new Pool(() => new Bullet(), CONFIG.POOLS.PLAYER_BULLETS + CONFIG.POOLS.ENEMY_BULLETS);
    this.enemyPool = new Pool(() => new Enemy(), CONFIG.POOLS.ENEMIES);
    this.powerupPool = new Pool(() => new Powerup(), CONFIG.POOLS.POWERUPS);

    // Entities
    this.player = new Player(this.audio);
    this.boss = new Boss();

    // Systems
    this.background = new Background();
    this.particles = new ParticleSystem();
    this.floatingTexts = new FloatingTextManager();
    this.collision = new CollisionSystem(this);
    this.spawner = new Spawner(this);

    // UI
    this.hud = new HUD(this);
    this.menu = new MenuController(this);

    // Input
    this.input = new Input(
      this.viewport,
      () => this.collision.triggerBomb(),
      () => this.audio.unlock()
    );

    // State
    this.state = 'menu'; // 'menu', 'playing', 'paused', 'gameover'

    // Fixed 60 FPS Loop with accumulator
    this.loop = new Loop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha),
      () => this.autoPause()
    );

    this.loop.start();
    this.menu.showScreen('main');
  }

  startNewGame() {
    this.bulletPool.clear();
    this.enemyPool.clear();
    this.powerupPool.clear();
    this.particles.clear();
    this.floatingTexts.clear();

    this.player.reset();
    this.boss.reset();
    this.input.reset();

    this.spawner.reset();
    this.spawner.startWave(1);

    this.state = 'playing';
    this.menu.showScreen('game');
    this.loop.resume();
  }

  pauseGame() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.loop.pause();
    this.menu.showScreen('pause');
  }

  resumeGame() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.menu.showScreen('game');
    this.loop.resume();
  }

  autoPause() {
    if (this.state === 'playing') {
      this.pauseGame();
    }
  }

  handleGameOver() {
    this.state = 'gameover';
    this.audio.playGameOver();
    this.menu.showScreen('gameover');
  }

  update(dt) {
    // Background and screen shake update in all active states
    this.renderer.updateShake(dt);
    this.background.update(dt);
    this.particles.update(dt);
    this.floatingTexts.update(dt);

    if (this.state !== 'playing') {
      return;
    }

    // 1. Process keyboard movement relative inputs
    this.input.updateKeyboard(dt, this.player.x, this.player.y);

    // 2. Update active enemies list for homing target acquisition
    const activeEnemies = this.enemyPool.getActiveItems();

    // 3. Update Player
    this.player.update(dt, this.input, this.bulletPool, this.particles, activeEnemies, this.boss);

    // 4. Update Bullets
    this.bulletPool.forEachActive((bullet) => {
      const alive = bullet.update(dt, activeEnemies, this.boss);
      if (!alive) {
        this.bulletPool.free(bullet);
      }
    });

    // 5. Update Enemies
    this.enemyPool.forEachActive((enemy) => {
      const alive = enemy.update(dt, this.player, this.bulletPool, this.audio);
      if (!alive) {
        this.enemyPool.free(enemy);
      }
    });

    // 6. Update Boss
    if (this.boss._active) {
      this.boss.update(dt, this.player, this.bulletPool, this.audio, this.particles, () => {
        // Boss death sequence completed
      });
    }

    // 7. Update Power-up tokens
    this.powerupPool.forEachActive((p) => {
      const alive = p.update(dt, this.player);
      if (!alive) {
        this.powerupPool.free(p);
      }
    });

    // 8. Collisions & Interactions
    this.collision.checkCollisions();

    // 9. Wave Spawning Progression
    this.spawner.update(dt);

    // 10. Update UI controls (Bomb badge count)
    this.menu.updateInGameControls();
  }

  render(alpha) {
    const ctx = this.viewport.ctx;

    // Reset transform & scale to match current DPR and screen dimensions
    this.viewport.prepareContext();

    // 1. Render Background
    this.background.render(ctx);

    // 2. Apply Screen Shake Offset
    ctx.save();
    if (this.renderer.shakeDuration > 0) {
      ctx.translate(this.renderer.shakeOffset.x, this.renderer.shakeOffset.y);
    }

    // 3. Render Power-up items
    this.powerupPool.forEachActive((p) => {
      this.renderer.drawPowerup(p);
    });

    // 4. Render Enemies
    this.enemyPool.forEachActive((e) => {
      this.renderer.drawEnemy(e);
    });

    // 5. Render Boss Dreadnought
    if (this.boss._active) {
      this.renderer.drawBoss(this.boss);
    }

    // 6. Render Player Rocket
    if (this.state === 'playing' || this.state === 'paused') {
      this.renderer.drawPlayer(this.player);
    }

    // 7. Render Bullets & Missiles
    this.bulletPool.forEachActive((b) => {
      this.renderer.drawBullet(b);
    });

    // 8. Render Particles & Shockwaves
    this.particles.render(ctx);

    ctx.restore(); // Restore shake offset

    // 9. Render Floating Texts
    this.floatingTexts.render(ctx);

    // 10. Render HUD (only when playing or paused)
    if (this.state === 'playing' || this.state === 'paused') {
      this.hud.render(ctx);
    }
  }
}
