import * as Phaser from 'phaser';
import { Station } from './Station';
import { GameScene } from '../scenes/GameScene';
import { Item } from '../objects/Item';
import { Plate } from '../objects/Plate';

export class DirtyPlateStation extends Station {
  constructor(scene: GameScene, x: number, y: number, texture: string = 'station_counter') { // 使用柜台纹理
    super(scene, x, y, texture, 'dirty-plate');
  }

  public interact(_player: Phaser.Physics.Arcade.Sprite, heldItem: Item | null): Item | null {
    // 玩家不能在脏盘子生成站放置物品
    if (heldItem) {
      return heldItem;
    }
    // 如果脏盘子已生成，玩家可以拾取
    if (this.item) {
      return this.removeItem();
    }
    return null;
  }

  public work(_player: Phaser.Physics.Arcade.Sprite, _delta: number): void {
    // 脏盘子生成站没有工作动作
  }

  public updateStation(_delta: number): void {
    // 脏盘子生成站由 DeliveryManager 更新以生成盘子
  }

  public spawnDirtyPlate(): void {
    if (!this.item) {
      const dirtyPlate = new Plate(this.scene, this.x, this.y, 'item_plate_dirty', 'dirty');
      this.scene.items.add(dirtyPlate);
      this.placeItem(dirtyPlate);
      dirtyPlate.homeStation = this.sprite; // 将此工作站的精灵设置为其家
    }
  }
}
