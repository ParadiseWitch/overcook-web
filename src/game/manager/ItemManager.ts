import * as Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Item } from '../objects/Item';
import { Plate } from '../objects/Plate';
import { Ingredient } from '../objects/Ingredient';


const items: Item[] = []
function spawnItemAsHeld(scene: Phaser.Scene, player: Player, key: string): Item {
  let item: Item;
  // 此逻辑基于 CrateStation 的交互
  if (key === 'item_tomato') {
    item = new Ingredient(scene, player.x, player.y, key, 'unprocessed');
  } else if (key === 'item_soup') {
    item = new Plate(scene, player.x, player.y, key, 'with_soup');
  }
  else {
    // 默认通用物品或处理错误
    item = new Item(scene, player.x, player.y, key);
  }
  items.push(item);
  player.pickup(item); // 玩家拾取物品
  return item;
}


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
    item = new Plate(scene, x, y, key, 'clean');
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
  spawnItemAsHeld,
  spawnItemWorld
};