import type { GameScene } from '../scenes/GameScene';
import { Item } from './Item';

export type PlateState = 'clean' | 'dirty' | 'with_tomato_cut' | 'with_soup'; // 盘子状态

export class Plate extends Item {
  public plateState: PlateState; // 盘子的当前状态

  constructor(scene: GameScene, x: number, y: number, texture: string, state: PlateState) {
    super(scene, x, y, texture);
    this.plateState = state;
  }
}
