import { AUTO, Game, Scale, Types } from 'phaser';
import { TILE_SIZE, WORLD_H, WORLD_W } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';



// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Types.Core.GameConfig = {
  type: AUTO,
  width: TILE_SIZE * WORLD_W,
  height: TILE_SIZE * WORLD_H,
  parent: 'game-container',
  backgroundColor: '#028af8',
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH
  },
  // scene: [
  //   MainGame
  // ]
  scene: [BootScene, GameScene],
  input: {
    keyboard: true,
    mouse: true
  }
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
}

export default StartGame;
