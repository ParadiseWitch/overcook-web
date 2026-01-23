import * as Phaser from 'phaser';
import { DEPTH } from '../config';
import { Plate } from '../item/container/plate';
import { ALL_ITEMS } from '../manager/item-manager';
import { Station } from './station';
import { Item } from '../item';

/**
 * 脏盘子生成工作站
 * 
 * 玩家不能向此工作站放置物品，但可以拾取生成的脏盘子
 */
export class DirtyPlateStation extends Station {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'station_dirty_plate');
    this.scene.events.on('add-dirty-plate', () => {
      this.genDirtyPlate();
    });
  }

  // 玩家不能向脏盘子工作站放置物品
  canPlace(_item: Item): boolean {
    return false;
  }

  /**
   * 生成一个脏盘子并放置在工作站上
   */
  public genDirtyPlate(): void {
    // 工作站已有物品，不再生成（TODO: 后续可实现叠加）
    if (this.item) return;

    const dirtyPlate = new Plate(this.scene, this.x, this.y, 'dirty');
    ALL_ITEMS.push(dirtyPlate);

    // 手动设置关联（因为 canPlace 返回 false，无法使用 placeItem）
    this.item = dirtyPlate;
    dirtyPlate.station = this;
    dirtyPlate.heldBy = null;
    dirtyPlate.isFlying = false;
    dirtyPlate.homeStation = this;

    if (dirtyPlate.body) {
      dirtyPlate.body.enable = false;
      dirtyPlate.setVelocity(0, 0);
    }

    dirtyPlate.x = this.x;
    dirtyPlate.y = this.y;
    dirtyPlate.setDepth(DEPTH.ITEM);
  }
}
