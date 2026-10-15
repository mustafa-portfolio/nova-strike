import { CONFIG } from '../config.js';
import { Pool } from '../core/Pool.js';

class FloatingTextItem {
  constructor() {
    this.reset();
  }

  reset() {
    this.text = '';
    this.x = 0;
    this.y = 0;
    this.vy = -55;
    this.color = '#ffffff';
    this.size = 14;
    this.life = 0;
    this.maxLife = 0.8;
  }
}

export class FloatingTextManager {
  constructor() {
    this.pool = new Pool(() => new FloatingTextItem(), CONFIG.POOLS.FLOATING_TEXTS);
  }

  spawn(text, x, y, color = '#ffffff', size = 14, duration = 0.8) {
    const item = this.pool.obtain();
    item.text = text;
    item.x = x;
    item.y = y;
    item.vy = -60;
    item.color = color;
    item.size = size;
    item.maxLife = duration;
    item.life = duration;
  }

  update(dt) {
    this.pool.forEachActive((item) => {
      item.life -= dt;
      if (item.life <= 0) {
        this.pool.free(item);
        return;
      }
      item.y += item.vy * dt;
    });
  }

  render(ctx) {
    this.pool.forEachActive((item) => {
      const alpha = Math.max(0, item.life / item.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${item.size}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = item.color;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 8;
      ctx.fillText(item.text, item.x, item.y);
      ctx.restore();
    });
  }

  clear() {
    this.pool.clear();
  }
}
