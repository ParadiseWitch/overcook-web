import * as Phaser from 'phaser';
import { DEPTH } from '../config';
import { Item } from '../item';
import { Container } from '../item/container/container';
import { Player } from '../player';


export abstract class Station extends Phaser.Physics.Arcade.StaticGroup {
  public textureKey: string; // 游戏场景实例
  public x: number; // 工作站的X坐标
  public y: number; // 工作站的Y坐标
  private canPlace: boolean = true; // 能否放置物品
  public canPick: boolean = true; // 能否拿去工作台上的物品
  public workStatus: 'idle' | 'working' | 'done' | 'danger' | 'fire' = 'idle'; // 工作状态
  public workSpeed: number = 0.15; // 工作速度
  public sprite: Phaser.Physics.Arcade.Sprite; // 工作站的物理精灵
  public useStationBar: boolean = false; // 是否有进度条

  public item: Item | null = null; // 工作站上持有的物品
  // private progress: number = 0; // 工作站的进度条值（例如切割、烹饪进度）
  public barBg?: Phaser.GameObjects.Rectangle; // 进度条背景
  public bar?: Phaser.GameObjects.Rectangle; // 进度条填充

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, canPlace: boolean = true, useStationBar: boolean = false) {
    super(scene.physics.world, scene);
    this.x = x;
    this.y = y;
    this.textureKey = texture;
    this.sprite = this.create(x, y, texture); // 创建物理精灵并添加到场景的静态组
    this.sprite.setData('station', this); // 将当前Station实例存储到精灵数据中
    this.sprite.setDepth(DEPTH.STATION); // 设置层级
    // 能否放置物品
    this.canPlace = canPlace;

    // 是否使用工作区的进度条而不是容器的进度条,是则创建进度条
    if (useStationBar) {
      this.useStationBar = useStationBar;
      this.barBg = this.scene.add.rectangle(x, y - 30, 40, 6, 0x000000).setDepth(DEPTH.UI).setVisible(false);
      this.bar = this.scene.add.rectangle(x - 20, y - 30, 0, 4, 0x00ff00).setDepth(DEPTH.UI + 1).setOrigin(0, 0.5).setVisible(false);
    }
  }

  getProgress(): number {
    if (!this.item) return 0;
    return this.item.getProgress()
  }

  setProgress(value: number) {
    if (!this.item) return;
    this.item.setProgress(value);
  }

  showBar() {
    if (this.useStationBar) {
      // 使用工作区的进度条, 显示item的进度
      if (!this.item) return;
      this.barBg?.setVisible(true);
      if (this.bar) {
        this.bar.setVisible(true);
        this.bar.width = (this.getProgress() / 100) * 40;
      }
    } else {
      // 使用容器的进度条
      if (!this.item || !(this.item instanceof Container)) return;
      this.item.showBar();
    }
  }

  hideBar() {
    if (this.useStationBar) {
      // 关闭工作区的进度条      if (!this.item) return;
      this.barBg?.setVisible(false);
      this.bar?.setVisible(false);
    } else {
      // 关闭容器的进度条
      if (!this.item || !(this.item instanceof Container)) return;
      this.item.hideBar();
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

  // 将物品放置在工作站上
  public placeItem(item: Item) {

    // 工作站不能放物品，直接返回
    if (!this.canPlace) return;
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
      // if (!this.bar || !this.bar.visible) {
      this.item.x = this.x;
      this.item.y = this.y;
      // }
      this.item.setDepth(DEPTH.ITEM); // 设置物品层级在工作站之上
    }


    switch (this.workStatus) {
      case 'idle':
        this.updateWhenIdle(delta);
        break;
      case 'working':
        if (!this.item) {
          this.workStatus = 'idle';
          break;
        }
        const progress = this.getProgress();
        if (progress >= 100) {
          this.setProgress(100);
          this.workStatus = 'done';
          return;
        }
        this.setProgress(progress + delta * this.workSpeed)
        this.showBar(); // 显示进度条
        this.updateWhenWorking(delta);
        break;
      case 'done':
        this.hideBar();
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
