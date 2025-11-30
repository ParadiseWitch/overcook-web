import * as Phaser from 'phaser';
import { DASH_TIME, DEPTH, SPEED_DASH, SPEED_WALK } from '../config';
import { PlayerKeyMap } from '../types/types';
import { Item } from '../item/Item';
import { Station } from '../stations/Station';
import stationManager from "../manager/StationManager";
import itemManager from "../manager/ItemManager";


export type Direction = { x: number, y: number };

export class Player extends Phaser.Physics.Arcade.Sprite {
  public id: number; // 玩家ID
  public keyMap: PlayerKeyMap; // 玩家按键
  public heldItem: Item | null = null; // 玩家手中持有的物品
  public facing: Phaser.Math.Vector2; // 玩家朝向
  public speed: number = SPEED_WALK; // 玩家速度
  public isDashing: boolean = false; // 玩家是否在冲刺状态
  public dashTimer: number = 0; // 冲刺持续时间计时器
  public dashCooldown: number = 0; // 冲刺冷却时间
  public dashEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  public lastCanBeInteractObj: Station | Item;

  constructor(scene: Phaser.Scene, id: number, x: number, y: number, color: number, keyMap: { [key: string]: string }) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.id = id;
    if (!scene.input.keyboard) {
      throw new Error("键盘未初始化"); // 键盘未初始化
    }
    this.keyMap = scene.input.keyboard.addKeys(keyMap) as PlayerKeyMap;

    this.facing = new Phaser.Math.Vector2(1, 0);

