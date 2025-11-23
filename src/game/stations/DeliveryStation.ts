import type { GameScene } from '../scenes/GameScene';
import { Station } from './Station';
import { Player } from '../objects/Player';
import { Item } from '../objects/Item';

export class DeliveryStation extends Station {
  constructor(scene: GameScene, x: number, y: number, key: string) {
    super(scene, x, y, key, 'delivery'); // 出餐口工作站
  }

  interact(player: Player, heldItem: Item | null): Item | null {
    if (heldItem && heldItem.texture.key === 'item_soup') {
      // 交付逻辑将由 DeliveryManager 处理
      // 这保留了 GameScene 中 deliver 方法的原始逻辑
      this.scene.deliveryManager.deliver(player);
    }
    // 返回玩家手中持有的物品，因为 deliver() 方法会处理清空手部物品的逻辑
    return player.heldItem;
  }
}
