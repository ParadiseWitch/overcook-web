import * as Phaser from 'phaser';
import { DEPTH } from '../config';
import { Item } from '../item/item';
import { Player } from '../player/player';

// export type WorkStatus = 'idle' | 'working' | 'done';

export class Station extends Phaser.Physics.Arcade.StaticGroup {
  public textureKey: string; // 游戏场景实例
  public x: number; // 工作站的X坐标
  public y: number; // 工作站的Y坐标
  public canPlaceItem: boolean = true; // 能否放置物品
  public workStatus: 'idle' | 'working' | 'done' | 'not_use' = 'idle'; // 工作状态
  public workSpeed: number = 0.15; // 工作速度
  public sprite: Phaser.Physics.Arcade.Sprite; // 工作站的物理精灵
  public hasBar: boolean = false; // 是否有进度条

  public item: Item | null = null; // 工作站上持有的物品
  public progress: number = 0; // 工作站的进度条值（例如切割、烹饪进度）
  public barBg?: Phaser.GameObjects.Rectangle; // 进度条背景
  public bar?: Phaser.GameObjects.Rectangle; // 进度条填充

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, hasBar: boolean = false) {
    super(scene.physics.world, scene);
    this.x = x;
    this.y = y;
    this.canPlaceItem = true;
    this.textureKey = texture;
    this.sprite = this.create(x, y, texture); // 创建物理精灵并添加到场景的静态组
    this.sprite.setData('station', this); // 将当前Station实例存储到精灵数据中
    this.sprite.setDepth(DEPTH.STATION); // 设置层级

    // 如果是可工作的工作站，则创建进度条
    if (hasBar) {
      this.barBg = this.scene.add.rectangle(x, y - 30, 40, 6, 0x000000).setDepth(DEPTH.UI).setVisible(false);
      this.bar = this.scene.add.rectangle(x - 20, y - 30, 0, 4, 0x00ff00).setDepth(DEPTH.UI + 1).setOrigin(0, 0.5).setVisible(false);
    }
  }

  showBar() {
    this.barBg?.setVisible(true);
    if (this.bar) {
      this.bar.setVisible(true);
      this.bar.width = (this.progress / 100) * 40;
    }
  }
  hideBar() {
    this.barBg?.setVisible(false);
    this.bar?.setVisible(false);
  }

  // 获取工作站的物理精灵
  getSprite() {
    return this.sprite;
  }

  // 获取工作站的边界
  getBounds() {
    return this.sprite.getBounds();
  }

  interact(player: Player) {
    // 玩家空手切工作站为空，直接返回
    if (!player.heldItem && !this.item) return;
    // 玩家手中有物品但是工作站没有
    if (player.heldItem && !this.item) {
      if (this.canPlaceItem) {
        this.placeItem(player.heldItem);
        player.heldItem = null;
      }
      return;
    }
    // 玩家空手但是工作站有
    if (!player.heldItem && this.item) {
      player.pickup(this.item);
      this.item = null;
      return;
    }
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


    switch (this.workStatus) {
      case 'idle':
        this.progress = 0;
        this.hideBar();
        this.updateWhenIdle(delta);
        break;
      case 'working':
        if (this.progress >= 100) {
          console.log('done', this.workStatus);
          this.workStatus = 'done';
          return;
        }
        this.progress += delta * this.workSpeed;
        console.log(this.progress);
        this.showBar(); // 显示进度条
        this.updateWhenWorking(delta);
        break;
      case 'done':
        this.updateWhenDone(delta);
        break;
      default:
        break;
    }

  }

  updateWhenIdle(_delta: number) {
  }

  updateWhenWorking(_delta: number) {
  }

  updateWhenDone(_delta: number) {
  }


  // 在工作站进行“工作”的方法，由子类重写以实现特定逻辑
  work(_player: Player) {
    // 通用工作站不做任何事情
  }


  // 从工作站移除物品的方法
  public removeItem() {
    this.item?.destroy()
    this.item = null;
  }
}
