import * as Phaser from "phaser";
import { Item } from "./index";
import { DEPTH } from "../config";

/**
 * 灭火器物品类
 * 玩家可以拿起灭火器，按住工作键向前方喷射灭火剂来扑灭火焰
 */
export class FireExtinguisher extends Item {
  private _progress: number = 0;
  private sprayEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private isSpraying: boolean = false;
  private sprayRange: number = 100;
  private sprayAngle: number = Math.PI / 6;
  private currentAngle: number = 0;
  private lastAngle: number = -999;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "item_fire_extinguisher");
  }

  /**
   * 获取进度值
   */
  getProgress(): number {
    return this._progress;
  }

  /**
   * 设置进度值
   */
  setProgress(value: number): void {
    this._progress = value;
  }

  /**
   * 开始喷射
   * @param direction 喷射方向向量
   */
  startSpray(direction: Phaser.Math.Vector2) {
    if (!this.heldBy) return;
    this.isSpraying = true;
    this.currentAngle = Phaser.Math.RadToDeg(direction.angle());
    this.updateEmitterPosition(direction);
  }

  private updateEmitterPosition(direction: Phaser.Math.Vector2) {
    if (!this.heldBy) return;

    const sprayX = this.heldBy.x + direction.x * 20;
    const sprayY = this.heldBy.y + direction.y * 20;
    const halfAngle = Phaser.Math.RadToDeg(this.sprayAngle / 2);
    const minAngle = this.currentAngle - halfAngle;
    const maxAngle = this.currentAngle + halfAngle;

    if (
      Math.abs(this.currentAngle - this.lastAngle) > 1 ||
      !this.sprayEmitter
    ) {
      this.lastAngle = this.currentAngle;
      this.sprayEmitter?.destroy();
      this.sprayEmitter = this.scene.add.particles(
        sprayX,
        sprayY,
        "particle_smoke",
        {
          speed: { min: 100, max: 350, start: 100, end: 350 },
          angle: { min: minAngle - 1 / 32, max: maxAngle + 1 / 32 },
          scale: { start: 0.1, end: 1 },
          alpha: { start: 1, end: 0 },
          lifespan: { min: 600, max: 1000 },
          frequency: 30,
          quantity: 3,
          tint: 0xcccccc,
          blendMode: "add",
        },
      );
      this.sprayEmitter.setDepth(DEPTH.FX);
      // this.setScale(0.3);
    } else {
      this.sprayEmitter?.setPosition(sprayX, sprayY);
    }
  }

  /**
   * 停止喷射
   */
  stopSpray() {
    this.isSpraying = false;
    this.sprayEmitter?.destroy();
    this.sprayEmitter = undefined;
    this.lastAngle = -999;
  }

  /**
   * 每帧更新
   * @param delta 距离上一帧的时间差
   */
  update(delta: number) {
    super.update(delta);

    if (this.isSpraying && this.heldBy) {
      const direction = this.heldBy.facing;
      this.currentAngle = Phaser.Math.RadToDeg(direction.angle());
      this.updateEmitterPosition(direction);
    }
  }

  /**
   * 获取喷射范围
   */
  getSprayRange(): number {
    return this.sprayRange;
  }

  /**
   * 获取喷射角度
   */
  getSprayAngle(): number {
    return this.sprayAngle;
  }

  /**
   * 检查是否正在喷射
   */
  isCurrentlySpraying(): boolean {
    return this.isSpraying;
  }

  /**
   * 销毁灭火器
   */
  destroy() {
    // 先销毁粒子发射器
    this.sprayEmitter?.destroy();
    super.destroy();
  }
}
