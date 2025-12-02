import { Ingredient } from "../ingredient/ingredient";
import { Container, ContainerStatus } from "./container";


export class Pot extends Container {

  constructor(scene: Phaser.Scene, x: number, y: number, status: ContainerStatus = 'empty') {
    super(scene, x, y, "item_pot", status);
    this.setCircle(20, -4, -4);
  }

  addIngredientCondition(ingredient: Ingredient): boolean {
    const cookStates = ingredient.cookStates;
    return cookStates.length == 1 && cookStates[0] == 'cut';
  }

}
