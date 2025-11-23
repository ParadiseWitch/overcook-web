import * as Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import type { Player } from './Player';
import { DEPTH } from '../config';

export class Item extends Phaser.Physics.Arcade.Sprite {
  public scene: GameScene; // 游戏场景实例
  public isFlying: boolean = false; // 物品是否处于飞行状态
  public heldBy: Player | null = null; // 持有该物品的玩家
  public thrower: Player | null = null; // 投掷该物品的玩家
  public homeStation?: Phaser.GameObjects.GameObject; // 物品的“家”工作站，用于重生等

  constructor(scene: GameScene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    this.scene = scene;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.PLAYER);
    this.setCircle(12, 2, 2);
    this.setCollideWorldBounds(true);
    // 根据物品类型设置合适的碰撞体大小
    if (texture === 'item_plate' || texture === 'item_soup' || texture === 'item_plate_dirty') {
      this.setCircle(20, -4, -4); // 盘子类物品使用更大的圆形碰撞体
    } else {
      this.setCircle(14, 2, 2); // 其他物品使用默认大小的圆形碰撞体
    }
  }
}
