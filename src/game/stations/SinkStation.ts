import { Station } from './Station';
import { DEPTH } from '../config';
import { Plate } from '../item/container/Plate';

export class SinkStation extends Station {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'station_sink', true); // 水槽工作站
    this.workSpeed = 0.12; // 清洗速度
  }

  work() {
    if (!this.item || !(this.item instanceof Plate) || this.item.status != 'dirty') {
      return; // 只有脏盘子才能清洗
    }
    this.workStatus = 'working';
  }

  updateWhenWorking(delta: number): void {
    if (!this.item) return;
    // 视觉效果：模拟清洗时盘子晃动
    this.item.x = this.x + Math.sin(this.scene.game.getTime() * 0.01) * 1.5;
  }


  updateWhenDone() {
    if (this.item == null) throw new Error("工作站无物体");

    this.progress = 0; // 重置进度
    this.hideBar();

    this.item.setTexture('item_plate'); // 切换为干净盘子纹理
    this.item.x = this.x; // 重置物品位置
    this.item.y = this.y;

    // 显示“Clean!”文字效果
    const cleanText = this.scene.add.text(this.x, this.y - 30, 'Clean!', { fontSize: '14px', color: '#00ff00' })
      .setOrigin(0.5).setDepth(DEPTH.UI_TIP);
    this.scene.tweens.add({
      targets: cleanText,
      y: this.y - 50,
      alpha: 0,
      duration: 800,
      onComplete: () => cleanText.destroy() // 动画结束后销毁文字
    });

    this.workStatus = 'idle';
  }
}
