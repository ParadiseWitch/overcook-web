import type { GameScene } from '../scenes/GameScene';
import { Station } from './Station';
import { Player } from '../objects/Player';
import { Item } from '../objects/Item';

export class CuttingStation extends Station {
  constructor(scene: GameScene, x: number, y: number, key: string) {
    super(scene, x, y, key, 'cut'); // 切菜工作站
  }

  work(player: Player, delta: number) {
    if (!this.item || this.item.texture.key !== 'item_tomato') {
      return; // 只有未切的番茄才能切
    }

    const workSpeed = 0.15; // 切菜速度
    this.progress += delta * workSpeed;

    if (this.barBg) this.barBg.setVisible(true); // 显示进度条背景
    if (this.bar) {
        this.bar.setVisible(true); // 显示进度条
        this.bar.width = (this.progress / 100) * 40; // 更新进度条宽度
    }
    
    // 视觉效果：模拟切菜时物品晃动
    this.item.x = this.x + (Math.random() - 0.5) * 2;


    if (this.progress >= 100) {
      this.progress = 0; // 重置进度
      if (this.barBg) this.barBg.setVisible(false); // 隐藏进度条背景
      if (this.bar) this.bar.setVisible(false); // 隐藏进度条

      this.item.setTexture('item_tomato_cut'); // 切换为切好的番茄纹理
      this.item.x = this.x; // 重置物品位置
      this.item.y = this.y;

      // 显示“Chopped!”文字效果
      const cutText = this.scene.add.text(this.x, this.y - 30, 'Chopped!', { fontSize: '14px', color: '#ff9900' })
        .setOrigin(0.5).setDepth(this.scene.cameras.main.depth + 1);
      this.scene.tweens.add({
        targets: cutText,
        y: this.y - 50,
        alpha: 0,
        duration: 800,
        onComplete: () => cutText.destroy() // 动画结束后销毁文字
      });
    }
  }
}
