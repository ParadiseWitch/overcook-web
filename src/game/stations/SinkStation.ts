import type { GameScene } from '../scenes/GameScene';
import { Station } from './Station';
import { Player } from '../objects/Player';
import { Item } from '../objects/Item';

export class SinkStation extends Station {
  constructor(scene: GameScene, x: number, y: number, key: string) {
    super(scene, x, y, key, 'sink'); // 水槽工作站
  }

  work(player: Player, delta: number) {
    if (!this.item || this.item.texture.key !== 'item_plate_dirty') {
      return; // 只有脏盘子才能清洗
    }

    const workSpeed = 0.12; // 清洗速度
    this.progress += delta * workSpeed;

    if (this.barBg) this.barBg.setVisible(true); // 显示进度条背景
    if (this.bar) {
        this.bar.setVisible(true); // 显示进度条
        this.bar.width = (this.progress / 100) * 40; // 更新进度条宽度
    }
    
    // 视觉效果：模拟清洗时盘子晃动
    this.item.x = this.x + Math.sin(this.scene.game.getTime() * 0.01) * 1.5;

    if (this.progress >= 100) {
      this.progress = 0; // 重置进度
      if (this.barBg) this.barBg.setVisible(false); // 隐藏进度条背景
      if (this.bar) this.bar.setVisible(false); // 隐藏进度条

      this.item.setTexture('item_plate'); // 切换为干净盘子纹理
      this.item.x = this.x; // 重置物品位置
      this.item.y = this.y;

      // 显示“Clean!”文字效果
      const cleanText = this.scene.add.text(this.x, this.y - 30, 'Clean!', { fontSize: '14px', color: '#00ff00' })
        .setOrigin(0.5).setDepth(this.scene.cameras.main.depth + 1);
      this.scene.tweens.add({
        targets: cleanText,
        y: this.y - 50,
        alpha: 0,
        duration: 800,
        onComplete: () => cleanText.destroy() // 动画结束后销毁文字
      });
    }
  }
}
