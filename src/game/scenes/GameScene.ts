import * as Phaser from 'phaser';
import { TILE_SIZE, WORLD_H, WORLD_W, DEPTH } from "../config";

// 导入新类
import { Player } from '../objects/Player';
import { Item } from '../objects/Item';
import { Station } from '../stations/Station';

// 导入管理器
import { PlayerManager } from "../manager/PlayerManager";
import { StationManager } from "../manager/StationManager";
import { ItemManager } from "../manager/ItemManager";
import { InteractionHandler } from "../handler/InteractionHandler";
import { DeliveryManager } from "../manager/DeliveryManager";
import { CollisionHandler } from "../physics/CollisionHandler";

export class GameScene extends Phaser.Scene {
  // 组
  public players: Player[] = []; // 玩家列表
  public stations!: Phaser.Physics.Arcade.StaticGroup; // 静态工作站组
  public items!: Phaser.Physics.Arcade.Group; // 物品组

  public score: number = 0; // 游戏得分

  // 管理器实例
  public playerMgr!: PlayerManager;
  public stationMgr!: StationManager;
  public itemMgr!: ItemManager;
  public deliveryManager!: DeliveryManager;
  public interactionHandler!: InteractionHandler;
  public collisionHandler!: CollisionHandler;

  constructor() {
    super('GameScene');
  }

  create() {
    // 初始化物理世界边界
    this.physics.world.setBounds(0, 0, TILE_SIZE * WORLD_W, TILE_SIZE * WORLD_H);

    // 初始化物理组
    // runChildUpdate 对于 Station 子类调用其 update 方法很重要。
    this.stations = this.physics.add.staticGroup({ classType: Phaser.Physics.Arcade.Sprite });
    this.items = this.physics.add.group({ classType: Item, runChildUpdate: true });

    // 初始化管理器
    this.stationMgr = new StationManager(this);
    this.playerMgr = new PlayerManager(this);
    this.itemMgr = new ItemManager(this);
    this.deliveryManager = new DeliveryManager(this);
    this.interactionHandler = new InteractionHandler(this);
    this.collisionHandler = new CollisionHandler(this);

    // 创建游戏世界
    this.stationMgr.createMap(); // 创建地图和工作站
    this.createPlayers(); // 创建玩家
    this.collisionHandler.createCollisions(); // 设置碰撞检测

    // 初始化UI
    this.score = 0;
    this.add.text(20, 20, '得分: 0', { fontSize: '32px', fontStyle: 'bold' }).setDepth(DEPTH.UI).setName('scoreText');
  }

  createPlayers() {
    // P1 玩家
    const p1Spawn = this.stationMgr.playerSpawnPoints['P1'] || { x: 200, y: 300 };
    this.players.push(new Player(this, 0, p1Spawn.x, p1Spawn.y, 0x4da6ff, {
      up: 'W', down: 'S', left: 'A', right: 'D', pick: 'E', work: 'R', throw: 'SPACE', dash: 'SHIFT'
    }));
    // P2 玩家
    const p2Spawn = this.stationMgr.playerSpawnPoints['P2'] || { x: 300, y: 300 };
    this.players.push(new Player(this, 1, p2Spawn.x, p2Spawn.y, 0xff4444, {
      up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', pick: 'O', work: 'P', throw: 'L', dash: 'ENTER'
    }));
  }

  update(_time: number, delta: number) {
    // 更新玩家状态
    this.players.forEach(p => {
      this.playerMgr.updatePlayer(p, delta);

      const target = this.interactionHandler.getInteractTarget(p); // 获取玩家当前交互目标

      if (Phaser.Input.Keyboard.JustDown(p.keys.pick)) { // 处理拾取/放置输入
        if (p.heldItem) { // 玩家手中有物品
          if (target.station) { // 目标是工作站
            this.interactionHandler.handleInteraction(p, target);
          } else {
            // 放置在地面上的逻辑 (来自原始 GameScene)
            const item = p.heldItem;
            item.x = p.x + p.facing.x * 32; // 放置在玩家前方
            item.y = p.y + p.facing.y * 32;
            p.heldItem = null; // 玩家手中物品清空
            item.heldBy = null; // 物品不再被持有
            if (item.body) {
              item.body.enable = true; // 启用物理碰撞
              (item.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0); // 停止移动
            }
          }
        } else { // 玩家空手
          this.interactionHandler.handleInteraction(p, target); // 处理拾取交互
        }
      }

      if (Phaser.Input.Keyboard.JustDown(p.keys.throw) && p.heldItem) { // 处理投掷输入
        // 投掷物品逻辑 (来自原始 GameScene)
        const item = p.heldItem;
        p.heldItem = null; // 玩家手中物品清空
        item.heldBy = null; // 物品不再被持有
        item.isFlying = true; // 物品进入飞行状态
        item.thrower = p; // 设置投掷者
        if (item.body) {
          item.body.enable = true; // 启用物理碰撞
          const vec = p.facing.clone().scale(500); // 根据玩家朝向计算投掷速度
          (item.body as Phaser.Physics.Arcade.Body).setVelocity(vec.x, vec.y);
          (item.body as Phaser.Physics.Arcade.Body).setDrag(300); // 设置空气阻力
        }
        this.time.delayedCall(1000, () => { // 1秒后重置飞行状态
          item.isFlying = false;
        });
      }

      if (p.keys.work.isDown && target.station) { // 处理工作输入
        target.station.work(p, delta); // 调用工作站的 work 方法
      }
    });

    // 更新工作站状态
    this.stationMgr.update(delta);
  }
}
