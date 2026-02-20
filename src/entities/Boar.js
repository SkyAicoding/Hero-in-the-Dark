import Phaser from 'phaser';
import { BOAR, DEPTH, COMBAT } from '../utils/Constants.js';
import { flashWhite, showDamageNumber, screenShake, hitStop, distanceBetween } from '../utils/Helpers.js';

const STATE = {
  IDLE: 'idle',
  WALK: 'walk',
  CHASE: 'chase',
  CHARGE: 'charge',
  STUNNED: 'stunned',
  HIT: 'hit',
  DEAD: 'dead',
};

export default class Boar extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config = {}) {
    super(scene, x, y, 'boar-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(30, 22);
    this.body.setOffset(9, 9);
    this.setDepth(DEPTH.ENEMIES);

    // Stats (can be overridden by config)
    this.hp = config.hp || BOAR.HP;
    this.maxHp = this.hp;
    this.atk = config.atk || BOAR.ATK;
    this.def = config.def || BOAR.DEF;
    this.expReward = config.exp || BOAR.EXP;

    // State
    this.aiState = STATE.IDLE;
    this.facingRight = false;
    this.spawnX = x;
    this.stateTimer = 0;
    this.stunTimer = 0;
    this.isDead = false;
    this.patrolDir = 1;
    this.hasDealtDamage = false;

    // Target reference (set by GameScene)
    this.target = null;

    this.play('boar-idle');
    this.on('animationcomplete', this.onAnimComplete, this);
  }

  setTarget(player) {
    this.target = player;
  }

  update(time, delta) {
    if (this.isDead) return;
    if (!this.target || this.target.isDead) {
      this.doIdle(delta);
      return;
    }

    const dist = distanceBetween(this, this.target);

    switch (this.aiState) {
      case STATE.IDLE:
        this.doIdle(delta);
        if (dist < BOAR.DETECT_RANGE) {
          this.changeState(STATE.CHASE);
        }
        break;

      case STATE.WALK:
        this.doPatrol(delta);
        if (dist < BOAR.DETECT_RANGE) {
          this.changeState(STATE.CHASE);
        }
        break;

      case STATE.CHASE:
        this.doChase(delta);
        if (dist < BOAR.CHARGE_RANGE) {
          this.changeState(STATE.CHARGE);
        } else if (dist > BOAR.DETECT_RANGE * 1.8) {
          this.changeState(STATE.WALK);
        }
        break;

      case STATE.CHARGE:
        this.doCharge(delta);
        break;

      case STATE.STUNNED:
        this.doStunned(delta);
        break;

      case STATE.HIT:
        // Wait for animation
        break;
    }

    // Face direction
    this.setFlipX(!this.facingRight);
  }

  changeState(newState) {
    this.aiState = newState;
    this.stateTimer = 0;
    this.hasDealtDamage = false;

    switch (newState) {
      case STATE.IDLE:
        this.body.setVelocityX(0);
        this.play('boar-idle', true);
        break;
      case STATE.WALK:
        this.play('boar-walk', true);
        break;
      case STATE.CHASE:
        this.play('boar-walk', true);
        break;
      case STATE.CHARGE:
        this.play('boar-run', true);
        break;
      case STATE.STUNNED:
        this.body.setVelocityX(0);
        this.play('boar-idle', true);
        this.stunTimer = BOAR.STUN_DURATION;
        break;
    }
  }

  doIdle(delta) {
    this.body.setVelocityX(0);
    this.stateTimer += delta;
    if (this.stateTimer > 2000) {
      this.changeState(STATE.WALK);
    }
  }

  doPatrol(delta) {
    this.body.setVelocityX(BOAR.WALK_SPEED * this.patrolDir);
    this.facingRight = this.patrolDir > 0;
    this.stateTimer += delta;

    // Reverse at patrol range or wall
    if (Math.abs(this.x - this.spawnX) > BOAR.PATROL_RANGE || this.body.blocked.left || this.body.blocked.right) {
      this.patrolDir *= -1;
    }

    if (this.stateTimer > 3000) {
      this.changeState(STATE.IDLE);
    }
  }

  doChase(delta) {
    const dir = this.target.x > this.x ? 1 : -1;
    this.facingRight = dir > 0;
    this.body.setVelocityX(BOAR.WALK_SPEED * 1.5 * dir);
  }

  doCharge(delta) {
    const dir = this.facingRight ? 1 : -1;
    this.body.setVelocityX(BOAR.RUN_SPEED * dir);

    this.stateTimer += delta;

    // Stop charging after a while or if hitting a wall
    if (this.stateTimer > 1200 || this.body.blocked.left || this.body.blocked.right) {
      this.changeState(STATE.STUNNED);
    }
  }

  doStunned(delta) {
    this.stunTimer -= delta;
    // Blink effect during stun
    this.alpha = Math.sin(this.stunTimer * 0.02) > 0 ? 1 : 0.5;
    if (this.stunTimer <= 0) {
      this.alpha = 1;
      this.changeState(STATE.IDLE);
    }
  }

  // Called when player's attack hitbox overlaps this boar
  takeDamage(amount) {
    if (this.isDead) return;

    const actualDamage = Math.max(1, amount - this.def);
    this.hp -= actualDamage;

    // Visual feedback
    flashWhite(this, this.scene, 120);
    showDamageNumber(this.scene, this.x, this.y, actualDamage, '#ffffff');
    hitStop(this.scene, COMBAT.HIT_STOP_DURATION);
    screenShake(this.scene.cameras.main, COMBAT.SCREEN_SHAKE_INTENSITY, COMBAT.SCREEN_SHAKE_DURATION);

    // Knockback
    const dir = this.x > this.scene.player.x ? 1 : -1;
    this.body.setVelocityX(dir * 180);
    this.body.setVelocityY(-80);

    if (this.hp <= 0) {
      this.die();
    } else {
      this.aiState = STATE.HIT;
      this.play('boar-hit', true);
    }
  }

  onAnimComplete(animation) {
    if (animation.key === 'boar-hit' && !this.isDead) {
      this.changeState(STATE.CHASE);
    }
  }

  die() {
    this.isDead = true;
    this.aiState = STATE.DEAD;
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this.body.enable = false;

    // Death animation - flash and fade
    this.play('boar-hit');
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 500,
      delay: 200,
      onComplete: () => {
        // Give EXP to player
        if (this.scene.player && !this.scene.player.isDead) {
          this.scene.player.gainExp(this.expReward);
          this.scene.events.emit('enemy-killed', this);
        }
        this.destroy();
      }
    });
  }

  // Called when boar body overlaps player
  dealContactDamage(player) {
    if (this.isDead || this.aiState === STATE.STUNNED) return;
    player.takeDamage(this.atk, this);
  }
}
