import { Pot } from '../item/container/pot';
import { Station } from './station';

/**
 * 锅工作站类，处理煮汤逻辑
 */
export class PotStation extends Station {

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'station_pot', true, true);
    this.workSpeed = 0.1;
  }

  updateWhenIdle(_delta: number): void {
    if (!this.item) return;
    if (!(this.item instanceof Pot)) return;
    this.item.canTransfer = true;
    // 如果食材不为空 且 食材状态为 cut
    if (!this.item.isEmpty() && this.item.ingredients[0].lastCookState() == 'cut') {
      this.workStatus = 'working';
      this.item.canTransfer = false;
      return;
    }
    // todo 灶上突然加入煮一半的锅 也是working
  }

  updateWhenWorking(_delta: number): void {
    if (!this.item) {
      this.workStatus = 'idle';
      return;
    }
    if (!(this.item instanceof Pot)) {
      this.workStatus = 'idle';
      return;
    };
    if (this.item.isEmpty()) {
      this.workStatus = 'idle';
      return;
    }
    this.item.x = this.x + Math.sin(this.scene.game.getTime() * 0.01) * 1.5;
  }

  updateWhenDone() {
    if (!this.item) {
      this.workStatus = 'idle';
      return;
    };
    if (!(this.item instanceof Pot)) {
      this.workStatus = 'idle';
      return;
    };
    this.item.canTransfer = true;
    if (this.item.isEmpty()) {
      this.workStatus = 'idle';
      return;
    }
    const pot = this.item;
    // this.item.setTexture('item_soup_pot');
    const ingredient = pot.ingredients[0];
    ingredient.addCookstate('boil');
  }

  // placeItem(item: Item): void {
  //   // 只有处理好的食材可以放置
  //   if (item.texture.key !== 'item_tomato_cut') {
  //     return;
  //   }
  //   super.placeItem(item);
  // }
}

