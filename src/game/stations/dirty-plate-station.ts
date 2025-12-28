import * as Phaser from 'phaser';
import { DEPTH } from '../config';
import { Plate } from '../item/container/plate';
import { ALL_ITEMS } from '../manager/item-manager';
import { Station } from './station';

export class DirtyPlateStation extends Station {
  constructor(scene: Phaser.Scene, x: number, y: number) { // 使用柜台纹理
    super(scene, x, y, 'station_dirty_plate', false);
    this.scene.events.on('add-dirty-plate', () => {
      this.genDirtyPlate()
    });
  }


  /**
   * 生成一个脏盘子并放置在工作站上
   */
  public genDirtyPlate(): void {
    if (!this.item) {
      const dirtyPlate = new Plate(this.scene, this.x, this.y, 'dirty');
      ALL_ITEMS.push(dirtyPlate); // 从ItemManager中删除，以防重复管理
      // this.placeItem(dirtyPlate);
      // 工作站已放置物品，直接返回 TODO:LATER 应该叠加
      if (this.item) return;
      this.item = dirtyPlate;
      dirtyPlate.station = this;
      dirtyPlate.heldBy = null; // 物品不再被持有
      dirtyPlate.isFlying = false; // 物品不再飞行
      if (dirtyPlate.body) {
        dirtyPlate.body.enable = false; // 禁用物理碰撞
        dirtyPlate.setVelocity(0, 0); // 停止移动
      }
      dirtyPlate.x = this.x;
      dirtyPlate.y = this.y;
      dirtyPlate.setDepth(DEPTH.ITEM); // 设置物品层级
      dirtyPlate.homeStation = this; // 将此工作站的精灵设置为其家
    }
  }
}
