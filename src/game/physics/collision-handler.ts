import * as Phaser from "phaser";
import { Item } from "../item";
import { Container } from "../item/container/container";
import { Ingredient } from "../item/ingredient/ingredient";
import { ALL_ITEMS } from "../manager/item-manager";
import { ALL_PLAYERS } from "../manager/player-manager";
import { ALL_STATIONS } from "../manager/station-manager";
import { Player } from "../player";
import { Station } from "../stations/station";

export const handleCollision = (scene: Phaser.Scene) => {
  // 玩家与工作站的碰撞
  scene.physics.add.collider(ALL_PLAYERS, ALL_STATIONS);

  ALL_PLAYERS.forEach((player1) => {
    // 玩家与玩家的碰撞 (处理玩家之间的互动，例如冲刺碰撞)
    ALL_PLAYERS.forEach((player2) => {
      // 跳过同一个玩家
      if (player1 === player2) return;
      scene.physics.add.collider(player1, player2, (p1Obj, p2Obj) => {
        const p1 = p1Obj as Player;
        const p2 = p2Obj as Player;

        // 计算从P1到P2的方向向量
        const p1ToP2 = new Phaser.Math.Vector2(
          p2.x - p1.x,
          p2.y - p1.y,
        ).normalize();
        // 判断P1是否朝向P2移动
        const p1MovingTowardP2 =
          p1.body && p1.body.velocity
            ? p1.body.velocity.dot(p1ToP2) > 0
            : false;
        // 判断P2是否朝向P1移动
        const p2MovingTowardP1 =
          p2.body && p2.body.velocity
            ? p2.body.velocity.dot(p1ToP2.scale(-1)) > 0
            : false;

        if (p1.body && p2.body) {
          if (p1MovingTowardP2 && p2MovingTowardP1) {
            // 双方都朝向对方移动，减速
            (p1.body as Phaser.Physics.Arcade.Body).setVelocity(
              p1.body.velocity.x * 0.5,
              p1.body.velocity.y * 0.5,
            );
            (p2.body as Phaser.Physics.Arcade.Body).setVelocity(
              p2.body.velocity.x * 0.5,
              p2.body.velocity.y * 0.5,
            );
          } else if (p1.isDashing && p2.isDashing) {
            // 双方都在冲刺，互相推开但不停顿
            (p1.body as Phaser.Physics.Arcade.Body).setVelocity(
              p1.body.velocity.x * 0.3,
              p1.body.velocity.y * 0.3,
            );
            (p2.body as Phaser.Physics.Arcade.Body).setVelocity(
              p2.body.velocity.x * 0.3,
              p2.body.velocity.y * 0.3,
            );
          } else if (p1.isDashing) {
            // 只有P1冲刺，P1继续，P2被轻微推开
            const bump = p1ToP2.scale(100);
            (p2.body as Phaser.Physics.Arcade.Body).setVelocity(
              p2.body.velocity.x + bump.x,
              p2.body.velocity.y + bump.y,
            );
          } else if (p2.isDashing) {
            // 只有P2冲刺，P2继续，P1被轻微推开
            const bump = p1ToP2.scale(-100);
            (p1.body as Phaser.Physics.Arcade.Body).setVelocity(
              p1.body.velocity.x + bump.x,
              p1.body.velocity.y + bump.y,
            );
          }
        }
      });
    });
  });
};

export const handleThrow = (scene: Phaser.Scene) => {
  // 投掷物品与工作站的重叠检测 (处理投掷物品吸附到工作站)
  scene.physics.add.overlap(
    ALL_ITEMS,
    ALL_STATIONS,
    (itemObj, stationSprite) => {
      const item = itemObj as Item;
      const station = (stationSprite as Phaser.GameObjects.Sprite).getData(
        "station",
      ) as Station; // 获取Station实例

      // TODO:
      // 现状：飞行停止时才会到工作台
      // 对比：即使有速度也会被投掷到工作台
      if (item.isFlying && station) {
        // 如果工作站上没有物品，尝试放置
        if (!station.item) {
          station.placeItem(item);
          return;
        }
        //  如果投掷的是食材且工作台上有容器且可以添加这个食材, 那么添加食材到容器
        if (
          item instanceof Ingredient &&
          station.item instanceof Container &&
          !station.item.isFull() &&
          station.item.canAddIngredient(item)
        ) {
          station.item.addIngredient(item);
          return;
        }
        // 其他情况，则投掷物品弹开
        if (item.body) {
          (item.body as Phaser.Physics.Arcade.Body).setVelocity(
            item.body.velocity.x * -0.5,
            item.body.velocity.y * -0.5,
          ); // 反弹并减速
        }
      }
    },
  );
};
