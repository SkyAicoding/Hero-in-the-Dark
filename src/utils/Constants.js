// ── Game Configuration ──
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 480;
export const TILE_SIZE = 16;
export const SCALE_FACTOR = 2;

// ── Physics ──
export const GRAVITY = 800;

// ── Player ──
export const PLAYER = {
  MOVE_SPEED: 160,
  ACCELERATION: 900,
  DECELERATION: 1200,
  JUMP_FORCE: -330,
  AIR_JUMP_FORCE: -270,
  MAX_JUMPS: 2,
  COYOTE_TIME: 80,
  JUMP_BUFFER: 100,

  ATTACK_RANGE: 48,
  ATTACK_COOLDOWN: 400,
  INVINCIBLE_TIME: 1000,
  KNOCKBACK_FORCE: 200,

  BASE_HP: 100,
  BASE_ATK: 10,
  BASE_DEF: 5,
  BASE_CRT: 5,
  BASE_SPD: 100,
};

// ── Enemy: Boar ──
export const BOAR = {
  HP: 30,
  ATK: 8,
  DEF: 2,
  EXP: 15,
  DETECT_RANGE: 140,
  CHARGE_RANGE: 80,
  WALK_SPEED: 40,
  RUN_SPEED: 130,
  STUN_DURATION: 800,
  PATROL_RANGE: 100,
};

// ── Enemy: Snail ──
export const SNAIL = {
  HP: 20,
  ATK: 5,
  DEF: 8,
  EXP: 10,
  WALK_SPEED: 25,
  HIDE_DEF_MULTIPLIER: 3,
  DETECT_RANGE: 60,
};

// ── Enemy: Bee ──
export const BEE = {
  HP: 25,
  ATK: 18,
  DEF: 3,
  EXP: 35,
  FLY_SPEED: 70,
  DIVE_SPEED: 200,
  DETECT_RANGE: 160,
  AMPLITUDE: 30,
};

// ── Combat ──
export const COMBAT = {
  HIT_STOP_DURATION: 60,
  SCREEN_SHAKE_INTENSITY: 2,
  SCREEN_SHAKE_DURATION: 100,
  DAMAGE_NUMBER_DURATION: 800,
  KNOCKBACK_DURATION: 200,
};

// ── Depths (z-ordering) ──
export const DEPTH = {
  BG_SKY: 0,
  BG_FAR: 10,
  BG_MID: 20,
  BG_NEAR: 30,
  TILEMAP: 100,
  ITEMS: 150,
  ENEMIES: 200,
  PLAYER: 300,
  FOREGROUND: 400,
  PARTICLES: 500,
  UI: 1000,
};

// ── Scene Keys ──
export const SCENES = {
  BOOT: 'BootScene',
  TITLE: 'TitleScene',
  GAME: 'GameScene',
  UI: 'UIScene',
};

// ── Animation Keys ──
export const ANIMS = {
  PLAYER_IDLE: 'player-idle',
  PLAYER_RUN: 'player-run',
  PLAYER_ATTACK: 'player-attack',
  PLAYER_JUMP_START: 'player-jump-start',
  PLAYER_JUMP_AIR: 'player-jump-air',
  PLAYER_JUMP_END: 'player-jump-end',
  PLAYER_DIE: 'player-die',

  BOAR_IDLE: 'boar-idle',
  BOAR_WALK: 'boar-walk',
  BOAR_RUN: 'boar-run',
  BOAR_HIT: 'boar-hit',

  SNAIL_WALK: 'snail-walk',
  SNAIL_HIDE: 'snail-hide',
  SNAIL_DIE: 'snail-die',

  BEE_FLY: 'bee-fly',
  BEE_ATTACK: 'bee-attack',
  BEE_HIT: 'bee-hit',
};
