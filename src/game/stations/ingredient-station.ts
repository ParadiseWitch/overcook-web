import { Ingredient } from '../item/ingredient/ingredient';
import { ALL_ITEMS } from '../manager/item-manager';
import { Player } from '../player';
import { Station } from './station';

/**
 * 食材箱
 */
export class IngredientStation<C extends new (...args: any[]) => Ingredient> extends Station {
  ingredientType: C;
  // 箱子中生成的食材类型
  constructor(scene: Phaser.Scene, x: number, y: number, ingredientType: C, key: string = 'station_crate',) {
    super(scene, x, y, key);
    this.ingredientType = ingredientType;
  }

  interact(player: Player) {
    super.interact(player);
    // 玩家空手,工作站为空，取食材
    if (!player.heldItem && !this.item) {
      const newIngredient = new this.ingredientType(this.scene, this.x, this.y);
      player.pickup(newIngredient);
      ALL_ITEMS.push(newIngredient); // 添加到ItemManager的物品列表
      return newIngredient; // 玩家拾取新食材
    }
  }
}

