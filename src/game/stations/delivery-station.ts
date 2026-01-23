import { DEPTH } from '../config';
import { Item } from '../item';
import { Plate } from '../item/container/plate';
import { Station } from './station';

export class DeliveryStation extends Station {
  score: number = 0;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'station_delivery');
  }

  canPlace(item: Item): boolean {
    // 只有扔盘子时才会放置到此处
    if (item instanceof Plate && !item.isEmpty() && item.thrower) {
      console.log(item.thrower);
      return true;
    }
    return false;
  }

  public placeItem(item: Item): boolean {
    const placeSucc = super.placeItem(item);
    if (item instanceof Plate) {
      this.deliver(item);
    }
    return placeSucc;
  }

  deliver(plate: Plate) {
    let tipText = '';
    // TODO: 使用 FoodMatcher 进行菜谱匹配，替代硬编码状态检查
    const firstIngredient = plate.food.ingredients[0];
    const isValidDish = plate && !plate.isEmpty() 
      && firstIngredient?.lastCookState() === 'stir-fry';

    if (!isValidDish) {
      tipText = "上菜错误! -60";
      this.score -= 60;
    } else {
      tipText = "+100";
      this.score += 100;

      // 延迟3秒后在出餐口生成脏盘子
      this.scene.time.delayedCall(3000, () => {
        this.scene.events.emit('add-dirty-plate');
      });
    }

    // 销毁
    plate.clear();
    plate.destroy();
    this.item = null;

    // 更新得分显示
    const scoreText = this.scene.children.getByName('scoreText') as Phaser.GameObjects.Text;
    if (scoreText) {
      scoreText.setText('得分: ' + this.score);
    }

    // 显示提示文本
    const tipTextUi = this.scene.add.text(this.x, this.y, tipText, { fontSize: '20px', color: '#ffff00' })
      .setOrigin(0.5).setDepth(DEPTH.UI);
    this.scene.tweens.add({
      targets: tipTextUi,
      y: this.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => tipTextUi.destroy() // 动画结束后销毁文本
    });

  }
}
