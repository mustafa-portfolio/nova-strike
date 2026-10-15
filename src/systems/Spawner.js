import { CONFIG } from '../config.js';

export class Spawner {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.wave = 1;
    this.formationsRemaining = 0;
    this.spawnTimer = 2.0;
    this.isWaveActive = false;
    this.isBossWave = false;
    this.warningTimer = 0;
    this.waveTransitionTimer = 0;
    this.warningActive = false;
    this.waveClearedText = false;
  }

  startWave(waveNumber = 1) {
    this.wave = waveNumber;
    this.isWaveActive = true;
    this.waveClearedText = false;
    this.game.background.setWave(this.wave);

    if (this.wave % CONFIG.BOSS.INTERVAL_WAVES === 0) {
      // Boss Wave!
      this.isBossWave = true;
      this.warningActive = true;
      this.warningTimer = CONFIG.BOSS.WARNING_DURATION;
      this.formationsRemaining = 0;
      this.game.audio.playBossWarning();
    } else {
      // Standard Escalating Wave
      this.isBossWave = false;
      this.warningActive = false;
      // Formations scale with wave
      this.formationsRemaining = 3 + Math.min(8, Math.floor(this.wave * 1.2));
      this.spawnTimer = 1.2;
    }
  }

  update(dt) {
    if (!this.isWaveActive) return;

    // 1. Boss Warning Banner sequence
    if (this.warningActive) {
      this.warningTimer -= dt;
      if (this.warningTimer <= 0) {
        this.warningActive = false;
        // Spawn boss
        this.game.boss.spawn(this.wave);
      }
      return;
    }

    // 2. Boss Wave in progress
    if (this.isBossWave) {
      // If boss was defeated and deactivated, wait 2 seconds then advance wave
      if (!this.game.boss._active && !this.game.boss.isDying) {
        this.waveTransitionTimer += dt;
        if (this.waveTransitionTimer >= 2.5) {
          this.waveTransitionTimer = 0;
          this.startWave(this.wave + 1);
        }
      }
      return;
    }

    // 3. Regular wave formation spawning
    if (this.formationsRemaining > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnFormation();
        this.formationsRemaining--;
        // Interval between wave groups
        const speedFactor = Math.max(1.5, 2.8 - this.wave * 0.1);
        this.spawnTimer = speedFactor;
      }
    } else {
      // Check if all enemies in current wave are cleared
      if (this.game.enemyPool.activeCount === 0) {
        if (!this.waveClearedText) {
          this.waveClearedText = true;
          this.game.floatingTexts.spawn(
            `SECTOR ${this.wave} CLEARED!`,
            CONFIG.CANVAS_WIDTH / 2,
            CONFIG.CANVAS_HEIGHT * 0.4,
            '#00f5ff',
            20,
            2.0
          );
        }

        this.waveTransitionTimer += dt;
        if (this.waveTransitionTimer >= 2.2) {
          this.waveTransitionTimer = 0;
          this.startWave(this.wave + 1);
        }
      }
    }
  }

  spawnFormation() {
    const W = CONFIG.CANVAS_WIDTH;
    const patternType = Math.floor(Math.random() * 5);

    switch (patternType) {
      case 0:
        // V-Formation Scouts (5 scouts)
        this.spawnVFormation(W / 2, -40);
        break;

      case 1:
        // Zigzag Line Sweep (4 fighters)
        for (let i = 0; i < 4; i++) {
          const x = 60 + i * (W - 120) / 3;
          const e = this.game.enemyPool.obtain();
          e.init('zigzag', x, -30 - (i % 2) * 40);
        }
        break;

      case 2:
        // Gunship Escort Convoy (1 Gunship + 2 Scouts)
        const g = this.game.enemyPool.obtain();
        g.init('gunship', W / 2, -60);
        
        [-60, 60].forEach((ox) => {
          const s = this.game.enemyPool.obtain();
          s.init('scout', W / 2 + ox, -40);
        });
        break;

      case 3:
        // Kamikaze Strike Wing (2-3 kamikazes)
        const kCount = this.wave > 3 ? 3 : 2;
        for (let i = 0; i < kCount; i++) {
          const k = this.game.enemyPool.obtain();
          const x = 80 + Math.random() * (W - 160);
          k.init('kamikaze', x, -30 - i * 50);
        }
        break;

      case 4:
        // Pincer Flank Attack (Scouts from left and right)
        for (let i = 0; i < 3; i++) {
          const s1 = this.game.enemyPool.obtain();
          s1.init('scout', 45, -30 - i * 45);

          const s2 = this.game.enemyPool.obtain();
          s2.init('scout', W - 45, -30 - i * 45);
        }
        break;
    }
  }

  spawnVFormation(centerX, startY) {
    const positions = [
      { ox: 0, oy: 0 },
      { ox: -38, oy: -32 },
      { ox: 38, oy: -32 },
      { ox: -76, oy: -64 },
      { ox: 76, oy: -64 }
    ];

    positions.forEach((pos) => {
      const e = this.game.enemyPool.obtain();
      e.init('scout', centerX + pos.ox, startY + pos.oy);
    });
  }
}
