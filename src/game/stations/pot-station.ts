import { Pot } from '../item/container/pot';
import { Station } from './station';

/**
 * 锅工作站类，处理煮汤逻辑
 */
export class PotStation extends Station {

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'station_pot', true, true);
    this.workSpeed = 0.01;
  }

  /*   interact(player: Player) {
      const heldItem = player.heldItem;
      // 情况1：玩家手持盘子且锅中有煮好的食材
      if (heldItem instanceof Plate && this.workStatus == 'done') {
        const plate = heldItem;
        // plate.destroy(); // 销毁空盘子
        if (this.item instanceof Pot && !this.item.isEmpty) {
          // this.item.destroy(); // 销毁锅中煮好的食材
          const pot = this.item;
          pot.transferTo(plate);
          this.workStatus = 'idle';
        }
        return;
      }
  
      // 情况2：玩家手持切好的食材且锅为空
      if (heldItem instanceof Ingredient && heldItem.cookStates.length == 1 && heldItem.cookStates[0] == 'cut' && this.workStatus == 'idle') {
        const ingredient = heldItem;
        if (this.item instanceof Pot) {
          const pot = this.item;
          pot.addIngredient(ingredient)
          player.heldItem = null;
          this.workStatus = 'working';
          return;
        }
      }
  
      // player空手或者station空
      if (!player.heldItem || !this.item) {
        super.interact(player);
      }
      // 其他情况，无交互
    }
   */

  updateWhenIdle(_delta: number): void {
    if (!this.item) return;
    if (!(this.item instanceof Pot)) return;
    // 如果食材不为空 且 食材状态为 cut
    if (!this.item.isEmpty() && this.item.ingredients[0].lastCookState() == 'cut') {
      this.workStatus = 'working';
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

