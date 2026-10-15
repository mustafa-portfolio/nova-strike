// Nova Strike - Global Game Configuration & Balancing

export const CONFIG = {
  // Logical Virtual Resolution (scaled to fit any mobile or desktop screen)
  CANVAS_WIDTH: 450,
  CANVAS_HEIGHT: 800,
  
  // Game Loop
  FIXED_STEP: 1 / 60, // 60 FPS fixed timestep
  MAX_FRAME_TIME: 0.25, // Prevent spiral of death on long lag spike

  // Controls & Feel
  CONTROLS: {
    TOUCH_OFFSET_Y: -60, // Pixels above touch point so finger never covers rocket
    TOUCH_LERP: 0.35,     // Responsiveness vs smoothing (0.35 is snappy yet smooth)
    KEYBOARD_SPEED: 420,  // Pixels per second for WASD / Arrow keys
    BANKING_MAX_ANGLE: 0.28, // Max tilt in radians (~16 degrees)
    BANKING_LERP: 0.18,   // Tilt smoothing
  },

  // Player Specs
  PLAYER: {
    INITIAL_LIVES: 3,
    MAX_LIVES: 5,
    INITIAL_BOMBS: 3,
    MAX_BOMBS: 5,
    HITBOX_RADIUS: 9,      // Forgiving inner core hitbox
    SHIP_WIDTH: 44,
    SHIP_HEIGHT: 48,
    INVULNERABLE_TIME: 2.2, // Seconds of blinking immunity after taking damage
    INVULNERABLE_BLINK_RATE: 16, // Blinks per second
    FIRE_RATE_BASE: 0.14,  // Seconds between shots
    BULLET_SPEED: 850,
    HOMING_MISSILE_INTERVAL: 0.45,
    MAGNET_RADIUS: 170,
    SHIELD_MAX_HITS: 1,
  },

  // Weapon Upgrade Tiers
  WEAPONS: {
    TIER_1: { name: 'SINGLE BEAM', level: 1, fireRate: 0.14, spread: 0 },
    TIER_2: { name: 'TWIN CANNONS', level: 2, fireRate: 0.12, spread: 14 },
    TIER_3: { name: 'TRIPLE SPREAD', level: 3, fireRate: 0.10, spreadAngle: 0.15 },
    TIER_4: { name: 'NOVA MISSILES', level: 4, fireRate: 0.09, spreadAngle: 0.22, homing: true }
  },

  // Enemies Specifications
  ENEMIES: {
    SCOUT: {
      type: 'scout',
      hp: 1,
      speed: 260,
      hitboxRadius: 16,
      score: 100,
      dropChance: 0.18
    },
    ZIGZAG: {
      type: 'zigzag',
      hp: 2,
      speed: 180,
      amplitude: 70,
      frequency: 3.2,
      hitboxRadius: 18,
      score: 250,
      dropChance: 0.25
    },
    GUNSHIP: {
      type: 'gunship',
      hp: 7,
      speed: 85,
      fireInterval: 1.8,
      bulletSpeed: 220,
      hitboxRadius: 26,
      score: 600,
      dropChance: 0.50
    },
    KAMIKAZE: {
      type: 'kamikaze',
      hp: 2,
      speed: 340,
      trackDuration: 0.75, // Seconds of tracking player position before diving
      hitboxRadius: 18,
      score: 400,
      dropChance: 0.30
    }
  },

  // Boss Battle
  BOSS: {
    INTERVAL_WAVES: 5, // Boss appears every 5 waves (Wave 5, 10, 15...)
    BASE_HP: 140,
    HP_PER_CYCLE: 80,
    WIDTH: 140,
    HEIGHT: 90,
    HITBOX_RADIUS: 52,
    SCORE: 10000,
    PHASE_2_THRESHOLD: 0.66,
    PHASE_3_THRESHOLD: 0.33,
    WARNING_DURATION: 3.0,
    SLOW_MO_DURATION: 1.6
  },

  // Powerups
  POWERUPS: {
    SPEED: 110,
    MAGNET_SPEED: 480,
    DURATION_MULTIPLIER: 12.0, // Seconds
    DURATION_MAGNET: 10.0,
    RADIUS: 18,
    TYPES: ['weapon', 'shield', 'bomb', 'multiplier', 'magnet'],
    WEIGHTS: [0.35, 0.20, 0.15, 0.15, 0.15] // Relative drop distribution
  },

  // Combo Mechanics
  COMBO: {
    TIMEOUT: 1.5,      // Consecutive kills within this timeframe increase combo
    MAX_MULTIPLIER: 5.0,
    INCREMENT: 0.25
  },

  // Pools Initial Allocations (to prevent any garbage collection during gameplay)
  POOLS: {
    PLAYER_BULLETS: 120,
    ENEMY_BULLETS: 240,
    ENEMIES: 60,
    PARTICLES: 400,
    POWERUPS: 30,
    FLOATING_TEXTS: 40
  },

  // Sound and Haptics
  STORAGE_KEYS: {
    HIGH_SCORE: 'nova_strike_highscore',
    MAX_WAVE: 'nova_strike_max_wave',
    SOUND_ENABLED: 'nova_strike_sound',
    HAPTICS_ENABLED: 'nova_strike_haptics'
  }
};
