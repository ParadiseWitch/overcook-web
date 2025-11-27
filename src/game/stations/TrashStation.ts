import { Station } from './Station';
import { Player } from '../objects/Player';
import { Item } from '../objects/Item';

export class TrashStation extends Station {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'station_trash'); // 垃圾桶工作站
  }

  interact(player: Player) {
    if (player.heldItem) {
      // 销毁物品
      player.heldItem.destroy();
      player.heldItem = null;
    }
  }

  placeItem(item: Item): void {
    item.destroy();
  }
}
