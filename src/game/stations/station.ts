import * as Phaser from 'phaser';
import { DEPTH } from '../config';
import { Item } from '../item';
import { Player } from '../player';

// export type WorkStatus = 'idle' | 'working' | 'done';

export abstract class Station extends Phaser.Physics.Arcade.StaticGroup {
  public textureKey: string; // 游戏场景实例
  public x: number; // 工作站的X坐标
  public y: number; // 工作站的Y坐标
  private canPlaceItem: boolean = true; // 能否放置物品
  public workStatus: 'idle' | 'working' | 'done' | 'danger' | 'fire' = 'idle'; // 工作状态
  public workSpeed: number = 0.15; // 工作速度
  public sprite: Phaser.Physics.Arcade.Sprite; // 工作站的物理精灵
  public hasBar: boolean = false; // 是否有进度条

  public item: Item | null = null; // 工作站上持有的物品
  public progress: number = 0; // 工作站的进度条值（例如切割、烹饪进度）
  public barBg?: Phaser.GameObjects.Rectangle; // 进度条背景
  public bar?: Phaser.GameObjects.Rectangle; // 进度条填充

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, canPlaceItem: boolean = true, hasBar: boolean = false) {
    super(scene.physics.world, scene);
    this.x = x;
    this.y = y;
    // FIXME
    this.textureKey = texture;
    this.sprite = this.create(x, y, texture); // 创建物理精灵并添加到场景的静态组
    this.sprite.setData('station', this); // 将当前Station实例存储到精灵数据中
    this.sprite.setDepth(DEPTH.STATION); // 设置层级

    this.canPlaceItem = canPlaceItem;
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

  // TODO 子类 {@link IngredientStation} 和 {@link @PotStation} 的 方法 interact 方法封装
  interact(player: Player) {
    // 工作台为空,玩家空手 -> 无
    if (!player.heldItem && !this.item) return; // TODO 食材箱 这里逻辑不一致

    // 工作站空,玩家不空手 -> 放
    if (!this.item && player.heldItem) {
      this.placeItem(player.heldItem);
      player.heldItem = null;
      return;
    }

    // 工作台不为空
    if (this.item) {
      this.item.interact(player); // TODO 灶 取放食材时要设置工作状态
      return;
    }
  }

  // 将物品放置在工作站上
  public placeItem(item: Item) {
    // 工作站不能放物品，直接返回
    if (!this.canPlaceItem) return;
    // 工作站已放置物品，直接返回
    if (this.item) return;
    // 物品已经被放置在某个工作台，直接返回
    if (item.station) return;

    this.item = item;
    item.station = this;
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
      case 'danger':
        this.updateWhenDanger(delta);
        break;
      case 'fire':
        this.updateWhenFire(delta);
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

  updateWhenDanger(_delta: number) {
  }

  updateWhenFire(_delta: number) {
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
