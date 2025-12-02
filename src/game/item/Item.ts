import * as Phaser from 'phaser';
import { DEPTH } from '../config';
import { Player } from '../player/player';

export class Item extends Phaser.Physics.Arcade.Sprite {
  public isFlying: boolean = false; // 物品是否处于飞行状态
  public heldBy: Player | null = null; // 持有该物品的玩家
  public thrower: Player | null = null; // 投掷该物品的玩家
  public homeStation?: Phaser.GameObjects.GameObject; // 物品的“家”工作站，用于重生等

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.PLAYER);
    this.setCircle(12, 2, 2);
    this.setCollideWorldBounds(true);
  }

  interact(player: Player) {
    player.pickup(this);
  }
  update(delta: number): void {
    // 如果物品处于飞行状态，则更新其位置
    if (this.isFlying) {
      console.log(this.body?.velocity);
      if (!this.body?.velocity || (this.body?.velocity.x == 0 && this.body?.velocity.y == 0)) {
        this.isFlying = false;
        this.thrower = null;
        return;
      };
    }
  }
}
