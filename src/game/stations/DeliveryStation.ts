import { Station } from './Station';
import { DEPTH } from '../config';

export class DeliveryStation extends Station {
  score: number = 0;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'station_delivery'); // 出餐口工作站
  }

  update(delta: number): void {
    super.update(delta);
    if (!this.item || this.item.texture.key !== 'item_soup') return; // 只有汤可以交付
    this.deliver();
  }

  deliver() {
    if (!this.item || this.item.texture.key !== 'item_soup') return; // 只有汤可以交付

    this.item.destroy(); // 销毁汤物品
    this.item = null;

    this.score += 100; // 增加得分
    const scoreText = this.scene.children.getByName('scoreText') as Phaser.GameObjects.Text;
    if (scoreText) {
      scoreText.setText('得分: ' + this.score); // 更新得分显示
    }

    // 显示得分提示文本
    const deliveryText = this.scene.add.text(this.x, this.y - 30, '+100', { fontSize: '20px', color: '#ffff00' })
      .setOrigin(0.5).setDepth(DEPTH.UI);
    this.scene.tweens.add({
      targets: deliveryText,
      y: this.y - 60,
      alpha: 0,
      duration: 1000,
      onComplete: () => deliveryText.destroy() // 动画结束后销毁文本
    });

    // 延迟3秒后在出餐口生成脏盘子
    this.scene.time.delayedCall(3000, () => {
      this.scene.events.emit('add-dirty-plate');
    });
  }
}
