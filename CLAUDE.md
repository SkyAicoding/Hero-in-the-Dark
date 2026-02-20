# Hero in the Dark - Project Guidelines

## Project Overview
2D side-scrolling action RPG built with Phaser 3 + Vite, deployed to web.
Pixel art style with combat, mining, crafting, and character progression.

## Tech Stack
- **Engine:** Phaser 3.80+ (WebGL/Canvas)
- **Bundler:** Vite
- **Language:** Vanilla JavaScript (ES Modules)
- **Deployment:** Vercel / Netlify (auto-deploy from git)
- **Save System:** localStorage + IndexedDB

## Project Structure
```
src/
  main.js              - Phaser game config & entry point
  scenes/              - Phaser Scenes (Boot, Title, Game, UI)
  entities/            - Player, enemies, NPCs
  systems/             - Combat, inventory, crafting, progression, save
  ui/                  - HUD, menus, inventory panels
  utils/               - Constants, helpers
public/
  sprites/player/      - Character sprite sheets
  sprites/enemies/     - Monster sprite sheets
  sprites/environment/ - Tiles, trees, backgrounds
  sprites/ui/          - HUD elements, icons
  maps/                - Tiled JSON tilemaps
  audio/               - SFX and BGM
  data/                - JSON data (items, recipes, monsters)
```

## Coding Conventions
- Use ES Module imports (import/export)
- Class-based Phaser entities extending Phaser.GameObjects or Phaser.Scene
- Constants in UPPER_SNAKE_CASE in src/utils/Constants.js
- Game balance values in JSON data files, not hardcoded
- Scene keys: 'BootScene', 'TitleScene', 'GameScene', 'UIScene'
- Sprite keys follow pattern: 'player-idle', 'enemy-boar-run', 'tile-forest'

## Asset Conventions
- Original assets in: Assets/Legacy-Fantasy - High Forest 2.3/
- Game-ready assets copied/optimized to: public/sprites/
- Sprite sheets are horizontal strips (frames left to right)
- Pixel art uses nearest-neighbor scaling (no anti-aliasing)

## Game Design Reference
- Full GDD: GDD-Hero-in-the-Dark.md
- 5 stages: Forest → Cave → Ruins → Lake → Hive
- 3 enemies: Boar (melee charge), Snail (defense/ambush), Bee (aerial)
- Core loop: Combat → Mining → Crafting → Growth

## Key Phaser Settings
- Game resolution: 800×480 (16:10, scales to fit)
- Physics: Arcade (gravity: 800)
- Pixel art mode: roundPixels=true, antialias=false
- Target FPS: 60

## Important Notes
- All sprite sheets have transparent backgrounds (PNG)
- Boar has color variants: Normal, Black (high DEF), White (high SPD)
- Character sprite sizes vary per animation (idle ~64px, attack ~96px wide)
- Use Phaser's animation state machine for character state management
- Mobile touch controls needed (virtual joystick + action buttons)
