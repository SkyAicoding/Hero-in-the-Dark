import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';

/**
 * Actual sprite sheet dimensions (verified via identify):
 *
 * Player:
 *   Idle-Sheet:       256x80  → 4 frames  @ 64x80
 *   Run-Sheet:        640x80  → 8 frames  @ 80x80
 *   Attack-01-Sheet:  768x80  → 8 frames  @ 96x80
 *   Jump-Start-Sheet: 256x64  → 4 frames  @ 64x64
 *   Jump-All-Sheet:   960x64  → 15 frames @ 64x64
 *   Jump-End-Sheet:   192x64  → 3 frames  @ 64x64
 *   Dead-Sheet:       640x64  → 10 frames @ 64x64
 *
 * Boar (all 32px tall):
 *   Idle-Sheet:       192x32  → 4 frames  @ 48x32
 *   Walk-Base-Sheet:  288x32  → 6 frames  @ 48x32
 *   Run-Sheet:        288x32  → 6 frames  @ 48x32
 *   Hit-Sheet:        192x32  → 4 frames  @ 48x32
 *
 * Snail (all 32px tall):
 *   walk-Sheet:       384x32  → 8 frames  @ 48x32
 *   Hide-Sheet:       384x32  → 8 frames  @ 48x32
 *   Dead-Sheet:       384x32  → 8 frames  @ 48x32
 *
 * Bee (all 64px tall):
 *   Fly-Sheet:        256x64  → 4 frames  @ 64x64
 *   Attack-Sheet:     256x64  → 4 frames  @ 64x64
 *   Hit-Sheet:        256x64  → 4 frames  @ 64x64
 */

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload() {
    // ── Loading bar ──
    const barW = 300, barH = 20;
    const barX = (GAME_WIDTH - barW) / 2;
    const barY = GAME_HEIGHT / 2;

    const bg = this.add.rectangle(barX + barW / 2, barY, barW, barH, 0x222222).setOrigin(0.5);
    const fill = this.add.rectangle(barX + 2, barY, 0, barH - 4, 0x44aa44).setOrigin(0, 0.5);

    const loadingText = this.add.text(GAME_WIDTH / 2, barY - 30, 'Loading...', {
      fontFamily: 'monospace', fontSize: '16px', color: '#cccccc'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      fill.width = (barW - 4) * value;
    });

    this.load.on('complete', () => {
      bg.destroy();
      fill.destroy();
      loadingText.destroy();
    });

    // ── Player sprites ──
    this.load.spritesheet('player-idle', 'sprites/player/Idle-Sheet.png', {
      frameWidth: 64, frameHeight: 80
    });
    this.load.spritesheet('player-run', 'sprites/player/Run-Sheet.png', {
      frameWidth: 80, frameHeight: 80
    });
    this.load.spritesheet('player-attack', 'sprites/player/Attack-01-Sheet.png', {
      frameWidth: 96, frameHeight: 80
    });
    this.load.spritesheet('player-jump-start', 'sprites/player/Jump-Start-Sheet.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('player-jump-air', 'sprites/player/Jump-All-Sheet.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('player-jump-end', 'sprites/player/Jump-End-Sheet.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('player-die', 'sprites/player/Dead-Sheet.png', {
      frameWidth: 64, frameHeight: 64
    });

    // ── Enemy: Boar ──
    this.load.spritesheet('boar-idle', 'sprites/enemies/boar/Idle-Sheet.png', {
      frameWidth: 48, frameHeight: 32
    });
    this.load.spritesheet('boar-walk', 'sprites/enemies/boar/Walk-Base-Sheet.png', {
      frameWidth: 48, frameHeight: 32
    });
    this.load.spritesheet('boar-run', 'sprites/enemies/boar/Run-Sheet.png', {
      frameWidth: 48, frameHeight: 32
    });
    this.load.spritesheet('boar-hit', 'sprites/enemies/boar/Hit-Sheet.png', {
      frameWidth: 48, frameHeight: 32
    });

    // ── Enemy: Snail ──
    this.load.spritesheet('snail-walk', 'sprites/enemies/snail/walk-Sheet.png', {
      frameWidth: 48, frameHeight: 32
    });
    this.load.spritesheet('snail-hide', 'sprites/enemies/snail/Hide-Sheet.png', {
      frameWidth: 48, frameHeight: 32
    });
    this.load.spritesheet('snail-die', 'sprites/enemies/snail/Dead-Sheet.png', {
      frameWidth: 48, frameHeight: 32
    });

    // ── Enemy: Bee ──
    this.load.spritesheet('bee-fly', 'sprites/enemies/bee/Fly-Sheet.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('bee-attack', 'sprites/enemies/bee/Attack-Sheet.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('bee-hit', 'sprites/enemies/bee/Hit-Sheet.png', {
      frameWidth: 64, frameHeight: 64
    });

    // ── Environment ──
    this.load.image('bg-sky', 'sprites/environment/Background.png');
    this.load.image('bg-trees', 'sprites/environment/Trees-Background.png');
    this.load.image('tiles-image', 'sprites/environment/Tiles.png');
    this.load.image('props-rocks', 'sprites/environment/Props-Rocks.png');
    this.load.image('buildings', 'sprites/environment/Buildings.png');

    // ── Trees ──
    this.load.image('tree-green', 'sprites/environment/Green-Tree.png');
    this.load.image('tree-dark', 'sprites/environment/Dark-Tree.png');
    this.load.image('tree-golden', 'sprites/environment/Golden-Tree.png');
    this.load.image('tree-red', 'sprites/environment/Red-Tree.png');

    // ── HUD ──
    this.load.image('hud-base', 'sprites/ui/Base-01.png');
  }

  create() {
    this.createAnimations();
    this.scene.start(SCENES.GAME);
  }

  createAnimations() {
    // ── Player Animations ──
    this.anims.create({
      key: 'player-idle',
      frames: this.anims.generateFrameNumbers('player-idle', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });

    this.anims.create({
      key: 'player-run',
      frames: this.anims.generateFrameNumbers('player-run', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'player-attack',
      frames: this.anims.generateFrameNumbers('player-attack', { start: 0, end: 7 }),
      frameRate: 14,
      repeat: 0
    });

    this.anims.create({
      key: 'player-jump-start',
      frames: this.anims.generateFrameNumbers('player-jump-start', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
      key: 'player-jump-air',
      frames: this.anims.generateFrameNumbers('player-jump-air', { start: 0, end: 14 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'player-jump-end',
      frames: this.anims.generateFrameNumbers('player-jump-end', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
      key: 'player-die',
      frames: this.anims.generateFrameNumbers('player-die', { start: 0, end: 9 }),
      frameRate: 8,
      repeat: 0
    });

    // ── Boar Animations ──
    this.anims.create({
      key: 'boar-idle',
      frames: this.anims.generateFrameNumbers('boar-idle', { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: 'boar-walk',
      frames: this.anims.generateFrameNumbers('boar-walk', { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1
    });

    this.anims.create({
      key: 'boar-run',
      frames: this.anims.generateFrameNumbers('boar-run', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'boar-hit',
      frames: this.anims.generateFrameNumbers('boar-hit', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 0
    });

    // ── Snail Animations ──
    this.anims.create({
      key: 'snail-walk',
      frames: this.anims.generateFrameNumbers('snail-walk', { start: 0, end: 7 }),
      frameRate: 6,
      repeat: -1
    });

    this.anims.create({
      key: 'snail-hide',
      frames: this.anims.generateFrameNumbers('snail-hide', { start: 0, end: 7 }),
      frameRate: 8,
      repeat: 0
    });

    this.anims.create({
      key: 'snail-die',
      frames: this.anims.generateFrameNumbers('snail-die', { start: 0, end: 7 }),
      frameRate: 8,
      repeat: 0
    });

    // ── Bee Animations ──
    this.anims.create({
      key: 'bee-fly',
      frames: this.anims.generateFrameNumbers('bee-fly', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'bee-attack',
      frames: this.anims.generateFrameNumbers('bee-attack', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
      key: 'bee-hit',
      frames: this.anims.generateFrameNumbers('bee-hit', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 0
    });
  }
}
