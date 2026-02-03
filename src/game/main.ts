import { AUTO, Game, Scale, Types } from "phaser";
import { TILE_SIZE, WORLD_W, WORLD_H } from "./config";
import { BootScene } from "./scenes/boot-scene";
import { GameScene } from "./scenes/game-scene";

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const baseConfig: Types.Core.GameConfig = {
  type: AUTO,
  width: TILE_SIZE * WORLD_W, // 17 * 48 = 816
  height: TILE_SIZE * WORLD_H, // 13 * 48 = 624
  parent: "game-container",
  backgroundColor: "#028af8",
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
  },
  // scene: [
  //   MainGame
  // ]
  scene: [BootScene, GameScene],
  input: {
    keyboard: true,
    mouse: true,
    gamepad: true,
  },
};

const StartGame = (parent: string) => {
  // 获取父容器的尺寸
  const parentElement = document.getElementById(parent);
  let width = baseConfig.width;
  let height = baseConfig.height;
  
  if (parentElement) {
    // 如果父容器存在，尝试使用父容器的尺寸，但保持原始比例
    const containerWidth = parentElement.clientWidth || window.innerWidth;
    const containerHeight = parentElement.clientHeight || window.innerHeight;
    
    // 计算缩放比例以适应容器
    const scaleX = containerWidth / (TILE_SIZE * WORLD_W);
    const scaleY = containerHeight / (TILE_SIZE * WORLD_H);
    const scale = Math.min(scaleX, scaleY, 1); // 不超过1倍
    
    width = (TILE_SIZE * WORLD_W) * scale;
    height = (TILE_SIZE * WORLD_H) * scale;
  }
  
  const config: Types.Core.GameConfig = {
    ...baseConfig,
    width,
    height,
    parent,
    scale: {
      mode: Scale.FIT,
      autoCenter: Scale.CENTER_BOTH,
      width,
      height,
    }
  };
  
  return new Game(config);
};

export default StartGame;