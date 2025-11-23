import * as Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../config';
import { PlayerKeys } from '../types/types';
import { Item } from './Item';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public id: number; // 玩家ID
  public keys: PlayerKeys; // 玩家按键
  public heldItem: Item | null = null; // 玩家手中持有的物品
  public facing: Phaser.Math.Vector2; // 玩家朝向
  public dash: { active: boolean; timer: number; cooldown: number }; // 冲刺状态
  public dashEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: GameScene, id: number, x: number, y: number, color: number, keyMap: { [key: string]: string }) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.id = id;
    if (!scene.input.keyboard) {
      throw new Error("键盘未初始化"); // 键盘未初始化
    }
    this.keys = scene.input.keyboard.addKeys(keyMap) as PlayerKeys;

    this.facing = new Phaser.Math.Vector2(1, 0);
    this.dash = { active: false, timer: 0, cooldown: 0 };

    this.setTint(color);
    this.setDepth(DEPTH.PLAYER);
    this.setCircle(15, 2, 2);
    this.setCollideWorldBounds(true);
    this.dashEmitter = scene.add.particles(3, 3, 'particle_smoke');
    this.dashEmitter.setConfig({
      speed: 100,
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 300
    });
    this.dashEmitter.startFollow(this);
    this.dashEmitter.stop();
  }

  // 拾取物品逻辑，与原始GameScene中的逻辑保持一致。
  pickup(item: Item) {
    if (this.heldItem) return;
    this.replaceHeldItem(item);
  }

  replaceHeldItem(newItem: Item) {
    this.heldItem = newItem;
    newItem.heldBy = this;
    newItem.isFlying = false;

    if (newItem.body) {
      newItem.body.enable = false; // 拾取时无物理碰撞
    }
    newItem.setVisible(true);
  }

}