import { Container, ContainerStatus } from './container';

export class Plate extends Container {

  constructor(scene: Phaser.Scene, x: number, y: number, status: ContainerStatus = 'empty') {
    let texture = 'item_plate';
    if (status == 'dirty') {
      texture = 'item_plate_dirty'
    }
    super(scene, x, y, texture, status);
    // 盘子类物品使用更大的圆形碰撞体
    this.setCircle(20, -4, -4); 
  }

}
