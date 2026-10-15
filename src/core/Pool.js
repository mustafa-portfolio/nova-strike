// Generic Object Pool to eliminate GC spikes on mobile devices

export class Pool {
  constructor(factoryFn, initialCapacity = 50) {
    this.factoryFn = factoryFn;
    this.items = [];
    this.activeCount = 0;

    for (let i = 0; i < initialCapacity; i++) {
      const item = this.factoryFn();
      item._active = false;
      item._poolIndex = i;
      this.items.push(item);
    }
  }

  obtain(...args) {
    let item;
    if (this.activeCount < this.items.length) {
      item = this.items[this.activeCount];
    } else {
      // Expand pool capacity if exhausted
      item = this.factoryFn();
      item._poolIndex = this.items.length;
      this.items.push(item);
    }

    item._active = true;
    this.activeCount++;

    if (args.length > 0 && typeof item.init === 'function') {
      item.init(...args);
    }
    return item;
  }

  free(item) {
    if (!item._active) return;

    item._active = false;
    this.activeCount--;

    // Fast O(1) swap with the last active item
    const currentIdx = item._poolIndex;
    const lastActiveIdx = this.activeCount;

    if (currentIdx !== lastActiveIdx) {
      const swapItem = this.items[lastActiveIdx];
      this.items[currentIdx] = swapItem;
      this.items[lastActiveIdx] = item;
      swapItem._poolIndex = currentIdx;
      item._poolIndex = lastActiveIdx;
    }

    if (typeof item.reset === 'function') {
      item.reset();
    }
  }

  forEachActive(callback) {
    // Traverse backwards so deactivation during iteration is safe
    for (let i = this.activeCount - 1; i >= 0; i--) {
      callback(this.items[i], i);
    }
  }

  getActiveItems() {
    return this.items.slice(0, this.activeCount);
  }

  clear() {
    for (let i = 0; i < this.activeCount; i++) {
      const item = this.items[i];
      item._active = false;
      if (typeof item.reset === 'function') {
        item.reset();
      }
    }
    this.activeCount = 0;
  }
}
