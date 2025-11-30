import { Item } from '../Item';

export type PlateStatus = 'empty' | 'dirty' | 'combinable' | 'full';
export class Plate extends Item {
  public status: PlateStatus;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, status: PlateStatus = 'empty') {
    super(scene, x, y, texture);
    this.status = status;
    this.setCircle(20, -4, -4); // 盘子类物品使用更大的圆形碰撞体
  }

  update(delta: number): void {
    switch (this.status) {
      case 'empty':
        // 设置纹理
        break;
      case 'combinable':
      case 'dirty':
      default:
        break;
    }
  }
}
