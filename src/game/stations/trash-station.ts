import { Station } from './sstation';

export class TrashStation extends Station {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'station_trash'); // 垃圾桶工作站
  }


  updateWhenIdle(_delta: number): void {
    if (!this.item) return;
    this.workStatus = 'working';
  }

  updateWhenWorking(_delta: number): void {
    if (!this.item) return;
    this.scene.tweens.add({
      targets: this.item,
      rotation: "+=10",
      scale: "0",
      // alpha: 0,
      duration: 1000,
      onComplete: () => {
        this.item?.destroy();
        this.item = null;
        this.workStatus = 'done';
      }
    });
  }

  updateWhenDone() {
    this.workStatus = 'idle';
  }

}
