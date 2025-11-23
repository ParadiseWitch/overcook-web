import * as Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { Player } from '../objects/Player';
import { Item } from '../objects/Item';
import { Station } from '../stations/Station';

export class InteractionHandler {
  private scene: GameScene; // 游戏场景实例

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  // 对应原始 GameScene.getInteractTarget 的逻辑
  getInteractTarget(player: Player): { station: Station | null, item: Item | null } {
    // 计算玩家前方一个TILE_SIZE的“观察点”
    const lookX = player.x + player.facing.x * 32;
    const lookY = player.y + player.facing.y * 32;

    let targetStation: Station | null = null;
    const stations = this.scene.stationMgr.stations; // 获取所有工作站
    for (const s of stations) {
      if (s.getBounds().contains(lookX, lookY)) { // 如果观察点在工作站范围内
        targetStation = s;
        break;
      }
    }

    let targetItem: Item | null = null;
    // 如果没有检测到工作站，且玩家空手，则检测地面物品
    if (!targetStation && !player.heldItem) {
      const items = this.scene.items.getChildren() as Item[];
      for (const i of items) {
        // 物品未被持有、未在飞行，且在玩家附近 (40像素距离内)
        if (!i.heldBy && !i.isFlying && Phaser.Math.Distance.Between(player.x, player.y, i.x, i.y) < 40) {
          targetItem = i;
          break;
        }
      }
    }
    return { station: targetStation, item: targetItem };
  }
  
  // 对应原始 GameScene.interactStation 的逻辑，已简化并委托给 Station 类
  handleInteraction(player: Player, target: { station: Station | null, item: Item | null }) {
      if (target.station) {
          const result = target.station.interact(player, player.heldItem);
          // 如果工作站返回了物品，玩家拾取该物品。
          // 如果返回 null，表示玩家手中物品已清空。
          if (result !== player.heldItem) {
            if (result) {
              player.pickup(result);
            } else {
              player.heldItem = null;
            }
          }
      } else if (target.item) {
          player.pickup(target.item); // 拾取地面物品
      }
  }
}
