import { Player } from "../../player/player";
import { Ingredient } from "../ingredient/ingredient";
import { Item } from "../item";


export type ContainerStatus = 'empty' | 'dirty' | 'combinable' | 'full';

export class Container extends Item {
  status: ContainerStatus;
  ingredients: Ingredient[];

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, status: ContainerStatus = 'empty') {
    super(scene, x, y, texture);
    this.status = status;
    this.ingredients = [];
  }

  isEmpty() {
    return this.ingredients.length <= 0;
  }

  update(_delta: number): void {
    this.ingredients.forEach(ingredient => {
      ingredient.x = this.x;
      ingredient.y = this.y;
    })

    switch (this.status) {
      case 'empty':
        // 设置纹理
        break;
      case 'combinable':
      case 'dirty':
      default:
        break;
    }
  }

  interact(player: Player) {
    const heldItem = player.heldItem;
    if (!heldItem) {
      player.pickup(this);
    } else if (heldItem instanceof Ingredient) {
      this.addIngredient(heldItem);
      player.heldItem = null;
    } else if (heldItem instanceof Container) {
      if (heldItem.isEmpty() && !this.isEmpty()) {
        this.transferTo(heldItem);
      } else if (!heldItem.isEmpty() && this.isEmpty()) {
        heldItem.transferTo(this);
      }
    }
  }

  addIngredientCondition(ingredient: Ingredient): boolean {
    return true;
  }

  addIngredient(ingredient: Ingredient) {
    if (!this.addIngredientCondition(ingredient)) return;

    // 将食材放入容器内部
    ingredient.heldBy = null;
    ingredient.isFlying = false;
    ingredient.x = this.x;
    ingredient.y = this.y;

    if (ingredient.body) {
      ingredient.body.enable = false;
      ingredient.setVelocity(0, 0);
    }

    this.ingredients.push(ingredient);
  }

  clearIngredients() {
    this.ingredients.forEach(e => e.destroy());
    this.ingredients = [];
    this.setTexture('item_plate'); // 切换为干净盘子纹理
  }

  transferTo(container: Container) {
    this.ingredients.forEach(ingredient => {
      container.addIngredient(ingredient);
    });
    this.ingredients = [];
  }


}