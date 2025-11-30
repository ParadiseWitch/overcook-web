import { Station } from './Station';
import { Player } from '../player/Player';
import { Item } from '../item/Item';
import { Plate } from '../item/container/Plate';
import ItemManager from '../manager/ItemManager';

/**
 * 锅工作站类，处理煮汤逻辑
 */
export class PotStation extends Station {

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'station_pot', true);
  }

  interact(player: Player) {
    const heldItem = player.heldItem;
    // 情况1：玩家手持盘子且锅中有煮好的汤
    if (heldItem instanceof Plate && this.progress >= 100) {
      heldItem.destroy(); // 销毁空盘子

      if (this.item) {
        this.item.destroy(); // 销毁锅中煮好的食材
        this.item = null;
        this.workStatus = 'idle';
      }

      const soup = new Plate(this.scene, player.x, player.y, 'item_soup', 'full'); // 创建一份汤
      ItemManager.items.push(soup); // 将汤添加到ItemManager的物品列表
      player.replaceHeldItem(soup); // 玩家拾取汤
      return; // 返回汤物品
    }

    // 情况2：玩家手持切好的番茄且锅为空
    if (heldItem && heldItem.texture.key === 'item_tomato_cut' && !this.item) {
      this.placeItem(heldItem); // 将番茄放入锅中
      player.heldItem = null; // 玩家手中物品清空
      return; // 物品已被放置
    }

    // 其他情况，无交互
  }


  updateWhenIdle(delta: number): void {
    if (!this.item) return;
    // 开始煮汤
    this.workStatus = 'working';
  }

  updateWhenWorking(delta: number): void {

  }

  updateWhenDone() {
    if (!this.item) return;
    this.item.setTexture('item_soup_pot');
  }

  placeItem(item: Item): void {
    // 只有处理好的食材可以放置
    if (item.texture.key !== 'item_tomato_cut') {
      return;
    }
    super.placeItem(item);
  }
}
