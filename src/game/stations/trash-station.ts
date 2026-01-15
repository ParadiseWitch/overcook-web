import { DEPTH } from '../config';
import { Item } from '../item';
import { Container } from '../item/container/container';
import { Station } from './station';

export class TrashStation extends Station {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'station_trash');
  }

  public placeItem(item: Item): boolean {
    // 只有以下情况不会被扔掉：
    // 1. 投掷的带有食材的容器会不被扔掉，放在垃圾筒上
    if (item instanceof Container && !item.isEmpty() && item.isFlying) {
      super.placeItem(item);
      return true;
    }

    // 手持非空容器应该只倒掉食材, 盘子不放在垃圾筒上
    if (item instanceof Container && item.heldBy && !item.isEmpty()) {
      item.clear();
      return false;
    }

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
    return true;
  }

}
