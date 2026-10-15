import { StorageService } from './Storage.js';

export class MenuController {
  constructor(game) {
    this.game = game;

    // Elements
    this.screenMain = document.getElementById('screen-main');
    this.screenPause = document.getElementById('screen-pause');
    this.screenGameOver = document.getElementById('screen-gameover');
    this.touchControls = document.getElementById('touch-controls');

    this.btnPlay = document.getElementById('btn-play');
    this.btnPause = document.getElementById('btn-pause');
    this.btnResume = document.getElementById('btn-resume');
    this.btnRestartPause = document.getElementById('btn-restart-pause');
    this.btnQuit = document.getElementById('btn-quit');
    this.btnRetry = document.getElementById('btn-retry');
    this.btnGameOverHome = document.getElementById('btn-gameover-home');

    this.toggleAudioBtn = document.getElementById('toggle-audio');
    this.toggleHapticsBtn = document.getElementById('toggle-haptics');
    this.audioIcon = document.getElementById('audio-icon');
    this.hapticsIcon = document.getElementById('haptics-icon');

    this.bombBtn = document.getElementById('btn-bomb');
    this.bombBadge = document.getElementById('bomb-badge');

    this.previewCanvas = document.getElementById('preview-canvas');

    this.bindEvents();
    this.refreshMenuStats();
    this.startPreviewAnimation();
  }

  bindEvents() {
    this.btnPlay.addEventListener('click', () => {
      this.game.audio.unlock();
      this.game.startNewGame();
    });

    this.btnPause.addEventListener('click', () => {
      this.game.pauseGame();
    });

    this.btnResume.addEventListener('click', () => {
      this.game.resumeGame();
    });

    this.btnRestartPause.addEventListener('click', () => {
      this.game.startNewGame();
    });

    this.btnQuit.addEventListener('click', () => {
      this.showScreen('main');
    });

    this.btnRetry.addEventListener('click', () => {
      this.game.startNewGame();
    });

    this.btnGameOverHome.addEventListener('click', () => {
      this.showScreen('main');
    });

    // Sound toggle
    this.toggleAudioBtn.addEventListener('click', () => {
      const enabled = this.game.audio.toggleMute();
      this.updateAudioButtonState(enabled);
    });

    // Haptics toggle
    this.toggleHapticsBtn.addEventListener('click', () => {
      const enabled = this.game.audio.toggleHaptics();
      this.updateHapticsButtonState(enabled);
    });

    this.updateAudioButtonState(!this.game.audio.isMuted);
    this.updateHapticsButtonState(this.game.audio.hapticsEnabled);
  }

  updateAudioButtonState(enabled) {
    this.toggleAudioBtn.classList.toggle('off', !enabled);
    this.toggleAudioBtn.querySelector('.toggle-text').textContent = `SOUND: ${enabled ? 'ON' : 'OFF'}`;
    this.audioIcon.textContent = enabled ? '🔊' : '🔇';
  }

  updateHapticsButtonState(enabled) {
    this.toggleHapticsBtn.classList.toggle('off', !enabled);
    this.toggleHapticsBtn.querySelector('.toggle-text').textContent = `HAPTICS: ${enabled ? 'ON' : 'OFF'}`;
    this.hapticsIcon.textContent = enabled ? '📳' : '🔕';
  }

  showScreen(name) {
    this.screenMain.classList.add('hidden');
    this.screenMain.classList.remove('active');
    this.screenPause.classList.add('hidden');
    this.screenPause.classList.remove('active');
    this.screenGameOver.classList.add('hidden');
    this.screenGameOver.classList.remove('active');

    if (name === 'main') {
      this.screenMain.classList.remove('hidden');
      this.screenMain.classList.add('active');
      this.touchControls.style.display = 'none';
      this.refreshMenuStats();
    } else if (name === 'pause') {
      this.screenPause.classList.remove('hidden');
      this.screenPause.classList.add('active');
      this.touchControls.style.display = 'none';

      document.getElementById('pause-score').textContent = Math.round(this.game.player.score).toLocaleString();
      document.getElementById('pause-wave').textContent = this.game.spawner.wave;
    } else if (name === 'gameover') {
      this.screenGameOver.classList.remove('hidden');
      this.screenGameOver.classList.add('active');
      this.touchControls.style.display = 'none';
      this.presentGameOver();
    } else if (name === 'game') {
      this.touchControls.style.display = 'flex';
    }
  }

  updateInGameControls() {
    const bombs = this.game.player.bombs;
    this.bombBadge.textContent = bombs;
    if (bombs <= 0) {
      this.bombBtn.classList.add('disabled');
    } else {
      this.bombBtn.classList.remove('disabled');
    }
  }

  refreshMenuStats() {
    const highScore = StorageService.getHighScore();
    const maxWave = StorageService.getMaxWave();
    document.getElementById('menu-high-score').textContent = highScore.toLocaleString();
    document.getElementById('menu-max-wave').textContent = maxWave;
  }

  presentGameOver() {
    const { player, spawner } = this.game;
    const finalScore = player.score;
    const oldBest = StorageService.getHighScore();
    const isNewBest = finalScore > oldBest && finalScore > 0;

    if (isNewBest) {
      StorageService.setHighScore(finalScore);
    }
    if (spawner.wave > StorageService.getMaxWave()) {
      StorageService.setMaxWave(spawner.wave);
    }

    const banner = document.getElementById('new-high-score-banner');
    if (isNewBest) {
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }

    document.getElementById('final-wave').textContent = `WAVE ${spawner.wave}`;
    document.getElementById('final-kills').textContent = player.kills;
    document.getElementById('final-accuracy').textContent = `${player.getAccuracy()}%`;
    document.getElementById('final-combo').textContent = `${player.maxCombo}x`;
    document.getElementById('final-best').textContent = Math.max(finalScore, oldBest).toLocaleString();

    // Score count-up juice
    const scoreEl = document.getElementById('final-score');
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();

    const animateCount = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (finalScore - start) * ease);
      scoreEl.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };
    requestAnimationFrame(animateCount);
  }

  startPreviewAnimation() {
    if (!this.previewCanvas) return;
    const ctx = this.previewCanvas.getContext('2d');
    let angle = 0;

    const renderPreview = () => {
      ctx.clearRect(0, 0, 120, 140);
      ctx.save();
      ctx.translate(60, 68);
      ctx.scale(1.35, 1.35);

      angle += 0.02;
      const tilt = Math.sin(angle) * 0.2;

      // Mock player object for preview renderer
      const mockPlayer = {
        x: 0,
        y: 0,
        tiltAngle: tilt,
        invulnerableTimer: 0,
        weaponTier: 3,
        hasShield: true
      };

      this.game.renderer.drawPlayer(mockPlayer, ctx);
      ctx.restore();

      requestAnimationFrame(renderPreview);
    };

    renderPreview();
  }
}
