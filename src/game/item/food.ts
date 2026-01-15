import { DEPTH } from "../config";
import { Ingredient } from "./ingredient/ingredient";

export default class Food extends Phaser.Physics.Arcade.Sprite {
  private barBg: Phaser.GameObjects.Rectangle; // 进度条背景
  private bar: Phaser.GameObjects.Rectangle; // 进度条填充
  ingredients: Ingredient[]

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    this.ingredients = []
    this.barBg = this.scene.add.rectangle(x, y - 30, 40, 6, 0x000000).setDepth(DEPTH.UI).setVisible(false);
    this.bar = this.scene.add.rectangle(x - 20, y - 30, 0, 4, 0x00ff00).setDepth(DEPTH.UI + 1).setOrigin(0, 0.5).setVisible(false);
  }

  setXy(x: number, y: number) {
    // TODO: 具体为止如何分布?
    this.ingredients.forEach(ingredient => {
      ingredient.x = x;
      ingredient.y = y;
      ingredient.depth = DEPTH.UI + 1;
    })
  }

  size(): number {
    return this.ingredients.length;
  }

  isEmpty(): boolean {
    return this.size() <= 0;
  }

  add(ingredient: Ingredient) {
    this.ingredients.push(ingredient);
    // ingredient.setVisible(false);
    // 如果食材原来被角色持有，角色放手
    if (ingredient.heldBy) {
      ingredient.heldBy.heldItem = null;
      ingredient.heldBy = null;
    }
    // 锅里的鸭子才不会飞呢
    ingredient.isFlying = false;
    // 将食材放入容器内部
    this.setXy(this.x, this.y);

    if (ingredient.body) {
      ingredient.body.enable = false;
      ingredient.setVelocity(0, 0);
    }
  }

  last(): Ingredient {
    return this.ingredients[this.size() - 1];
  }

  has(ingredient: Ingredient): boolean {
    return this.ingredients.includes(ingredient);
  }

  getProgress(): number {
    if (this.isEmpty()) return 0;
    const sum = this.ingredients.reduce((prev, i) => prev + i.getProgress(), 0);
    return sum / this.size();
  }

  setProgress(value: number) {
    if (this.isEmpty()) return;
    const delta = (value - this.getProgress()) * this.ingredients.length;
    this.ingredients.reduce((remaining, ingredient) => {
      const current = ingredient.getProgress();
      const space = 100 - current;
      const allocated = Math.min(remaining, space);
      ingredient.setProgress(current + allocated);
      return remaining - allocated;
    }, delta);
  }

  showBar() {
    this.barBg.setVisible(true);
    this.bar.setVisible(true);
    this.bar.width = (this.getProgress() / 100) * 40;
  }

  hideBar() {
    this.barBg.setVisible(false);
    this.bar.setVisible(false);
  }

  update(_delta: number) {
    // 进度条跟着容器移动
    if (this.bar) {
      this.bar.x = this.x - 20;
      this.bar.y = this.y - 30;
    }
    if (this.barBg) {
      this.barBg.x = this.x;
      this.barBg.y = this.y - 30;
    }
  }

  destroy() {
    this.ingredients.forEach(e => e.destroy());
    this.ingredients = [];
    super.destroy();
  }

}
