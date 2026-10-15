import { CONFIG } from '../config.js';

export class Background {
  constructor() {
    this.stars = [];
    this.planets = [];
    this.nebulaBlobs = [];
    this.themeIndex = 0;
    this.targetThemeIndex = 0;
    this.themeTransition = 1.0;

    // Defined Color Palettes for escalating wave themes
    this.themes = [
      { name: 'Cosmic Sapphire', top: '#0a1332', bottom: '#050711', nebula: 'rgba(0, 150, 255, 0.08)' },
      { name: 'Crimson Void (Boss)', top: '#2c0712', bottom: '#0f0206', nebula: 'rgba(255, 0, 85, 0.12)' },
      { name: 'Electric Amethyst', top: '#1c0836', bottom: '#090314', nebula: 'rgba(180, 0, 255, 0.09)' },
      { name: 'Solar Flare (Boss)', top: '#381604', bottom: '#140701', nebula: 'rgba(255, 140, 0, 0.12)' },
      { name: 'Emerald Abyss', top: '#06261d', bottom: '#020f0b', nebula: 'rgba(0, 255, 170, 0.08)' }
    ];

    this.initStars();
    this.initNebulas();
  }

  initStars() {
    this.stars = [];
    // 3 layers of stars
    for (let i = 0; i < 70; i++) {
      const layer = i < 40 ? 1 : i < 60 ? 2 : 3;
      this.stars.push({
        x: Math.random() * CONFIG.CANVAS_WIDTH,
        y: Math.random() * CONFIG.CANVAS_HEIGHT,
        layer: layer,
        size: layer === 1 ? 1 : layer === 2 ? 1.5 : 2.2,
        speed: layer === 1 ? 24 : layer === 2 ? 65 : 125,
        alpha: layer === 1 ? 0.4 : layer === 2 ? 0.7 : 0.95,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 1 + Math.random() * 3
      });
    }
  }

  initNebulas() {
    this.nebulaBlobs = [
      { x: CONFIG.CANVAS_WIDTH * 0.3, y: 150, radius: 180, vy: 14 },
      { x: CONFIG.CANVAS_WIDTH * 0.7, y: 550, radius: 220, vy: 16 }
    ];

    // Distant background planet
    this.planets = [
      {
        x: CONFIG.CANVAS_WIDTH * 0.75,
        y: -100,
        radius: 46,
        vy: 8,
        hasRing: true,
        color1: '#4361ee',
        color2: '#3f37c9',
        active: true
      }
    ];
  }

  setWave(waveNumber) {
    if (waveNumber % 5 === 0) {
      // Boss waves get dramatic Crimson/Solar themes
      this.targetThemeIndex = (Math.floor(waveNumber / 5) % 2 === 1) ? 1 : 3;
    } else {
      const idx = ((Math.floor((waveNumber - 1) / 5) * 2) % (this.themes.length - 1));
      this.targetThemeIndex = idx === 1 ? 2 : idx === 3 ? 4 : idx;
    }

    if (this.targetThemeIndex !== this.themeIndex) {
      this.themeIndex = this.targetThemeIndex;
    }
  }

  update(dt) {
    // 1. Update stars
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      s.y += s.speed * dt;
      s.twinklePhase += s.twinkleSpeed * dt;

      if (s.y > CONFIG.CANVAS_HEIGHT) {
        s.y = -5;
        s.x = Math.random() * CONFIG.CANVAS_WIDTH;
      }
    }

    // 2. Update nebula clouds
    for (let i = 0; i < this.nebulaBlobs.length; i++) {
      const n = this.nebulaBlobs[i];
      n.y += n.vy * dt;
      if (n.y - n.radius > CONFIG.CANVAS_HEIGHT) {
        n.y = -n.radius;
        n.x = Math.random() * CONFIG.CANVAS_WIDTH;
      }
    }

    // 3. Update planet
    for (let i = 0; i < this.planets.length; i++) {
      const p = this.planets[i];
      if (p.active) {
        p.y += p.vy * dt;
        if (p.y - p.radius * 2 > CONFIG.CANVAS_HEIGHT) {
          // Reset planet after long interval
          p.y = -180;
          p.x = 60 + Math.random() * (CONFIG.CANVAS_WIDTH - 120);
          p.radius = 35 + Math.random() * 25;
          p.hasRing = Math.random() < 0.6;
        }
      }
    }
  }

  render(ctx) {
    const theme = this.themes[this.themeIndex] || this.themes[0];

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
    bgGrad.addColorStop(0, theme.top);
    bgGrad.addColorStop(1, theme.bottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Nebula cosmic gas clouds
    for (let i = 0; i < this.nebulaBlobs.length; i++) {
      const n = this.nebulaBlobs[i];
      const nebGrad = ctx.createRadialGradient(n.x, n.y, 10, n.x, n.y, n.radius);
      nebGrad.addColorStop(0, theme.nebula);
      nebGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = nebGrad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant Planet
    for (let i = 0; i < this.planets.length; i++) {
      const p = this.planets[i];
      if (p.y + p.radius > 0 && p.y - p.radius < CONFIG.CANVAS_HEIGHT) {
        ctx.save();
        ctx.translate(p.x, p.y);

        // Planet body
        const pGrad = ctx.createRadialGradient(-p.radius * 0.3, -p.radius * 0.3, 2, 0, 0, p.radius);
        pGrad.addColorStop(0, p.color1);
        pGrad.addColorStop(0.7, p.color2);
        pGrad.addColorStop(1, '#050711');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Planetary ring
        if (p.hasRing) {
          ctx.rotate(-0.35);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.radius * 1.8, p.radius * 0.38, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // Starfield layers
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      const twinkle = 0.75 + Math.sin(s.twinklePhase) * 0.25;
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = s.alpha * twinkle;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }
}
