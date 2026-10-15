import { Game } from './core/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Failed to locate #game-canvas');
    return;
  }

  // Initialize master game engine
  const game = new Game(canvas);
  window.__NOVA_GAME__ = game;

  // Register PWA Service Worker for offline play and mobile installability
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  // Prevent drag-to-refresh or navigation bounce gestures on iOS Safari
  document.body.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });
});
