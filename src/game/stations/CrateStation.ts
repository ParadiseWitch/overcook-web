import type { GameScene } from '../scenes/GameScene';
import { Station } from './Station';
import { Player } from '../objects/Player';
import { Item } from '../objects/Item';
import { Ingredient } from '../objects/Ingredient';

export class CrateStation extends Station {
  private ingredientType: string; // 箱子中生成的食材类型

  constructor(scene: GameScene, x: number, y: number, key: string, ingredientType: string) {
    super(scene, x, y, key, 'crate');
    this.ingredientType = ingredientType;
  }

  interact(player: Player, heldItem: Item | null): Item | null {
    if (!heldItem && !this.item) {
      const newIngredient = new Ingredient(this.scene, this.x, this.y, this.ingredientType, 'unprocessed');
      this.scene.items.add(newIngredient); // 添加到场景的物品组
      return newIngredient; // 玩家拾取新食材

    }
    return super.interact(player, heldItem);
  }
}
