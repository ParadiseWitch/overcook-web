import type { GameScene } from '../scenes/GameScene';
import { Station } from './Station';
import { Player } from '../objects/Player';
import { Item } from '../objects/Item';

export class TrashStation extends Station {
  constructor(scene: GameScene, x: number, y: number, key: string) {
    super(scene, x, y, key, 'trash'); // 垃圾桶工作站
  }

  interact(player: Player, heldItem: Item | null): Item | null {
    if (heldItem) {
      // 原始逻辑中被丢弃的物品不会重生。
      // 为保持业务逻辑不变，此处不做修改。
      heldItem.destroy(); // 销毁物品
    }
    return null; // 玩家手中物品清空
  }
}
