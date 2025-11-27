import * as Phaser from 'phaser';
import { Station } from './Station';
import { Plate } from '../objects/Plate';
import ItemManager from '../manager/ItemManager';

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
      ItemManager.items.push(dirtyPlate); // 从ItemManager中删除，以防重复管理
      this.placeItem(dirtyPlate);
      dirtyPlate.homeStation = this.sprite; // 将此工作站的精灵设置为其家
    }
  }
}
