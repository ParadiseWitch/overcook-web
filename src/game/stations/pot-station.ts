import { DEPTH } from '../config';
import { Pot } from '../item/container/pot';
import { Station } from './station';
import { startFire } from '../helper/fire-helper';

/**
 * 灶台工作站
 * 
 * 状态机流程：idle -> working -> done -> danger -> fire
 * - 放入装有切好食材的锅后自动开始烹饪
 * - 烹饪完成后有安全时间，超时进入危险状态
 * - 危险状态不及时取走会着火
 */
export class PotStation extends Station {
  // 完成后的安全时间（毫秒）
  private safeTime: number = 3000;
  // 危险状态持续时间（毫秒），超时后着火
  private dangerTime: number = 5000;
  private timeAfterDone: number = 0;
  private lastDnagerBlinkTime: number = 0;
  private dangerBlinkInterval: number = 0;
  private isDangerVisible: boolean = false;
  private dangerUI: Phaser.GameObjects.Graphics;
  private firedTriggered: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'station_pot', false);
    this.workSpeed = 0.1;
    this.drawDanger();
    this.dangerUI.setVisible(false);
  }

  // 绘制危险警告UI（红色三角形+感叹号）
  drawDanger() {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xff0000, 1);
    graphics.lineStyle(3, 0x000000, 1);

    const centerX = this.x;
    const centerY = this.y + 6;

    graphics.fillTriangle(
      centerX, centerY - 30,
      centerX - 22, centerY + 12,
      centerX + 22, centerY + 12
    );
    graphics.strokeTriangle(
      centerX, centerY - 30,
      centerX - 22, centerY + 12,
      centerX + 22, centerY + 12
    );

    graphics.fillStyle(0xffffff, 1);
    graphics.fillRoundedRect(centerX - 3, centerY - 16, 6, 18, 3);
    graphics.fillCircle(centerX, centerY + 8, 3);

    graphics.setDepth(DEPTH.UI);
    graphics.setVisible(true);
    this.dangerUI = graphics;
  }

  updateWhenIdle(_delta: number): void {
    this.dangerUI?.setVisible(false);
    if (!this.item) return;
    if (!(this.item instanceof Pot)) return;
    this.item.canTransfer = true;
    this.firedTriggered = false;
    this.timeAfterDone = 0;

    if (!this.item.isEmpty()) {
      const firstIngredient = this.item.food.ingredients[0];
      const lastState = firstIngredient?.lastCookState();

      // 已烹饪完成的食材放回灶台，继续危险/着火流程
      if (lastState === 'stir-fry') {
        this.workStatus = 'done';
        return;
      }

      // 切好或煮过的食材，开始烹饪
      if (lastState === 'cut' || lastState === 'boil') {
        this.workStatus = 'working';
        this.item.canTransfer = false;
        return;
      }
    }
  }

  updateWhenWorking(_delta: number): void {
    if (!this.item) {
      this.workStatus = 'idle';
      return;
    }
    if (!(this.item instanceof Pot)) {
      this.workStatus = 'idle';
      return;
    }
    if (this.item.isEmpty()) {
      this.workStatus = 'idle';
      return;
    }
    // 烹饪时锅轻微晃动的视觉效果
    this.item.x = this.x + Math.sin(this.scene.game.getTime() * 0.01) * 1.5;
  }

  updateWhenDone(delta: number) {
    if (!this.item) {
      this.workStatus = 'idle';
      return;
    }
    if (!(this.item instanceof Pot)) {
      this.workStatus = 'idle';
      return;
    }
    const pot = this.item;
    pot.canTransfer = true;
    if (pot.isEmpty()) {
      this.workStatus = 'idle';
      return;
    }

    // 超过安全时间进入危险状态
    if (this.timeAfterDone > this.safeTime) {
      this.workStatus = 'danger';
      return;
    }
    this.timeAfterDone += delta;

    // 烹饪完成时给食材添加"炒"状态
    const ingredient = pot.food.ingredients[0];
    if (ingredient && ingredient.lastCookState() !== 'stir-fry') {
      ingredient.addCookstate('stir-fry');
    }
  }

  updateWhenDanger(delta: number): void {
    if (!this.item) {
      this.workStatus = 'idle';
      return;
    }
    if (!(this.item instanceof Pot)) {
      this.workStatus = 'idle';
      return;
    }
    const pot = this.item;
    pot.canTransfer = true;
    if (pot.isEmpty()) {
      this.workStatus = 'idle';
      return;
    }

    // 超过危险时间则着火
    if (this.timeAfterDone > this.safeTime + this.dangerTime) {
      this.workStatus = 'fire';
      const ingredient = pot.food.ingredients[0];
      if (ingredient) {
        ingredient.addCookstate('overcook');
      }
      if (!this.firedTriggered) {
        startFire(this);
        this.firedTriggered = true;
      }
      return;
    }

    // 危险警告UI闪烁，频率随时间加快
    const currentTime = this.scene.game.getTime();
    const totalTime = this.safeTime + this.dangerTime;
    this.dangerBlinkInterval = 500 - (this.timeAfterDone / totalTime) * 500;
    if (currentTime - this.lastDnagerBlinkTime > this.dangerBlinkInterval) {
      this.isDangerVisible = !this.isDangerVisible;
      this.dangerUI?.setVisible(this.isDangerVisible);
      this.lastDnagerBlinkTime = currentTime;
    }
    this.timeAfterDone += delta;
  }

  updateWhenFire(_delta: number): void {
    this.dangerUI?.setVisible(false);
    const pot = this.item;
    if (pot instanceof Pot) {
      pot.canTransfer = false;
    }
  }
}
