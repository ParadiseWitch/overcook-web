import { DEPTH } from '../config';
import { Item } from '../item';
import { Container } from '../item/container/container';
import { Ingredient } from '../item/ingredient/ingredient';
import { Station } from './station';

export class TrashStation extends Station {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'station_trash', false);
  }

  public placeItem(item: Item): void {
    if (!item) return;
    this.trash(item);
  }

  trash(item: Item) {
    if (item instanceof Container && !item.isFlying) {
      item.ingredients.forEach(i => i.destroy());
      item.ingredients = [];
      // HACK: 
      // 需求：容器只有角色手动交互时才可以倒掉食材，无法通过throw的方式倒掉食材
      // 倒掉之后要将空容器拿在手上
      const player = item.heldBy;
      this.scene.time.delayedCall(100, () => {
        if (player) {
          player.pick(item);
        }
      });
      return;
    }

    if (item instanceof Ingredient) {
      item.isFlying = false; // 物品不再飞行
      item.heldBy = null; // 物品不再被持有
      if (item.body) {
        item.body.enable = false; // 禁用物理碰撞
        item.setVelocity(0, 0); // 停止移动
      }
      item.x = this.x;
      item.y = this.y;
      item.setDepth(DEPTH.ITEM); // 设置物品层级
      this.scene.tweens.add({
        targets: item,
        rotation: "+=10",
        scale: "0",
        duration: 1000,
        onComplete: () => item.destroy()
      });
    }

  }

}
