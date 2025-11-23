import * as Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { Player } from '../objects/Player';
import { Item } from '../objects/Item';
import { Station } from '../stations/Station';

export class CollisionHandler {
  private scene: GameScene; // 游戏场景实例

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  // 来自原始 GameScene.createCollisions 的逻辑，用于创建所有碰撞检测器
  createCollisions() {
    this.scene.players.forEach(player1 => {
      // 玩家与工作站的碰撞 (玩家不能穿过工作站)
      this.scene.physics.add.collider(player1, this.scene.stations);
      
      // 玩家与玩家的碰撞 (处理玩家之间的互动，例如冲刺碰撞)
      this.scene.players.forEach(player2 => {
        if (player1 !== player2) { // 确保不是同一个玩家
          this.scene.physics.add.collider(player1, player2, (p1Obj, p2Obj) => {
            const p1 = p1Obj as Player;
            const p2 = p2Obj as Player;

            // 计算从P1到P2的方向向量
            const p1ToP2 = new Phaser.Math.Vector2(p2.x - p1.x, p2.y - p1.y).normalize();
            // 判断P1是否朝向P2移动
            const p1MovingTowardP2 = p1.body && p1.body.velocity ? p1.body.velocity.dot(p1ToP2) > 0 : false;
            // 判断P2是否朝向P1移动
            const p2MovingTowardP1 = p2.body && p2.body.velocity ? p2.body.velocity.dot(p1ToP2.scale(-1)) > 0 : false;

            if (p1.body && p2.body) {
              if (p1MovingTowardP2 && p2MovingTowardP1) {
                // 双方都朝向对方移动，减速
                (p1.body as Phaser.Physics.Arcade.Body).setVelocity(p1.body.velocity.x * 0.5, p1.body.velocity.y * 0.5);
                (p2.body as Phaser.Physics.Arcade.Body).setVelocity(p2.body.velocity.x * 0.5, p2.body.velocity.y * 0.5);
              } else if (p1.dash.active && p2.dash.active) {
                // 双方都在冲刺，互相推开但不停顿
                (p1.body as Phaser.Physics.Arcade.Body).setVelocity(p1.body.velocity.x * 0.3, p1.body.velocity.y * 0.3);
                (p2.body as Phaser.Physics.Arcade.Body).setVelocity(p2.body.velocity.x * 0.3, p2.body.velocity.y * 0.3);
              } else if (p1.dash.active) {
                // 只有P1冲刺，P1继续，P2被轻微推开
                const bump = p1ToP2.scale(100);
                (p2.body as Phaser.Physics.Arcade.Body).setVelocity(p2.body.velocity.x + bump.x, p2.body.velocity.y + bump.y);
              } else if (p2.dash.active) {
                // 只有P2冲刺，P2继续，P1被轻微推开
                const bump = p1ToP2.scale(-100);
                (p1.body as Phaser.Physics.Arcade.Body).setVelocity(p1.body.velocity.x + bump.x, p1.body.velocity.y + bump.y);
              }
            }
          });
        }
      });
    });

    // 投掷物品与工作站的重叠检测 (处理投掷物品吸附到工作站)
    this.scene.physics.add.overlap(this.scene.items, this.scene.stations, (itemObj, stationSprite) => {
      const item = itemObj as Item;
      const station = (stationSprite as Phaser.GameObjects.Sprite).getData('station') as Station; // 获取Station实例

      if (item.isFlying && station) {
        // 投掷汤到出餐口进行交付的逻辑
        if (station.type === 'delivery' && item.texture.key === 'item_soup') {
            this.scene.deliveryManager.deliverItemToStation(item, station);
            return;
        }

        // 如果工作站上没有物品，尝试放置
        if (!station.item) {
            // 来自原始重叠处理器的逻辑
            if (['counter', 'cut', 'sink', 'trash'].includes(station.type)) {
                station.placeItem(item);
            } else if (station.type === 'pot' && item.texture.key === 'item_tomato_cut') {
                station.placeItem(item);
            }
        } else { // 如果工作站有物品，则投掷物品弹开
            if (item.body) {
                (item.body as Phaser.Physics.Arcade.Body).setVelocity(item.body.velocity.x * -0.3, item.body.velocity.y * -0.3); // 反弹并减速
                const dx = item.x - station.x;
                const dy = item.y - station.y;
                (item.body as Phaser.Physics.Arcade.Body).setVelocity(item.body.velocity.x + dx * 0.2, item.body.velocity.y + dy * 0.2); // 稍微推离工作站
            }
        }
      }
    });
    
    // 为所有物品设置世界边界碰撞
    this.scene.items.children.iterate((iObj) => {
        const item = iObj as Item;
        item.setCollideWorldBounds(true); // 物品不能超出世界边界
        return true;
    });
  }
}
