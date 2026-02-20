import Phaser from 'phaser';
import { GAME_WIDTH, DEPTH } from '../utils/Constants.js';

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this.createHUD();
    this.bindEvents();
  }

  createHUD() {
    const s = this.scene;

    // ── HP Bar ──
    this.hpBarBg = s.add.rectangle(16, 16, 152, 16, 0x222222)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.UI);
    this.hpBarBorder = s.add.rectangle(16, 16, 152, 16)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.UI)
      .setStrokeStyle(2, 0x666666);
    this.hpBarFill = s.add.rectangle(18, 18, 148, 12, 0xcc3333)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.UI);

    this.hpText = s.add.text(92, 16, '100/100', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH.UI + 1);

    // ── HP Label ──
    this.hpLabel = s.add.text(16, 5, 'HP', {
      fontFamily: 'monospace', fontSize: '9px', color: '#ff6666',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.UI + 1);

    // ── EXP Bar ──
    this.expBarBg = s.add.rectangle(16, 36, 152, 10, 0x222222)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.UI);
    this.expBarBorder = s.add.rectangle(16, 36, 152, 10)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.UI)
      .setStrokeStyle(1, 0x555555);
    this.expBarFill = s.add.rectangle(17, 37, 0, 8, 0xddbb22)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.UI);

    // ── EXP Label ──
    this.expLabel = s.add.text(16, 47, 'EXP', {
      fontFamily: 'monospace', fontSize: '8px', color: '#ddbb22',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.UI + 1);

    // ── Level Display ──
    this.levelText = s.add.text(172, 12, 'Lv.1', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffdd44',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.UI + 1);

    // ── Stats Display (top-right) ──
    this.statsText = s.add.text(GAME_WIDTH - 16, 16, 'ATK:10  DEF:5', {
      fontFamily: 'monospace', fontSize: '10px', color: '#aaaaaa',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH.UI);

    // ── Kill Counter ──
    this.killCount = 0;
    this.killText = s.add.text(GAME_WIDTH - 16, 30, 'Kills: 0', {
      fontFamily: 'monospace', fontSize: '10px', color: '#88aa88',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH.UI);

    // ── Controls Hint (bottom) ──
    this.controlsText = s.add.text(GAME_WIDTH / 2, 480 - 12,
      'A/D: Move  |  SPACE: Jump  |  J: Attack', {
      fontFamily: 'monospace', fontSize: '9px', color: '#555555',
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(DEPTH.UI);
  }

  bindEvents() {
    const s = this.scene;
    s.events.on('hp-changed', (stats) => this.updateHP(stats));
    s.events.on('exp-gained', (stats) => this.updateEXP(stats));
    s.events.on('level-up', (stats) => this.updateAll(stats));
    s.events.on('enemy-killed', () => {
      this.killCount++;
      this.killText.setText(`Kills: ${this.killCount}`);
    });
  }

  updateHP(stats) {
    const ratio = Math.max(0, stats.hp / stats.maxHp);
    this.hpBarFill.width = 148 * ratio;
    this.hpText.setText(`${Math.max(0, stats.hp)}/${stats.maxHp}`);

    // Color shift: green → yellow → red
    if (ratio > 0.6) {
      this.hpBarFill.setFillStyle(0xcc3333);
    } else if (ratio > 0.3) {
      this.hpBarFill.setFillStyle(0xcc8833);
    } else {
      this.hpBarFill.setFillStyle(0xcc2222);
    }
  }

  updateEXP(stats) {
    const ratio = stats.exp / stats.expToNext;
    this.expBarFill.width = 150 * ratio;
  }

  updateAll(stats) {
    this.updateHP(stats);
    this.updateEXP(stats);
    this.levelText.setText(`Lv.${stats.level}`);
    this.statsText.setText(`ATK:${stats.atk}  DEF:${stats.def}`);

    // Level up flash effect on level text
    this.scene.tweens.add({
      targets: this.levelText,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 200,
      yoyo: true,
      ease: 'Back.easeOut',
    });
  }

  // Called every frame to sync HP display
  syncWithPlayer(player) {
    if (!player) return;
    const stats = player.stats;
    const ratio = Math.max(0, stats.hp / stats.maxHp);
    this.hpBarFill.width = 148 * ratio;
    this.hpText.setText(`${Math.max(0, Math.ceil(stats.hp))}/${stats.maxHp}`);

    if (ratio > 0.6) {
      this.hpBarFill.setFillStyle(0xcc3333);
    } else if (ratio > 0.3) {
      this.hpBarFill.setFillStyle(0xcc8833);
    } else {
      this.hpBarFill.setFillStyle(0xcc2222);
    }

    const expRatio = stats.exp / stats.expToNext;
    this.expBarFill.width = 150 * expRatio;
  }
}
