import * as Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { Item } from '../objects/Item';
import { Player } from '../objects/Player';
import { DEPTH } from '../config';

export class Station {
  public scene: GameScene; // 游戏场景实例
  public x: number; // 工作站的X坐标
  public y: number; // 工作站的Y坐标
  public sprite: Phaser.Physics.Arcade.Sprite; // 工作站的物理精灵
  public type: string; // 工作站类型

  public item: Item | null = null; // 工作站上持有的物品
  public progress: number = 0; // 工作站的进度条值（例如切割、烹饪进度）
  public barBg?: Phaser.GameObjects.Rectangle; // 进度条背景
  public bar?: Phaser.GameObjects.Rectangle; // 进度条填充

  constructor(scene: GameScene, x: number, y: number, textureKey: string, type: string) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.sprite = this.scene.stations.create(x, y, textureKey); // 创建物理精灵并添加到场景的静态组
    this.sprite.setData('station', this); // 将当前Station实例存储到精灵数据中
    this.sprite.setDepth(DEPTH.STATION); // 设置层级
    this.type = type;

    // 如果是可工作的工作站，则创建进度条
    if (['cut', 'sink', 'pot'].includes(type)) {
      this.barBg = this.scene.add.rectangle(x, y - 30, 40, 6, 0x000000).setDepth(DEPTH.UI).setVisible(false);
      this.bar = this.scene.add.rectangle(x - 20, y - 30, 0, 4, 0x00ff00).setDepth(DEPTH.UI + 1).setOrigin(0, 0.5).setVisible(false);
    }
  }

  // 获取工作站的物理精灵
  getSprite() {
    return this.sprite;
  }

  // 获取工作站的边界
  getBounds() {
    return this.sprite.getBounds();
  }

  // 与工作站交互的方法，由子类重写以实现特定逻辑
  interact(player: Player, heldItem: Item | null): Item | null {
    // 默认交互：如果工作站为空且玩家手持物品，则放下；如果工作站有物品且玩家空手，则拾取。
    if (!this.item && heldItem) {
      player.heldItem = null; // 玩家放下物品
      this.placeItem(heldItem); // 将物品放置在工作站上
      return null; // 物品已被放置
    } else if (this.item && !heldItem) {
      const itemToGive = this.item; // 获取工作站上的物品
      this.item = null; // 工作站清空
      return itemToGive; // 返回物品供玩家拾取
    }
    return heldItem; // 没有交互发生，返回玩家手持的物品
  }

  // 在工作站进行“工作”的方法，由子类重写以实现特定逻辑
  work(player: Player, delta: number) {
    // 通用工作站不做任何事情
  }

  // 将物品放置在工作站上
  placeItem(item: Item) {
    if (this.item) return; // 工作站已有物品
    this.item = item;
    item.heldBy = null; // 物品不再被持有
    item.isFlying = false; // 物品不再飞行
    if (item.body) {
      item.body.enable = false; // 禁用物理碰撞
      item.setVelocity(0, 0); // 停止移动
    }
    item.x = this.x;
    item.y = this.y;
    item.setDepth(DEPTH.ITEM); // 设置物品层级
  }

  // 每帧更新工作站状态
  update(delta: number) {
    if (this.item) {
      // 确保物品在视觉上吸附在工作站上
      if (!this.bar || !this.bar.visible) {
        this.item.x = this.x;
        this.item.y = this.y;
      }
      this.item.setDepth(DEPTH.ITEM); // 设置物品层级在工作站之上
    }
  }
  // 从工作站移除物品的方法
  public removeItem(): Item | null {
    const removedItem = this.item;
    this.item = null;
    if (removedItem) {
      if (removedItem.body instanceof Phaser.Physics.Arcade.Body) {
        removedItem.body.enable = true;
      }
    }
    return removedItem;
  }
}
