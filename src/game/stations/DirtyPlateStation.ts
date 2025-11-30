import * as Phaser from 'phaser';
import { Plate } from '../item/container/Plate';
import { ALL_ITEMS } from '../manager/ItemManager';
import { Station } from './Station';

export class DirtyPlateStation extends Station {
  constructor(scene: Phaser.Scene, x: number, y: number) { // 使用柜台纹理
    super(scene, x, y, 'station_dirty_plate');
    this.canPlaceItem = false;
    this.scene.events.on('add-dirty-plate', () => {
      this.genDirtyPlate()
    });
  }


  /**
   * 生成一个脏盘子并放置在工作站上
   */
  public genDirtyPlate(): void {
    if (!this.item) {
      const dirtyPlate = new Plate(this.scene, this.x, this.y, 'item_plate_dirty', 'dirty');
      ALL_ITEMS.push(dirtyPlate); // 从ItemManager中删除，以防重复管理
      this.placeItem(dirtyPlate);
      dirtyPlate.homeStation = this.sprite; // 将此工作站的精灵设置为其家
    }
  }
}
