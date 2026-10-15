import { CONFIG } from '../config.js';

export class StorageService {
  static getHighScore() {
    try {
      return parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.HIGH_SCORE) || '0', 10);
    } catch {
      return 0;
    }
  }

  static setHighScore(score) {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.HIGH_SCORE, score.toString());
    } catch {}
  }

  static getMaxWave() {
    try {
      return parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.MAX_WAVE) || '1', 10);
    } catch {
      return 1;
    }
  }

  static setMaxWave(wave) {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.MAX_WAVE, wave.toString());
    } catch {}
  }
}
