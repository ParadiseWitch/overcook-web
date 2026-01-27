import { Station } from "./station";

export class CounterStation extends Station {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    key: string = "station_counter",
  ) {
    // 计数器工作站
    super(scene, x, y, key);
  }
}
