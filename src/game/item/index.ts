import * as Phaser from "phaser";
import { DEPTH } from "../config";
import { Player } from "../player";
import { Station } from "../stations/station";

export abstract class Item extends Phaser.Physics.Arcade.Sprite {
  public isFlying: boolean = false;
  public heldBy: Player | null = null;
  public thrower: Player | null = null;
  public station?: Station | null = null;
  public homeStation?: Station | null = null;
  public flyEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  abstract getProgress(): number;
  abstract setProgress(value: number): void;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.PLAYER);
    this.setCircle(12, 2, 2);
    this.setCollideWorldBounds(true);
    this.flyEmitter = scene.add.particles(3, 3, "particle_smoke");
    this.flyEmitter.setConfig({
      speed: { min: 50, max: 100 },
      scale: { start: 0.5, end: 0 },
      blendMode: "ADD",
      lifespan: 300,
      frequency: 20,
      emitCallback: (particle: Phaser.GameObjects.Particles.Particle) => {
        if (this.body?.velocity) {
          const angle = Math.atan2(
            -this.body.velocity.y,
            -this.body.velocity.x,
          );
          particle.velocityX = Math.cos(angle) * Phaser.Math.Between(50, 100);
          particle.velocityY = Math.sin(angle) * Phaser.Math.Between(50, 100);
        }
      },
    });
    this.flyEmitter.startFollow(this);
    this.flyEmitter.stop();
  }

  update(_delta: number): void {
    if (this.isFlying) {
      if (
        !this.body?.velocity ||
        (this.body?.velocity.x == 0 && this.body?.velocity.y == 0)
      ) {
        this.isFlying = false;
        this.thrower = null;
        this.flyEmitter.stop();
        return;
      }
    }
  }

  destroy(fromScene?: boolean): void {
    super.destroy(fromScene);
    this.flyEmitter.destroy(fromScene);
  }
}
