import * as Phaser from 'phaser';
import { Item } from '../item/Item';
import { Plate } from '../item/container/Plate';


const items: Item[] = []

/**
 * @method spawnItemWorld
 * @description 在世界指定位置生成一个新物品。
 * @param key 物品的纹理键
 * @param x 物品的X坐标
 * @param y 物品的Y坐标
 * @param homeStation 物品的“家”工作站 (例如盘子来自哪个盘子生成器)
 * @returns 生成的物品精灵
 */
function spawnItemWorld(scene: Phaser.Scene, key: string, x: number, y: number, homeStation?: Phaser.GameObjects.GameObject): Item {
  let item: Item;
  if (key === 'item_plate') {
    item = new Plate(scene, x, y, key, 'empty');
  } else if (key === 'item_plate_dirty') {
    item = new Plate(scene, x, y, key, 'dirty');
  }
  else {
    item = new Item(scene, x, y, key);
  }
  items.push(item);
  item.homeStation = homeStation; // 设置物品的家工作站 (用于重生等，此处保持原样不改动逻辑)
  return item;
}

export default {
  items,
  spawnItemWorld
};