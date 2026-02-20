# Hero in the Dark

2D side-scrolling action RPG built with **Phaser 3** and **Vite**.

Pixel art combat game set in a dark forest with multi-layer parallax backgrounds, enemy AI, and character progression.

![Phaser](https://img.shields.io/badge/Phaser-3.87-blue)
![Vite](https://img.shields.io/badge/Vite-6.1-purple)
![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-yellow)

## Features

- **Player** — Idle, run, jump (double jump), attack animations with physics-based movement
- **Combat** — Attack hitbox, critical hits, knockback, invincibility frames, damage numbers
- **Enemies** — Boar AI with patrol, detect, chase, and charge behaviors (scaling difficulty)
- **Dark Forest Background** — 5-layer parallax with Dark-Tree, Green-Tree, Golden-Tree silhouettes
- **Atmosphere** — Fog bands, diagonal light rays, floating dust particles
- **Procedural Level** — Ground segments with gaps, 18 floating platforms across 5 sections
- **HUD** — HP bar, EXP bar, level display, kill counter

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Dev server runs at `http://localhost:3000`

## Controls

| Key | Action |
|-----|--------|
| Arrow Left / Right | Move |
| Arrow Up / Space | Jump (press again for double jump) |
| Z | Attack |

## Project Structure

```
src/
  main.js              - Phaser game config & entry point
  scenes/
    BootScene.js       - Asset loading & animation creation
    GameScene.js       - Main game scene (level, enemies, background)
  entities/
    Player.js          - Player character with state machine
    Boar.js            - Boar enemy AI
  ui/
    HUD.js             - HP/EXP bars, level & kill counter
  utils/
    Constants.js       - Game config, depths, animation keys
    Helpers.js         - Utility functions
public/
  sprites/             - Game-ready sprite sheets (player, enemies, environment, UI)
Assets/                - Original asset pack (Legacy-Fantasy - High Forest 2.3)
```

## Game Design

- **Resolution:** 800 x 480 (pixel art, nearest-neighbor scaling)
- **Physics:** Arcade (gravity: 800)
- **World:** 3200 x 960
- **Stage 1:** Dark Forest — fight Boars, collect EXP, level up

Full game design document: [GDD-Hero-in-the-Dark.md](GDD-Hero-in-the-Dark.md)

## Asset Credits

Sprite assets from **Legacy-Fantasy - High Forest 2.3** asset pack.
