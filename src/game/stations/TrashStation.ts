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


  updateWhenIdle(delta: number): void {
    if (!this.item) return;
    this.workStatus = 'working';
  }

  updateWhenWorking(delta: number): void {
    if (!this.item) return;
    this.item.rotation += delta * 0.01;
    this.item.scale = Math.max(this.item.scale - delta * 0.001, 0);
    console.log(this.item.scale)
    this.scene.time.delayedCall(1000, () => {
      this.item?.destroy();
      this.item = null;
      this.workStatus = 'done';
    })
  }

  updateWhenDone() {
    this.workStatus = 'idle';
  }

  // placeItem(item: Item): void {
  //   if (this.item) return;
  //   this.item = item;
  //   this.item.rotation = this.scene.game.getTime();
  //   this.item.scale = 1;
  //   this.scene.time.delayedCall(500, () => {
  //     this.item?.destroy();
  //     this.item = null;
  //   })
  // }
}
