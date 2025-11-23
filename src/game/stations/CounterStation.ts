import type { GameScene } from '../scenes/GameScene';
import { Station } from './Station';

export class CounterStation extends Station {
  constructor(scene: GameScene, x: number, y: number, key: string) { // 计数器工作站
    super(scene, x, y, key, 'counter');
  }
}
