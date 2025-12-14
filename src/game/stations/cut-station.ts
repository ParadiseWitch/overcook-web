import { DEPTH } from '../config';
import { Ingredient } from '../item/ingredient/ingredient';
import { Station } from './station';

export class CutStation extends Station {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'station_cut', true, true); // 切菜工作站
    this.workSpeed = 0.15; // 切菜速度
  }

  updateWhenWorking(_delta: number): void {
    if (!this.item) return;
    this.item.x = this.x + (Math.random() - 0.5) * 2;
  }

  updateWhenDone(): void {
    if (this.workStatus != 'done') return;
    if (!this.item) return;
    if (!(this.item instanceof Ingredient)) return;
    if (this.item.cookStates.length > 0) return;

    this.item.addCookstate("cut");
    this.item.x = this.x; // 重置物品位置
    this.item.y = this.y;

    // 显示“Chopped!”文字效果
    const cutText = this.scene.add.text(this.x, this.y - 30, 'Chopped!', { fontSize: '14px', color: '#ff9900' })
      .setOrigin(0.5).setDepth(DEPTH.UI_TIP);
    this.scene.tweens.add({
      targets: cutText,
      y: this.y - 50,
      alpha: 0,
      duration: 800,
      onComplete: () => cutText.destroy() // 动画结束后销毁文字
    });
    this.workStatus = 'idle';
  }

  work() {
    // 只有未烹饪的食材可以切
    if (!this.item) return;
    if (!(this.item instanceof Ingredient)) return;
    if (this.item.cookStates.length > 0) return;
    this.workStatus = 'working';
  }
}
