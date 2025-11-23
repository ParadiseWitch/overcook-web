import * as Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { Player } from '../objects/Player';
import { Item } from '../objects/Item';
import { Station } from '../stations/Station';
import { TILE_SIZE, DEPTH } from '../config';
import { DirtyPlateStation } from '../stations/DirtyPlateStation';

/**
 * @class DeliveryManager
 * @description 负责处理游戏中的订单交付逻辑，包括玩家手动交付、投掷交付以及脏盘子的生成。
 */
export class DeliveryManager {
  private scene: GameScene; // 游戏场景实例

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  /**
   * @method deliver
   * @description 处理玩家手动将汤交付到出餐口。
   * @param p 执行交付的玩家精灵
   */
  deliver(player: Player) {
    const heldItem = player.heldItem;
    if (!heldItem || heldItem.texture.key !== 'item_soup') return; // 只有汤可以交付

    player.heldItem = null; // 玩家手中物品清空
    heldItem.destroy(); // 销毁汤物品

    this.scene.score += 100; // 增加得分
    const scoreText = this.scene.children.getByName('scoreText') as Phaser.GameObjects.Text;
    if (scoreText) {
      scoreText.setText('得分: ' + this.scene.score); // 更新得分显示
    }

    // 显示得分提示文本
    const deliveryText = this.scene.add.text(player.x, player.y - 30, '+100', { fontSize: '20px', color: '#ffff00' })
      .setOrigin(0.5).setDepth(DEPTH.UI);
    this.scene.tweens.add({
      targets: deliveryText,
      y: player.y - 60,
      alpha: 0,
      duration: 1000,
      onComplete: () => deliveryText.destroy() // 动画结束后销毁文本
    });

    // 延迟3秒后在出餐口生成脏盘子
    this.scene.time.delayedCall(3000, () => {
      const dirtyPlateStations: DirtyPlateStation[] = this.scene.stationMgr.getStationsByType('dirty-plate') as DirtyPlateStation[];
      if (dirtyPlateStations.length > 0) {
        const dirtyPlateStation = dirtyPlateStations[0];
        if (dirtyPlateStation && !dirtyPlateStation.item) { // 如果出餐口没有物品
          dirtyPlateStation.spawnDirtyPlate()
        } else {
          this.spawnDirtyPlateNearDelivery(dirtyPlateStation); // 如果出餐口被占用，则在附近生成
        }
      }
    });
  }

  // 来自原始 GameScene.spawnDirtyPlateNearDelivery 的逻辑
  spawnDirtyPlateNearDelivery(deliveryStation: Station) {
    const directions = [
      { x: 0, y: -TILE_SIZE },  // 上
      { x: 0, y: TILE_SIZE },   // 下
      { x: -TILE_SIZE, y: 0 },  // 左
      { x: TILE_SIZE, y: 0 }    // 右
    ];

    for (const dir of directions) {
      const testX = deliveryStation.x + dir.x;
      const testY = deliveryStation.y + dir.y;

      const potentialCounter = this.scene.stationMgr.getStationAt(testX, testY);
      if (potentialCounter && potentialCounter.type === 'counter' && !potentialCounter.item) { // 找到空闲柜台
        this.scene.itemMgr.spawnItemWorld('item_plate_dirty', testX, testY); // 在柜台生成脏盘子
        return; // 成功放置，退出
      }
    }

    // 原始逻辑的回退：如果附近没有空闲柜台，则直接在出餐口生成脏盘子
    const deliveryStations = this.scene.stationMgr.getStationsByType('delivery');
    if (deliveryStations.length > 0) {
      const fallbackStation = deliveryStations[0];
      if (fallbackStation && !fallbackStation.item) {
        this.scene.itemMgr.spawnItemWorld('item_plate_dirty', fallbackStation.x, fallbackStation.y);
      }
    }
  }

  // 来自原始 GameScene.deliverItemToStation 的逻辑
  deliverItemToStation(item: Item, station: Station) {
    if (item.texture.key === 'item_soup') { // 只有汤可以交付
      this.scene.score += 100; // 增加得分
      const scoreText = this.scene.children.getByName('scoreText') as Phaser.GameObjects.Text;
      if (scoreText) {
        scoreText.setText('得分: ' + this.scene.score); // 更新得分显示
      }

      // 显示得分提示文本
      const deliveryText = this.scene.add.text(station.x, station.y - 30, '+100', { fontSize: '20px', color: '#ffff00' })
        .setOrigin(0.5).setDepth(DEPTH.UI);
      this.scene.tweens.add({
        targets: deliveryText,
        y: station.y - 60,
        alpha: 0,
        duration: 1000,
        onComplete: () => deliveryText.destroy() // 动画结束后销毁文本
      });

      item.destroy(); // 销毁汤物品

      // 延迟3秒后在出餐口或附近生成脏盘子
      this.scene.time.delayedCall(3000, () => {
        if (station && !station.item) {
          this.scene.itemMgr.spawnItemWorld('item_plate_dirty', station.x, station.y);
        } else {
          this.spawnDirtyPlateNearDelivery(station);
        }
      });
    }
  }
}
