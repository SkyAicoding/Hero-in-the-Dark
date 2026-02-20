import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, GRAVITY, DEPTH, PLAYER as PLAYER_CONST } from '../utils/Constants.js';
import Player from '../entities/Player.js';
import Boar from '../entities/Boar.js';
import HUD from '../ui/HUD.js';

const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 960;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.GAME });
  }

  create() {
    // ── World bounds ──
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // ── Parallax Background ──
    this.createBackground();

    // ── Generate 1x1 pixel texture for invisible collision bodies ──
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffffff);
    gfx.fillRect(0, 0, 1, 1);
    gfx.generateTexture('_pixel', 1, 1);
    gfx.destroy();

    // ── Procedural Level ──
    this.platforms = this.physics.add.staticGroup();
    this.createLevel();

    // ── Player ──
    this.player = new Player(this, 120, WORLD_HEIGHT - 200);
    this.player.setCollideWorldBounds(true);

    // ── Enemies ──
    this.enemies = this.add.group();
    this.spawnEnemies();

    // ── Collisions ──
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

    // Player attack → enemies
    this.physics.add.overlap(
      this.player.attackHitbox,
      this.enemies,
      this.onAttackHitEnemy,
      null,
      this
    );

    // Enemy body → player (contact damage)
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.onEnemyContactPlayer,
      null,
      this
    );

    // ── Camera ──
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(40, 30);

    // ── HUD ──
    this.hud = new HUD(this);
    this.hud.updateAll(this.player.stats);

    // ── Decoration ──
    this.createDecorations();

    // ── Death / Respawn ──
    this.events.on('player-died', this.onPlayerDied, this);

    // ── Enemy respawn timer ──
    this.time.addEvent({
      delay: 15000,
      callback: this.respawnEnemies,
      callbackScope: this,
      loop: true,
    });
  }

  // ── Background (Dark Forest Parallax) ──
  createBackground() {
    // ── Helper: extract a row from a tree spritesheet & strip transparent columns ──
    const compactRow = (srcKey, destKey, rowY, rowH) => {
      const src = this.textures.get(srcKey).getSourceImage();
      const srcW = src.width;
      const c = document.createElement('canvas');
      c.width = srcW; c.height = rowH;
      const ctx = c.getContext('2d');
      ctx.drawImage(src, 0, rowY, srcW, rowH, 0, 0, srcW, rowH);
      const imgData = ctx.getImageData(0, 0, srcW, rowH);
      const solidCols = [];
      for (let x = 0; x < srcW; x++) {
        for (let y = 0; y < rowH; y++) {
          if (imgData.data[(y * srcW + x) * 4 + 3] > 10) {
            solidCols.push(x); break;
          }
        }
      }
      const cW = solidCols.length || 1;
      const tex = this.textures.createCanvas(destKey, cW, rowH);
      solidCols.forEach((sx, dx) => {
        tex.context.drawImage(c, sx, 0, 1, rowH, dx, 0, 1, rowH);
      });
      tex.refresh();
      return { width: cW, height: rowH };
    };

    // ── Helper: place a parallax tree layer, bottom-aligned ──
    const addLayer = (texKey, dims, sf, tint, depth, hFrac, alpha) => {
      const needW = GAME_WIDTH + (WORLD_WIDTH - GAME_WIDTH) * sf;
      const wScale = needW / dims.width;
      const hScale = (GAME_HEIGHT * hFrac) / dims.height;
      const scale = Math.max(wScale, hScale, 1);
      const img = this.add.image(0, GAME_HEIGHT, texKey)
        .setOrigin(0, 1)
        .setScale(scale)
        .setScrollFactor(sf, 0)
        .setDepth(depth)
        .setAlpha(alpha);
      if (tint != null) img.setTint(tint);
      return img;
    };

    // ── 1. Dark gradient backdrop (replaces sky entirely) ──
    const gradTex = this.textures.createCanvas('bg-gradient', GAME_WIDTH, GAME_HEIGHT);
    const gCtx = gradTex.context;
    const grad = gCtx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0,   '#050805');
    grad.addColorStop(0.3, '#0a110a');
    grad.addColorStop(0.6, '#0f1a0f');
    grad.addColorStop(1,   '#162416');
    gCtx.fillStyle = grad;
    gCtx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    gradTex.refresh();

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-gradient')
      .setScrollFactor(0)
      .setDepth(DEPTH.BG_SKY);

    // ── 2. Multi-layer parallax forest ──

    // Layer 1 (farthest): Trees-Background as dark wall
    const d1 = compactRow('bg-trees', 'forest-1', 0, 256);
    addLayer('forest-1', d1, 0.02, 0x060c06, DEPTH.BG_SKY + 1, 1.0, 1);

    // Layer 2: Dark-Tree tallest row (row 0) — deep silhouettes
    const d2 = compactRow('tree-dark', 'forest-2', 0, 240);
    addLayer('forest-2', d2, 0.05, 0x0c160c, DEPTH.BG_SKY + 2, 0.92, 1);

    // Layer 3: Green-Tree tallest row — dark-tinted greenery
    const d3 = compactRow('tree-green', 'forest-3', 0, 240);
    addLayer('forest-3', d3, 0.09, 0x182818, DEPTH.BG_FAR - 2, 0.80, 1);

    // Layer 4: Golden-Tree accent — subtle warm highlights
    const d4 = compactRow('tree-golden', 'forest-4', 0, 240);
    addLayer('forest-4', d4, 0.13, 0x28341a, DEPTH.BG_FAR - 1, 0.72, 0.45);

    // Layer 5 (nearest): Green-Tree row 1 — closest treeline
    const d5 = compactRow('tree-green', 'forest-5', 240, 240);
    addLayer('forest-5', d5, 0.20, 0x283828, DEPTH.BG_FAR, 0.65, 1);

    // ── 3. Atmospheric effects ──
    this.createAtmosphere();
  }

  // ── Fog, light rays, floating dust ──
  createAtmosphere() {
    // Low fog near ground level
    const fogLow = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT - 70, GAME_WIDTH, 120,
      0x1a2a1a, 0.15
    ).setScrollFactor(0).setDepth(DEPTH.BG_MID);

    this.tweens.add({
      targets: fogLow,
      alpha: 0.05,
      duration: 4000,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Mid-height fog
    const fogMid = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT * 0.45, GAME_WIDTH, 80,
      0x182418, 0.10
    ).setScrollFactor(0).setDepth(DEPTH.BG_MID + 1);

    this.tweens.add({
      targets: fogMid,
      alpha: 0.03,
      duration: 5500,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 1500,
    });

    // Subtle diagonal light ray from upper-left (canopy light break)
    const ray = this.add.graphics()
      .setScrollFactor(0)
      .setDepth(DEPTH.BG_NEAR)
      .setAlpha(0.04);
    ray.fillStyle(0xaacc88, 1);
    ray.beginPath();
    ray.moveTo(150, 0);
    ray.lineTo(220, 0);
    ray.lineTo(380, GAME_HEIGHT);
    ray.lineTo(280, GAME_HEIGHT);
    ray.closePath();
    ray.fillPath();

    this.tweens.add({
      targets: ray,
      alpha: 0.01,
      duration: 6000,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Floating dust motes
    for (let i = 0; i < 15; i++) {
      const px = Math.random() * GAME_WIDTH;
      const py = GAME_HEIGHT * 0.2 + Math.random() * GAME_HEIGHT * 0.6;
      const sz = 1 + Math.floor(Math.random() * 2);
      const mote = this.add.rectangle(px, py, sz, sz, 0x88aa66, 0.25)
        .setScrollFactor(0)
        .setDepth(DEPTH.BG_NEAR + 1);

      this.tweens.add({
        targets: mote,
        x: px + (Math.random() - 0.5) * 60,
        y: py - 20 - Math.random() * 30,
        alpha: 0,
        duration: 3000 + Math.random() * 4000,
        delay: Math.random() * 4000,
        repeat: -1,
        onRepeat: () => {
          mote.x = Math.random() * GAME_WIDTH;
          mote.y = GAME_HEIGHT * 0.2 + Math.random() * GAME_HEIGHT * 0.6;
          mote.alpha = 0.15 + Math.random() * 0.15;
        },
      });
    }
  }

  // ── Procedural Level Generation ──
  createLevel() {
    this.groundY = WORLD_HEIGHT - 64;
    const groundY = this.groundY;

    // ── Ground: build wide collision segments (not individual tiles) ──
    // Gaps define where there is NO ground
    this.gaps = [
      { start: 640, end: 720 },
      { start: 1600, end: 1660 },
      { start: 2200, end: 2300 },
    ];

    // Calculate ground segments between gaps
    const groundSegments = [];
    let segStart = 0;
    for (const gap of this.gaps) {
      if (gap.start > segStart) {
        groundSegments.push({ x: segStart, w: gap.start - segStart });
      }
      segStart = gap.end;
    }
    if (segStart < WORLD_WIDTH) {
      groundSegments.push({ x: segStart, w: WORLD_WIDTH - segStart });
    }

    // Create ONE wide static body per ground segment
    const groundThickness = 32;
    groundSegments.forEach(seg => {
      this.addStaticPlatform(
        seg.x + seg.w / 2,
        groundY + groundThickness / 2,
        seg.w,
        groundThickness
      );
    });

    // Visual ground
    this.createGroundVisuals(groundY);

    // ── Floating platforms ──
    const platformDefs = [
      // Section 1: Tutorial area
      { x: 350, y: groundY - 80, w: 128 },
      { x: 500, y: groundY - 160, w: 96 },
      { x: 280, y: groundY - 240, w: 64 },

      // Section 2: First challenge
      { x: 800, y: groundY - 100, w: 128 },
      { x: 1000, y: groundY - 180, w: 96 },
      { x: 1150, y: groundY - 80, w: 160 },

      // Section 3: Vertical climb
      { x: 1400, y: groundY - 120, w: 96 },
      { x: 1530, y: groundY - 220, w: 96 },
      { x: 1400, y: groundY - 320, w: 96 },
      { x: 1270, y: groundY - 400, w: 128 },

      // Section 4: Gauntlet
      { x: 1700, y: groundY - 100, w: 80 },
      { x: 1850, y: groundY - 160, w: 80 },
      { x: 2000, y: groundY - 100, w: 80 },
      { x: 2150, y: groundY - 200, w: 120 },

      // Section 5: High platforms
      { x: 2400, y: groundY - 140, w: 128 },
      { x: 2600, y: groundY - 240, w: 96 },
      { x: 2800, y: groundY - 160, w: 160 },
      { x: 3000, y: groundY - 80, w: 192 },
    ];

    platformDefs.forEach(p => {
      this.addStaticPlatform(p.x, p.y, p.w, 16);
      this.drawPlatformVisual(p.x, p.y, p.w, 16);
    });
  }

  // Create a reliable static physics body using real texture + refreshBody
  addStaticPlatform(cx, cy, w, h) {
    const plat = this.platforms.create(cx, cy, '_pixel');
    plat.setDisplaySize(w, h);
    plat.setVisible(false);
    plat.refreshBody();
  }

  isGap(x) {
    return this.gaps.some(g => x >= g.start && x < g.end);
  }

  drawPlatformVisual(x, y, w, h) {
    const gfx = this.add.graphics().setDepth(DEPTH.TILEMAP);

    // Platform top (grass)
    gfx.fillStyle(0x4a7c3f, 1);
    gfx.fillRect(x - w / 2, y - h / 2, w, 6);

    // Platform body (dirt/stone)
    gfx.fillStyle(0x6b5344, 1);
    gfx.fillRect(x - w / 2, y - h / 2 + 6, w, h - 6);

    // Edge highlight
    gfx.fillStyle(0x5a8c4f, 1);
    gfx.fillRect(x - w / 2, y - h / 2, w, 2);

    // Dark edge at bottom
    gfx.fillStyle(0x4a3a2e, 1);
    gfx.fillRect(x - w / 2, y + h / 2 - 2, w, 2);
  }

  createGroundVisuals(groundY) {
    const gfx = this.add.graphics().setDepth(DEPTH.TILEMAP);
    const groundH = 64;
    const tileW = 32;

    for (let x = 0; x < WORLD_WIDTH; x += tileW) {
      if (this.isGap(x)) continue;

      // Grass top
      gfx.fillStyle(0x4a7c3f, 1);
      gfx.fillRect(x, groundY, tileW, 8);

      // Dirt
      gfx.fillStyle(0x6b5344, 1);
      gfx.fillRect(x, groundY + 8, tileW, groundH - 8);

      // Dark bottom
      gfx.fillStyle(0x3a2a1e, 1);
      gfx.fillRect(x, groundY + groundH - 4, tileW, 4);

      // Random grass tufts
      if (Math.random() < 0.3) {
        gfx.fillStyle(0x5a9c4f, 1);
        const grassX = x + Math.random() * (tileW - 4);
        gfx.fillRect(grassX, groundY - 4, 3, 4);
      }
    }

    // Underground fill
    gfx.fillStyle(0x2a1a0e, 1);
    gfx.fillRect(0, groundY + groundH, WORLD_WIDTH, WORLD_HEIGHT - groundY - groundH);
  }

  // ── Decorations (Rocks, Crystals) ──
  createDecorations() {
    const groundY = WORLD_HEIGHT - 64;

    // Foreground details: small rocks
    for (let i = 0; i < 20; i++) {
      const rx = 100 + Math.random() * (WORLD_WIDTH - 200);
      const ry = groundY;
      if (this.isGap(rx)) continue;

      const rockColor = Phaser.Math.RND.pick([0x777777, 0x888888, 0x666666]);
      this.add.ellipse(rx, ry - 3, 8 + Math.random() * 12, 6 + Math.random() * 6, rockColor)
        .setDepth(DEPTH.TILEMAP + 1);
    }

    // Resource nodes (glowing crystals - placeholder for mining)
    const resourcePositions = [400, 900, 1300, 1800, 2500];
    resourcePositions.forEach(rx => {
      if (this.isGap(rx)) return;
      const crystal = this.add.polygon(rx, groundY - 16, [
        [0, -16], [8, -4], [6, 0], [-6, 0], [-8, -4]
      ], 0x44aaff, 0.8)
        .setDepth(DEPTH.ITEMS);

      // Glow effect
      this.tweens.add({
        targets: crystal,
        alpha: 0.4,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  // ── Enemy Spawning ──
  spawnEnemies() {
    const groundY = WORLD_HEIGHT - 64;
    const boarSpawns = [
      { x: 450, y: groundY - 30 },
      { x: 750, y: groundY - 30 },
      { x: 1100, y: groundY - 30 },
      { x: 1500, y: groundY - 30 },
      { x: 1900, y: groundY - 30 },
      { x: 2300, y: groundY - 30 },
      { x: 2700, y: groundY - 30 },
      { x: 3050, y: groundY - 30 },
    ];

    boarSpawns.forEach((spawn, i) => {
      // Scale difficulty with position
      const config = {
        hp: 30 + i * 10,
        atk: 8 + i * 3,
        def: 2 + i,
        exp: 15 + i * 8,
      };
      const boar = new Boar(this, spawn.x, spawn.y, config);
      boar.setTarget(this.player);
      this.enemies.add(boar);
    });
  }

  respawnEnemies() {
    const aliveCount = this.enemies.getChildren().filter(e => !e.isDead).length;
    if (aliveCount < 3) {
      const groundY = WORLD_HEIGHT - 64;
      const camX = this.cameras.main.scrollX;
      // Spawn off-screen
      const spawnX = camX + GAME_WIDTH + 200 + Math.random() * 300;
      if (spawnX < WORLD_WIDTH - 100) {
        const boar = new Boar(this, spawnX, groundY - 30, {
          hp: 30 + this.player.stats.level * 8,
          atk: 8 + this.player.stats.level * 2,
          def: 2 + this.player.stats.level,
          exp: 15 + this.player.stats.level * 5,
        });
        boar.setTarget(this.player);
        this.enemies.add(boar);
        this.physics.add.collider(boar, this.platforms);
      }
    }
  }

  // ── Collision Handlers ──
  onAttackHitEnemy(hitbox, enemy) {
    if (!this.player.isAttacking || enemy.isDead) return;
    if (enemy._lastHitTime && this.time.now - enemy._lastHitTime < 300) return;
    enemy._lastHitTime = this.time.now;

    const totalAtk = this.player.stats.atk;
    // Critical hit check
    const isCrit = Math.random() * 100 < this.player.stats.crt;
    const damage = isCrit ? Math.floor(totalAtk * 1.5) : totalAtk;

    if (isCrit) {
      showCritText(this, enemy.x, enemy.y - 30);
    }

    enemy.takeDamage(damage);
  }

  onEnemyContactPlayer(player, enemy) {
    if (enemy.isDead || player.isDead || player.isInvincible) return;
    enemy.dealContactDamage(player);
    this.hud.updateHP(player.stats);
  }

  onPlayerDied() {
    // Dim screen
    const overlay = this.add.rectangle(
      this.cameras.main.scrollX + GAME_WIDTH / 2,
      this.cameras.main.scrollY + GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT, 0x000000, 0
    ).setScrollFactor(0).setDepth(DEPTH.UI + 10);

    this.tweens.add({
      targets: overlay,
      alpha: 0.7,
      duration: 1000,
    });

    // Game Over text
    const goText = this.add.text(
      GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30,
      'GAME OVER', {
        fontFamily: 'monospace', fontSize: '32px', color: '#cc3333',
        stroke: '#000000', strokeThickness: 5,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.UI + 11).setAlpha(0);

    const restartText = this.add.text(
      GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20,
      'Press SPACE to restart', {
        fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa',
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.UI + 11).setAlpha(0);

    this.tweens.add({
      targets: [goText, restartText],
      alpha: 1,
      duration: 800,
      delay: 500,
    });

    // Restart on space
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.restart();
    });
  }

  update(time, delta) {
    // Player update
    if (this.player && !this.player.isDead) {
      this.player.update(time, delta);
    }

    // Enemies update
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.update) enemy.update(time, delta);
    });

    // Parallax handled by scrollFactor on each layer (no manual update needed)

    // HUD sync
    if (this.hud && this.player) {
      this.hud.syncWithPlayer(this.player);
    }

    // Fall death
    if (this.player && this.player.y > WORLD_HEIGHT + 50 && !this.player.isDead) {
      this.player.stats.hp = 0;
      this.player.die();
    }
  }
}

// Helper: show "CRITICAL!" text
function showCritText(scene, x, y) {
  const text = scene.add.text(x, y, 'CRIT!', {
    fontFamily: 'monospace', fontSize: '12px', color: '#ffaa00',
    stroke: '#000000', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(DEPTH.UI);

  scene.tweens.add({
    targets: text,
    y: y - 40,
    alpha: 0,
    scaleX: 1.5,
    scaleY: 1.5,
    duration: 600,
    onComplete: () => text.destroy(),
  });
}
