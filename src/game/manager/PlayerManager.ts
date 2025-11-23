import * as Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { Player } from '../objects/Player';
import { DASH_TIME, SPEED_DASH, SPEED_WALK, DEPTH } from '../config';

export class PlayerManager {
  private scene: GameScene; // 游戏场景实例

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  // 更新玩家状态和行为
  public updatePlayer(p: Player, delta: number) {
    // 1. 冲刺冷却时间处理
    if (p.dash.cooldown > 0) p.dash.cooldown -= delta;

    // 2. 冲刺状态处理
    if (p.dash.active) {
      p.dash.timer -= delta;
      if (p.dash.timer <= 0) {
        p.dash.active = false; // 冲刺结束
        p.dashEmitter.stop(); // 停止冲刺粒子效果
      }
      // 冲刺时保持当前速度向量
      if (p.body) {
        (p.body as Phaser.Physics.Arcade.Body).velocity.normalize().scale(SPEED_DASH);
      }
      // 物品跟随玩家
      if (p.heldItem) {
        p.heldItem.x = p.x;
        p.heldItem.y = p.y;
      }
      return; // 冲刺状态下不处理普通移动和交互
    }

    // 3. 输入检测
    let dx = 0, dy = 0;
    if (p.keys.up.isDown) dy = -1;
    else if (p.keys.down.isDown) dy = 1;
    if (p.keys.left.isDown) dx = -1;
    else if (p.keys.right.isDown) dx = 1;

    // 移动
    if (p.body) {
      (p.body as Phaser.Physics.Arcade.Body).setVelocity(dx * SPEED_WALK, dy * SPEED_WALK);
    }

    // 旋转 (更新玩家朝向)
    if (dx || dy) {
      p.facing.set(dx, dy).normalize(); // 更新朝向向量并归一化
      p.rotation = p.facing.angle(); // 根据朝向向量设置玩家精灵的旋转角度
    }

    // 触发冲刺 (原始逻辑)
    if (Phaser.Input.Keyboard.JustDown(p.keys.dash) && p.dash.cooldown <= 0 && (dx || dy)) {
      p.dash.active = true; // 激活冲刺状态
      p.dash.timer = DASH_TIME; // 设置冲刺持续时间
      p.dash.cooldown = 300; // 设置冲刺冷却时间
      p.dashEmitter.start(); // 启动粒子效果
      if (p.body) {
        (p.body as Phaser.Physics.Arcade.Body).setVelocity(dx * SPEED_DASH, dy * SPEED_DASH); // 设置冲刺速度
      }
    }

    // 交互在 GameScene 的 update 循环中根据玩家输入处理

    // 物品跟随玩家 (非冲刺状态下)
    if (p.heldItem) {
      p.heldItem.x = p.x;
      p.heldItem.y = p.y;
      p.heldItem.setDepth(DEPTH.PLAYER + 1); // 确保物品在玩家上方渲染
    }
  }
}
