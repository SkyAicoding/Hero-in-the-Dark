import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY, SCENES } from './utils/Constants.js';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GRAVITY },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, GameScene],
};

const game = new Phaser.Game(config);
