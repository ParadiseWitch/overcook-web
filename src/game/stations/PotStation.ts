import type { GameScene } from '../scenes/GameScene';
import { Station } from './Station';
import { Player } from '../objects/Player';
import { Item } from '../objects/Item';
import { Plate } from '../objects/Plate';
import { DEPTH } from '../config';

export class PotStation extends Station {
  private soupSprite?: Phaser.GameObjects.Sprite; // 汤的视觉效果精灵

  constructor(scene: GameScene, x: number, y: number, key: string) {
    super(scene, x, y, key, 'pot'); // 锅工作站
    this.soupSprite = this.scene.add.sprite(x, y, 'item_soup_pot').setDepth(DEPTH.STATION + 1).setVisible(false);
  }

  interact(player: Player, heldItem: Item | null): Item | null {
    // 情况1：玩家手持盘子且锅中有煮好的汤
    if (heldItem instanceof Plate && this.progress >= 100) {
      heldItem.destroy(); // 销毁空盘子

      if (this.item) {
        this.item.destroy(); // 销毁锅中煮好的食材
        this.item = null;
      }
      this.progress = 0; // 重置进度
      if (this.soupSprite) this.soupSprite.setVisible(false); // 隐藏汤的视觉效果

      const soup = new Plate(this.scene, player.x, player.y, 'item_soup', 'with_soup'); // 创建一份汤
      this.scene.items.add(soup); // 将汤添加到场景物品组
      player.replaceHeldItem(soup); // 玩家拾取汤
      return soup; // 返回汤物品
    }

    // 情况2：玩家手持切好的番茄且锅为空
    if (heldItem && heldItem.texture.key === 'item_tomato_cut' && !this.item) {
      this.placeItem(heldItem); // 将番茄放入锅中
      player.heldItem = null; // 玩家手中物品清空
      return null; // 物品已被放置
    }

    // 其他情况，无交互
    return heldItem;
  }

  update(delta: number) {
    super.update(delta);

    // 如果锅中有切好的番茄，则开始煮汤
    if (this.item && this.item.texture.key === 'item_tomato_cut') {
      this.progress += delta * 0.05; // 增加烹饪进度
      if (this.barBg) this.barBg.setVisible(true); // 显示进度条背景
      if (this.bar) {
        this.bar.setVisible(true); // 显示进度条
        this.bar.fillColor = 0xffaa00; // 进度条颜色变为橙色
        this.bar.width = (this.progress / 100) * 40; // 更新进度条宽度
      }

      if (this.progress >= 100) {
        this.progress = 100; // 进度达到最大
        if (this.item) {
          this.item.setVisible(false); // 隐藏番茄块
        }
        if (this.soupSprite) this.soupSprite.setVisible(true); // 显示汤的视觉效果
      }
    } else {
      // 如果锅为空或物品不正确，则隐藏进度条
      if (this.barBg) this.barBg.setVisible(false);
      if (this.bar) this.bar.setVisible(false);
    }
  }
}
