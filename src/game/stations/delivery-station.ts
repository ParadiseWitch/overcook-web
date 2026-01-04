import { DEPTH } from '../config';
import { Item } from '../item';
import { Plate } from '../item/container/plate';
import { Station } from './station';

export class DeliveryStation extends Station {
  score: number = 0;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'station_delivery', false); // 出餐口工作站不允许放置物体
  }

  public placeItem(item: Item): void {
    if (!item) return;
    if (!(item instanceof Plate)) return;
    if (item.isEmpty()) return;
    this.deliver(item);
    super.placeItem(item);
  }

  deliver(plate: Plate) {
    // 提示文字
    let tipText = '';
    // TODO:检测是否上菜成功
    if (plate.ingredients[0].lastCookState() != 'boil') {
      // 上菜失败
      tipText = "上菜失败!";
    } else {
      tipText = "+100";

      // 上菜成功
      plate.clearIngredients();
      plate.destroy(); // 销毁汤物品
      this.item = null;
      this.score += 100; // 增加得分

      const scoreText = this.scene.children.getByName('scoreText') as Phaser.GameObjects.Text;
      if (scoreText) {
        scoreText.setText('得分: ' + this.score); // 更新得分显示
      }

      // 延迟3秒后在出餐口生成脏盘子
      this.scene.time.delayedCall(3000, () => {
        this.scene.events.emit('add-dirty-plate');
      });
    }
    // 显示提示文本
    const tipTextUi = this.scene.add.text(this.x, this.y - 30, tipText, { fontSize: '20px', color: '#ffff00' })
      .setOrigin(0.5).setDepth(DEPTH.UI);
    this.scene.tweens.add({
      targets: tipTextUi,
      y: this.y - 60,
      alpha: 0,
      duration: 1000,
      onComplete: () => tipTextUi.destroy() // 动画结束后销毁文本
    });

  }
}
