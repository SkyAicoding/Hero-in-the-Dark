import Phaser from 'phaser';
import { PLAYER, DEPTH, COMBAT } from '../utils/Constants.js';
import { flashWhite, showDamageNumber, screenShake, hitStop } from '../utils/Helpers.js';

/**
 * Frame sizes across animations:
 *   idle: 64x80, run: 80x80, attack: 96x80   → height 80
 *   jump-start: 64x64, jump-air: 80x64,
 *   jump-end: 64x64, die: 80x64              → height 64
 *
 * Strategy: origin stays default (0.5, 0.5).
 * On every animation switch, body offset is recalculated and
 * sprite.y is compensated so FEET position stays stable.
 *
 * Body offset formula: offsetY = frameHeight - BODY_H - FOOT_PAD
 * Y compensation: this.y += (oldFrameHeight - newFrameHeight) / 2
 */

const BODY_W = 20;
const BODY_H = 44;
const FOOT_PAD = 17;

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Default origin (0.5, 0.5) — no rendering quirks
    this.setDepth(DEPTH.PLAYER);
    this.setCollideWorldBounds(false);

    // Physics body — initial offset for idle frame (64x80)
    this.body.setSize(BODY_W, BODY_H);
    this.body.setOffset(
      Math.floor((64 - BODY_W) / 2),      // 22
      80 - BODY_H - FOOT_PAD               // 24
    );

    // ── Stats ──
    this.stats = {
      level: 1,
      exp: 0,
      expToNext: 100,
      maxHp: PLAYER.BASE_HP,
      hp: PLAYER.BASE_HP,
      atk: PLAYER.BASE_ATK,
      def: PLAYER.BASE_DEF,
      crt: PLAYER.BASE_CRT,
      spd: PLAYER.BASE_SPD,
    };

    // ── State ──
    this.facingRight = true;
    this.jumpCount = 0;
    this.isAttacking = false;
    this.isInvincible = false;
    this.isDead = false;

    // ── Timers ──
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.attackCooldownTimer = 0;
    this.wasOnFloor = false;

    // ── Grounded buffer ──
    this.isGrounded = false;
    this.groundedBuffer = 0;
    this.GROUNDED_BUFFER_TIME = 100;
    this.currentAnimKey = null;

    // ── Input ──
    this.cursors = scene.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
      arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      arrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      attack: Phaser.Input.Keyboard.KeyCodes.J,
      attackAlt: Phaser.Input.Keyboard.KeyCodes.Z,
    });

    this.jumpKeyJustDown = false;
    this.attackKeyJustDown = false;
    this.prevJumpDown = false;
    this.prevAttackDown = false;

    // ── Attack hitbox ──
    this.attackHitbox = scene.add.zone(0, 0, PLAYER.ATTACK_RANGE, 40);
    scene.physics.add.existing(this.attackHitbox, false);
    this.attackHitbox.body.setAllowGravity(false);
    this.attackHitbox.body.enable = false;

    // ── Animation events ──
    this.on('animationcomplete', this.onAnimComplete, this);
  }

  /**
   * Switch animation and realign body + sprite position.
   * Keeps both physics body bottom AND visual feet at the same world Y.
   */
  _switchAnim(key) {
    if (this.currentAnimKey === key) return;

    const oldFH = this.frame ? this.frame.height : 80;

    this.currentAnimKey = key;
    this.play(key, true);

    const newFH = this.frame.height;
    const newFW = this.frame.width;

    // Recalculate body offset for new frame size
    this.body.setOffset(
      Math.floor((newFW - BODY_W) / 2),
      newFH - BODY_H - FOOT_PAD
    );

    // Compensate sprite.y so feet stay at the same world position
    // Feet = this.y + frameHeight/2. To keep same: shift by half the height diff.
    if (oldFH !== newFH) {
      this.y += (oldFH - newFH) / 2;
    }
  }

  update(time, delta) {
    if (this.isDead) return;

    this.updateInputEdges();
    this.updateTimers(delta);
    this.updateMovement();
    this.updateJump();
    this.updateAttack();
    this.updateAnimation();
    this.updateAttackHitbox();
  }

  // ── Input Edge Detection ──
  updateInputEdges() {
    const jumpDown = this.cursors.jump.isDown || this.cursors.up.isDown || this.cursors.arrowUp.isDown;
    const attackDown = this.cursors.attack.isDown || this.cursors.attackAlt.isDown;

    this.jumpKeyJustDown = jumpDown && !this.prevJumpDown;
    this.attackKeyJustDown = attackDown && !this.prevAttackDown;

    this.prevJumpDown = jumpDown;
    this.prevAttackDown = attackDown;
  }

  // ── Timers ──
  updateTimers(delta) {
    if (this.coyoteTimer > 0) this.coyoteTimer -= delta;
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= delta;
    if (this.attackCooldownTimer > 0) this.attackCooldownTimer -= delta;

    const onFloor = this.body.onFloor();
    if (onFloor) {
      this.coyoteTimer = PLAYER.COYOTE_TIME;
      this.jumpCount = 0;
      this.isGrounded = true;
      this.groundedBuffer = this.GROUNDED_BUFFER_TIME;
    } else {
      if (this.groundedBuffer > 0) {
        this.groundedBuffer -= delta;
      } else {
        this.isGrounded = false;
      }
    }
    this.wasOnFloor = onFloor;
  }

  // ── Movement ──
  updateMovement() {
    if (this.isAttacking && this.body.onFloor()) {
      this.body.setVelocityX(this.body.velocity.x * 0.85);
      return;
    }

    const leftDown = this.cursors.left.isDown || this.cursors.arrowLeft.isDown;
    const rightDown = this.cursors.right.isDown || this.cursors.arrowRight.isDown;

    if (leftDown) {
      this.body.setVelocityX(-PLAYER.MOVE_SPEED);
      this.facingRight = false;
      this.setFlipX(true);
    } else if (rightDown) {
      this.body.setVelocityX(PLAYER.MOVE_SPEED);
      this.facingRight = true;
      this.setFlipX(false);
    } else {
      if (this.body.onFloor()) {
        this.body.setVelocityX(this.body.velocity.x * 0.8);
        if (Math.abs(this.body.velocity.x) < 10) {
          this.body.setVelocityX(0);
        }
      } else {
        this.body.setVelocityX(this.body.velocity.x * 0.95);
      }
    }
  }

  // ── Jump ──
  updateJump() {
    if (this.jumpKeyJustDown) {
      this.jumpBufferTimer = PLAYER.JUMP_BUFFER;
    }

    if (this.jumpBufferTimer > 0) {
      const canJump = this.coyoteTimer > 0 && this.jumpCount === 0;
      const canAirJump = this.jumpCount === 1;

      if (canJump) {
        this.performJump(PLAYER.JUMP_FORCE);
        this.jumpCount = 1;
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
      } else if (canAirJump) {
        this.performJump(PLAYER.AIR_JUMP_FORCE);
        this.jumpCount = 2;
        this.jumpBufferTimer = 0;
      }
    }
  }

  performJump(force) {
    this.body.setVelocityY(force);
    this.isAttacking = false;
    this.isGrounded = false;
    this.groundedBuffer = 0;
    this.currentAnimKey = null; // force animation switch on next frame
  }

  // ── Attack ──
  updateAttack() {
    if (this.attackKeyJustDown && !this.isAttacking && this.attackCooldownTimer <= 0) {
      this.isAttacking = true;
      this.attackCooldownTimer = PLAYER.ATTACK_COOLDOWN;
      this._switchAnim('player-attack');

      // Enable hitbox at animation midpoint
      this.scene.time.delayedCall(150, () => {
        if (this.isAttacking) {
          this.attackHitbox.body.enable = true;
          this.scene.time.delayedCall(120, () => {
            this.attackHitbox.body.enable = false;
          });
        }
      });
    }
  }

  updateAttackHitbox() {
    const offsetX = this.facingRight ? 40 : -40;
    this.attackHitbox.setPosition(this.x + offsetX, this.y);
  }

  onAnimComplete(animation) {
    if (animation.key === 'player-attack') {
      this.isAttacking = false;
      this.attackHitbox.body.enable = false;
      this.currentAnimKey = null;
    }
    if (animation.key === 'player-die') {
      this.scene.events.emit('player-died');
    }
  }

  // ── Animation State ──
  updateAnimation() {
    if (this.isDead) return;
    if (this.isAttacking) return;

    const moving = Math.abs(this.body.velocity.x) > 20;
    let targetAnim;

    if (!this.isGrounded && this.jumpCount > 0) {
      targetAnim = 'player-jump-air';
    } else if (!this.isGrounded && this.body.velocity.y > 50) {
      targetAnim = 'player-jump-air';
    } else if (moving) {
      targetAnim = 'player-run';
    } else {
      targetAnim = 'player-idle';
    }

    this._switchAnim(targetAnim);
  }

  // ── Damage ──
  takeDamage(amount, source) {
    if (this.isInvincible || this.isDead) return;

    const actualDamage = Math.max(1, amount - this.stats.def);
    this.stats.hp -= actualDamage;

    flashWhite(this, this.scene);
    showDamageNumber(this.scene, this.x, this.y - 20, actualDamage, '#ff4444');
    screenShake(this.scene.cameras.main);

    const dir = this.x < source.x ? -1 : 1;
    this.body.setVelocityX(dir * PLAYER.KNOCKBACK_FORCE);
    this.body.setVelocityY(-150);

    this.isInvincible = true;
    this.blinkTween = this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.alpha = 1;
        this.isInvincible = false;
      }
    });

    if (this.stats.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.isAttacking = false;
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this._switchAnim('player-die');
  }

  // ── EXP & Level ──
  gainExp(amount) {
    this.stats.exp += amount;
    this.scene.events.emit('exp-gained', this.stats);

    while (this.stats.exp >= this.stats.expToNext) {
      this.stats.exp -= this.stats.expToNext;
      this.levelUp();
    }
  }

  levelUp() {
    this.stats.level++;
    this.stats.expToNext = Math.floor(this.stats.expToNext * 1.5 + 50);
    this.stats.maxHp += 15;
    this.stats.hp = this.stats.maxHp;
    this.stats.atk += 2;
    this.stats.def += 1;

    this.scene.events.emit('level-up', this.stats);

    const text = this.scene.add.text(this.x, this.y - 40, 'LEVEL UP!', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(DEPTH.UI);

    this.scene.tweens.add({
      targets: text,
      y: this.y - 80,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  heal(amount) {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
    this.scene.events.emit('hp-changed', this.stats);
  }
}
