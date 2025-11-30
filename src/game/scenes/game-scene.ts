import * as Phaser from 'phaser';
import { DEPTH, TILE_SIZE, WORLD_H, WORLD_W } from "../config";

// 导入新类
import { Item } from '../item/item';
import { Player } from '../player/player';

// 导入管理器
import { updatePlayers } from '../manager/player-manager';
import { createMap, updateStations } from '../manager/station-manager';
import { handleCollision, handleThrow } from '../physics/collision-handler';

export class GameScene extends Phaser.Scene {
  // 组
  public players: Player[] = []; // 玩家列表
  // public stations!: Phaser.Physics.Arcade.StaticGroup; // 静态工作站组
  public items!: Phaser.Physics.Arcade.Group; // 物品组

  public score: number = 0; // 游戏得分


  constructor() {
    super('GameScene');
  }

  create() {
    // 初始化物理世界边界
    this.physics.world.setBounds(0, 0, TILE_SIZE * WORLD_W, TILE_SIZE * WORLD_H);

    // 初始化物理组
    // runChildUpdate 对于 Station 子类调用其 update 方法很重要。
    // this.stations = this.physics.add.staticGroup({ classType: Phaser.Physics.Arcade.Sprite });
    this.items = this.physics.add.group({ classType: Item, runChildUpdate: true });

    // 初始化管理器

    // 创建游戏世界
    createMap(this); // 创建地图和工作站
    // 设置碰撞检测
    handleCollision(this);
    handleThrow(this);
    // 初始化UI
    this.score = 0;
    this.add.text(20, 20, '得分: 0', { fontSize: '32px', fontStyle: 'bold' }).setDepth(DEPTH.UI).setName('scoreText');
  }


  update(_time: number, delta: number) {
    // 更新玩家状态
    updatePlayers(delta);
    // 更新工作站状态
    updateStations(delta)
  }
}
