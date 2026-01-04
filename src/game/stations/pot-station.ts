import config, { DEPTH } from '../config';
import { Pot } from '../item/container/pot';
import { Station } from './station';

/**
 * 锅工作站类，处理煮汤逻辑
 */
export class PotStation extends Station {
  private safeTime: number = 3000;
  private dangerTime: number = 5000;
  private timeAfterDone: number = 0;
  private lastDnagerBlinkTime: number = 0;
  private dangerBlinkInterval: number = 0;
  private isDangerVisible: boolean = false;
  private dangerUI: Phaser.GameObjects.Graphics;
  private fireEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'station_pot', true);
    this.workSpeed = 0.1;
    this.drawDanger();
    this.dangerUI.setVisible(false);
    this.fireEmitter = this.scene.add.particles(0, 0,
      'flame', {
      x: this.x,
      y: this.y,
      speed: { min: 30, max: 80 },
      angle: { min: 230, max: 310 },
      gravityY: -100,
      scale: { start: 1.2, end: 0.1 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 500, max: 800 },
      frequency: 20,
      quantity: 2,
      tint: [0xff0000, 0xff6600, 0xffaa00, 0xffff00],
      rotate: { min: 0, max: 180 },
      blendMode: 'ADD'
    });
    this.fireEmitter.setDepth(config.DEPTH.FX)
    this.fireEmitter.stop();
  }

  drawDanger() {
    const graphics = this.scene.add.graphics();
    // === 三角形 ===
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

    // === 感叹号 ===
    graphics.fillStyle(0xffffff, 1);

    // 竖线
    graphics.fillRoundedRect(
      centerX - 3,   // 居中
      centerY - 16,  // 起点稍微靠上
      6,       // 更粗一点
      18,      // 更长
      3
    );

    // 点
    graphics.fillCircle(
      centerX,
      centerY + 8,
      3
    );

    graphics.setDepth(DEPTH.UI);
    graphics.setVisible(true);
    this.dangerUI = graphics;
  }

  updateWhenIdle(_delta: number): void {
    if (!this.item) return;
    if (!(this.item instanceof Pot)) return;
    this.item.canTransfer = true;
    // 如果食材不为空 且 食材状态为 cut
    if (!this.item.isEmpty()
      && (this.item.ingredients[0].lastCookState() == 'cut' || this.item.ingredients[0].lastCookState() == 'boil')) {
      this.workStatus = 'working';
      this.item.canTransfer = false;
      return;
    }
    // todo 灶上突然加入煮一半的锅 也是working
  }

  updateWhenWorking(_delta: number): void {
    if (!this.item) {
      this.workStatus = 'idle';
      return;
    }
    if (!(this.item instanceof Pot)) {
      this.workStatus = 'idle';
      return;
    };
    if (this.item.isEmpty()) {
      this.workStatus = 'idle';
      return;
    }
    this.item.x = this.x + Math.sin(this.scene.game.getTime() * 0.01) * 1.5;
  }

  updateWhenDone(delta: number) {
    if (!this.item) {
      this.workStatus = 'idle';
      return;
    };
    if (!(this.item instanceof Pot)) {
      this.workStatus = 'idle';
      return;
    };
    const pot = this.item;
    pot.canTransfer = true;
    if (pot.isEmpty()) {
      this.workStatus = 'idle';
      return;
    }
    // 超过时间变成danger
    if (this.timeAfterDone > this.safeTime) {
      this.workStatus = 'danger';
      return;
    }
    this.timeAfterDone += delta;
    // this.item.setTexture('item_soup_pot');
    const ingredient = pot.ingredients[0];
    if (ingredient.lastCookState() != 'boil') {
      ingredient.addCookstate('boil');
    }
    this.timeAfterDone += delta;
  }

  updateWhenDanger(delta: number): void {
    if (!this.item) {
      this.workStatus = 'idle';
      return;
    };
    if (!(this.item instanceof Pot)) {
      this.workStatus = 'idle';
      return;
    };
    const pot = this.item;
    pot.canTransfer = true;
    if (pot.isEmpty()) {
      this.workStatus = 'idle';
      return;
    }
    if (this.timeAfterDone > this.safeTime + this.dangerTime) {
      this.workStatus = 'fire';
      pot.ingredients[0].addCookstate('overcook');
      return;
    }

    const currentTime = this.scene.game.getTime();
    const totolTime = this.safeTime + this.dangerTime;
    this.dangerBlinkInterval = 500 - (this.timeAfterDone / totolTime) * 500;
    if (currentTime - this.lastDnagerBlinkTime > this.dangerBlinkInterval) {
      this.isDangerVisible = !this.isDangerVisible;
      this.dangerUI?.setVisible(this.isDangerVisible);
      this.lastDnagerBlinkTime = currentTime;
    }
    this.timeAfterDone += delta;
  }

  updateWhenFire(_delta: number): void {
    this.dangerUI?.setVisible(false);
    this.fireEmitter?.start();
  }


}

