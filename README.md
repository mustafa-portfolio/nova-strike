# 🚀 NOVA STRIKE — Vertical Mobile Arcade Rocket Shooter

[![PWA Ready](https://img.shields.io/badge/PWA-Installable-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Vite](https://img.shields.io/badge/Bundler-Vite%206-646CFF.svg)](https://vitejs.dev)
[![Web Audio](https://img.shields.io/badge/Audio-Synthesized%20Web%20Audio-00f5ff.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Vanilla JS](https://img.shields.io/badge/Engine-Vanilla%20JS%20%2B%20Canvas-f7df1e.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

**NOVA STRIKE** is a vertical-scrolling mobile arcade rocket shooter built with **HTML5 Canvas**, **Vanilla JavaScript (ES Modules)**, and **Web Audio API** synthesized sound effects. It requires zero external image or audio assets—all visuals are procedurally rendered vector graphics with glowing laser trails and particle physics, and all sound effects are synthesized on the fly.

---

## 🎮 Mobile-First Controls

- **Drag Anywhere on Screen**: The rocket follows your finger smoothly with responsive lerp interpolation.
  - *Finger Offset*: The ship is automatically offset vertically (`-60px`) above your touch point so your thumb never obscures the rocket or incoming danger!
  - *Banking Tilt*: Dynamically rolls and banks (-16° to +16°) based on horizontal velocity.
- **Auto-Fire**: Ship automatically discharges weapons continuously whenever a finger is touching the screen.
- **EMP Bomb (Screen Clearing)**:
  - **Second-Finger Tap**: Tap anywhere on screen with a second finger to instantly detonate a bomb.
  - **Bomb Button**: Or tap the glowing bottom-right corner EMP button with real-time ammo badge.
  - *Effect*: Vaporizes all enemy bullets on screen, decimates active fighters, and heavily damages the boss!
- **Desktop Testing Support**:
  - Drag with Mouse (left button held down).
  - Keyboard movement: `WASD` or `Arrow Keys`.
  - Bomb detonation: `Spacebar` or `B` key.
- **Mobile Gesture Locking**: Pull-to-refresh, double-tap zoom, pinch-zoom, and iOS context menus are completely suppressed for smooth native app feel.

---

## 🕹️ Gameplay & Mechanics

### Enemy Aircraft Catalog
1. **Scout Interceptor**: Fast, nimble arrow-wing drone with dual thrusters (1 HP, linear attack runs).
2. **Zigzag Stealth Fighter**: Delta-wing fighter with oscillating sine-wave evasive maneuvers (2 HP).
3. **Armored Gunship**: Heavy tactical cruiser with twin plasma turrets that target the player (7 HP).
4. **Kamikaze Strike Drone**: Dagger drone that tracks the player's position before committing to an afterburner dive attack (2 HP).
5. **Sector Boss — "Goliath Dreadnought"**: Appears every 5 waves (Wave 5, 10, 15...).
   - **Phase 1 (100%–66% HP)**: 5-way spread cannons + dual pulse volleys.
   - **Phase 2 (66%–33% HP)**: Dual wing-pod tracking volleys + circular 8-way energy rings.
   - **Phase 3 (33%–0% HP)**: Berserk spiral bullet hell storm + concentrated cluster barrage.
   - *Death*: Violent cascading hull explosions, screen shake, and 1.6-second slow-motion sequence.

### Power-Ups & Upgrades
- **Weapon Upgrade (W)**:
  - *Tier 1*: High-velocity single laser beam.
  - *Tier 2*: Dual parallel heavy cannons.
  - *Tier 3*: Triple spread lasers (-11°, 0°, +11°).
  - *Tier 4*: Triple spread lasers + twin homing micro-missiles!
  *(Weapon level drops by 1 when hit).*
- **Energy Shield (S)**: Translucent forcefield bubble with rotating harmonic nodes; absorbs one full hit.
- **EMP Bomb (+1 B)**: Replenishes limited-use screen-clearing tactical bomb (up to 5 max).
- **2X Score Boost (2X)**: Doubles all points for 12 seconds.
- **Magnetic Collector (M)**: Generates a high-power magnetic field pulling all drops rapidly toward the ship for 10 seconds.

### Combo Multiplier System
- Consecutive kills within **1.5 seconds** build the combo counter.
- Multiplier ramps up from **1.0x to 5.0x** (+0.25x per kill).
- Accompanied by ascending audio pitch feedback and floating combo text!

---

## 🎨 Visual & Audio Polish ("Game Feel")
- **Procedural Vector Art**: Sleek rocket chassis with cockpit gradient, thruster nozzles, animated particle exhaust flames, and hit-flash on damage.
- **Synthesized Web Audio**:
  - Frequency-swept laser chirps & missile whooshes.
  - Layered white noise + sub-bass drop explosions.
  - Harmonic 3-note ascending arpeggio for power-ups.
  - Ominous dual-tone klaxon alarm on Boss warning.
  - Dynamic audio unlock on first touch gesture + persistent mute toggle.
- **Multi-Layer Parallax Background**:
  - 3 starfield layers with varying speeds and twinkle phases.
  - Soft drifting nebula gas clouds.
  - Distant orbital planets with planetary rings.
  - Dynamic color theme transitions (Cosmic Sapphire -> Crimson Void -> Electric Amethyst -> Solar Flare).
- **Juicy Haptic Feedback**: Context-aware vibration patterns via `navigator.vibrate` for laser hits, explosions, bombs, and boss alarms.
- **Screen Shake**: Decaying randomized camera shake on explosions, boss hits, and bomb detonation.

---

## 📦 Project Structure

```
rocket-shooter/
├── index.html              # Mobile viewport meta, safe-area layout, HUD & overlays
├── manifest.json           # PWA standalone manifest with portrait-primary orientation
├── package.json            # Vite configuration and scripts
├── vite.config.js          # Dev server with host mode for mobile Wi-Fi testing
├── public/
│   ├── favicon.svg         # Vector rocket icon
│   └── sw.js               # Offline service worker caching
├── src/
│   ├── main.js             # Engine initialization and PWA lifecycle
│   ├── config.js           # Central balancing variables (speeds, HP, weapons, timers)
│   ├── style.css           # Mobile styling, touch-action: none, responsive safe areas
│   ├── core/
│   │   ├── Game.js         # Master game director
│   │   ├── Loop.js         # 60 FPS fixed timestep with accumulator & auto-pause
│   │   ├── Viewport.js     # Retina DPR scaling & virtual coordinates (450x800)
│   │   ├── Input.js        # Multi-touch, mouse, keyboard and gesture preventer
│   │   ├── Audio.js        # Web Audio API procedural sound synthesizer
│   │   ├── Renderer.js     # Vector graphics drawing pipeline
│   │   └── Pool.js         # Zero-allocation O(1) object pool
│   ├── entities/
│   │   ├── Player.js       # Rocket physics, weapons, homing missiles, shield
│   │   ├── Enemy.js        # Scout, Zigzag, Gunship, Kamikaze flight AI
│   │   ├── Boss.js         # 3-phase Goliath Dreadnought
│   │   ├── Bullet.js       # Lasers, plasma spheres, and homing missiles
│   │   └── Powerup.js      # Drift and magnetic pull physics
│   ├── systems/
│   │   ├── Spawner.js      # Wave formations and boss escalation
│   │   ├── Collision.js    # Forgiving circle hitboxes and EMP bomb
│   │   ├── Particles.js    # Pooled exhaust, sparks, smoke, and shockwaves
│   │   ├── Background.js   # Parallax stars, nebulas, planets, and color palettes
│   │   └── FloatingText.js # Floating scores, combo alerts, and warnings
│   └── ui/
│       ├── HUD.js          # In-game lives, score, combo bar, and boss health bar
│       ├── Menus.js        # Main menu with preview rocket, pause, and game over
│       └── Storage.js      # High score and settings persistence in localStorage
```

---

## 🚀 Running & Playing

### 1. Install & Start Development Server
```bash
npm install
npm run dev
```

### 2. Testing on Mobile Device via Local Network
Because `vite.config.js` is configured with `host: true`, Vite prints a local network URL in your terminal:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.xxx:5173/
```
1. Ensure your smartphone (iPhone or Android) is connected to the same Wi-Fi network.
2. Open Safari or Chrome on your phone and navigate to `http://192.168.1.xxx:5173/`.
3. Enjoy full touch controls!

### 3. Installing as a Fullscreen PWA
- **iOS Safari**: Tap the **Share** button in the Safari toolbar -> select **"Add to Home Screen"**. The game will launch in portrait fullscreen without browser toolbars.
- **Android Chrome**: Tap the three-dot menu -> select **"Install app"** or **"Add to Home screen"**.

### 4. Production Build
```bash
npm run build
npm run preview
```
The optimized production bundle in `/dist` is completely static and ready for instant deployment to Vercel, Netlify, GitHub Pages, or Cloudflare Pages.