    this.setTint(color);
    this.setDepth(DEPTH.PLAYER);
    this.setCircle(15, 2, 2);
    this.setCollideWorldBounds(true);
    this.dashEmitter = scene.add.particles(3, 3, 'particle_smoke');
    this.dashEmitter.setConfig({
      speed: 100,
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 300
    });
    this.dashEmitter.startFollow(this);
    this.dashEmitter.stop();
  }

  // 拾取物品逻辑，与原始GameScene中的逻辑保持一致。
  pickup(item: Item) {
    if (this.heldItem) return;
    this.replaceHeldItem(item);
  }

  replaceHeldItem(newItem: Item) {
    this.heldItem = newItem;
    newItem.heldBy = this;
    newItem.isFlying = false;

    if (newItem.body) {
      newItem.body.enable = false; // 拾取时无物理碰撞
    }
    newItem.setVisible(true);
  }

  putDownToFloor() {
    if (this.heldItem == null) return;
    const item: Item = this.heldItem;
    // 放置在地面上的逻辑
    item.x = this.x + this.facing.x * 32; // 放置在玩家前方
    item.y = this.y + this.facing.y * 32;
    this.heldItem = null; // 玩家手中物品清空
    item.heldBy = null; // 物品不再被持有
    if (item.body) {
      item.body.enable = true; // 启用物理碰撞
      (item.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0); // 停止移动
    }
  }

  dash() {
    if (this.dashCooldown > 0 || (this.facing.x == 0 && this.facing.y == 0)) return;
    this.isDashing = true; // 激活冲刺状态
    this.dashTimer = DASH_TIME; // 设置冲刺持续时间
    this.dashCooldown = 300; // 重制冷却时间
    this.dashEmitter.start(); // 启动粒子效果
    this.speed = SPEED_DASH; // 设置冲刺速度
  }

  stopDash() {
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashEmitter.stop();
    this.speed = SPEED_WALK;
  }

  // 更新玩家状态和行为
  update(delta: number) {
    // 更新冲刺计时器
    if (this.isDashing) {
      this.dashTimer -= delta;
      if (this.dashTimer <= 0) this.stopDash();
    }
    // 更新冲刺冷却时间
    if (this.dashCooldown > 0) this.dashCooldown -= delta
    else this.dashCooldown = 0;


    // 3. 输入检测
    let dx = 0, dy = 0;
    if (this.keyMap.up.isDown) dy = -1;
    else if (this.keyMap.down.isDown) dy = 1;
    if (this.keyMap.left.isDown) dx = -1;
    else if (this.keyMap.right.isDown) dx = 1;
    if (dx == 0 && dy == 0) this.speed = 0;
    else this.speed = this.isDashing ? SPEED_DASH : SPEED_WALK;
    // const direction: Direction = { x: dx, y: dy };

    // 旋转 (更新玩家朝向)
    if (dx || dy) {
      this.facing.set(dx, dy).normalize(); // 更新朝向向量并归一化
      this.rotation = this.facing.angle(); // 根据朝向向量设置玩家精灵的旋转角度
    }

    // 检测交互对象高亮
    if (this.speed > 0) {
      if (this.lastCanBeInteractObj instanceof Station) {
        (this.lastCanBeInteractObj.getChildren()[0] as Phaser.Physics.Arcade.Sprite)?.clearTint()
      } else if (this.lastCanBeInteractObj instanceof Item) {
        this.lastCanBeInteractObj.clearTint();
      }
      const target = this.getInteractTarget();
      if (target) {
        target.setTint(0x9955ff);
        this.lastCanBeInteractObj = target;
      }
    }

    // 设置移动速度
    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(this.facing.x * this.speed, this.facing.y * this.speed);
    }

    // 交互在 GameScene 的 update 循环中根据玩家输入处理
    // 处理交互拾取/放置逻辑
    if (Phaser.Input.Keyboard.JustDown(this.keyMap.pick)) {
      this.interact();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyMap.throw) && this.heldItem) { // 处理投掷输入
      this.throw(this.scene);
    }

    // 处理工作输入
    if (this.keyMap.work.isDown) {
      this.work();
    }

    // 冲刺
    if (Phaser.Input.Keyboard.JustDown(this.keyMap.dash)) {
      this.dash();
    }

    // 物品跟随玩家
    if (this.heldItem) {
      this.heldItem.x = this.x;
      this.heldItem.y = this.y;
      this.heldItem.setDepth(DEPTH.PLAYER + 1); // 确保物品在玩家上方渲染
    }
  }



  /**
   * 获取交互对象
   * @param player
   * @returns
   */
  getInteractTarget(): Station | Item | null {
    // 计算玩家前方一个TILE_SIZE的“观察点”
    const lookX = this.x + this.facing.x * 25;
    const lookY = this.y + this.facing.y * 25;
    const radius = 25;

    // const interactArea = this.scene.add.circle(lookX, lookY, radius, 0xffffff).setDepth(100)
    // const interactArea2 = this.scene.add.circle(this.x, this.y, 4, 0xffff00ff).setDepth(101)
    // this.scene.time.delayedCall(1000, () => {
    //   interactArea.destroy();
    //   interactArea2.destroy();
    // })

    // 获取所有工作站
    const stations = stationManager.getAllStations();
    for (const s of stations) {
      if (Phaser.Math.Distance.Between(s.x, s.y, lookX, lookY) <= radius) { // 如果观察点在工作站范围内
        return s;
      }
    }

    // 检测地面物品
    // 遍历所有item
    for (const item of itemManager.items) {
      // 物品未被持有、未在飞行，且在观察点在item范围内
      if (!item.heldBy /* && !item.isFlying */ && Phaser.Math.Distance.Between(item.x, item.y, lookX, lookY) <= radius) {
        return item;
      }
    }

    return null;

  }


  interact() {
    const target = this.getInteractTarget(); // 获取玩家当前交互目标
    console.log("交互：", target)
    if (target == null && !this.heldItem) {
      //没有可以交互对象且空手，直接返回
      return;
    }
    // 放下物品到地面
    if (target == null && this.heldItem) {
      this.putDownToFloor();
    }
    if (target instanceof Station) {
      target.interact(this);
    }
    if (target instanceof Item) {
      target.interact(this);
    }
  }


  /**
   * 投掷物品
   *
   * @param scene
   * @returns
   */
  throw(scene: Phaser.Scene) {
    if (!this.heldItem) return;
    const item = this.heldItem;
    this.heldItem = null; // 玩家手中物品清空
    item.heldBy = null; // 物品不再被持有
    item.isFlying = true; // 物品进入飞行状态
    item.thrower = this; // 设置投掷者
    if (item.body) {
      item.body.enable = true; // 启用物理碰撞
      const vec = this.facing.clone().scale(500); // 根据玩家朝向计算投掷速度
      (item.body as Phaser.Physics.Arcade.Body).setVelocity(vec.x, vec.y);
      (item.body as Phaser.Physics.Arcade.Body).setDrag(300); // 设置空气阻力
    }
    scene.time.delayedCall(1000, () => { // 1秒后重置飞行状态
      item.isFlying = false;
    });
  }

  work() {
    const target = this.getInteractTarget(); // 获取玩家当前交互目标
    if (target instanceof Station) {
      target.work(this); // 调用工作站的 work 方法，假设每帧16ms
    }
  }
}
