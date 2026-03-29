import type Phaser from "phaser";

const REQUIRED_TEXTURES = [
  "player",
  "station_counter",
  "station_crate",
  "station_cut",
  "station_pot",
  "station_sink",
  "station_trash",
  "station_nothing",
  "station_dirty_plate",
  "station_delivery",
  "floor",
  "wall",
  "conveyor",
  "item_plate",
  "item_pot",
  "item_fire_extinguisher",
] as const;

/**
 * 确保编辑器预览依赖的基础贴图存在，不依赖正式游戏资源加载顺序。
 */
export function ensureEditorPreviewTextures(scene: Phaser.Scene) {
  const missing = REQUIRED_TEXTURES.some((key) => !scene.textures.exists(key));
  if (!missing) {
    return;
  }

  const graphics = scene.add.graphics({ x: 0, y: 0 });
  graphics.setVisible(false);

  const drawBlock = (
    key: string,
    color: number,
    detail?: (g: Phaser.GameObjects.Graphics) => void,
  ) => {
    graphics.clear();
    graphics.fillStyle(0x333333);
    graphics.fillRect(0, 0, 48, 48);
    graphics.fillStyle(color);
    graphics.fillRect(2, 2, 44, 44);
    detail?.(graphics);
    graphics.generateTexture(key, 48, 48);
  };

  graphics.clear();
  graphics.fillStyle(0xffffff);
  graphics.beginPath();
  graphics.moveTo(30, 15);
  graphics.lineTo(3, 0);
  graphics.lineTo(3, 30);
  graphics.fill();
  graphics.generateTexture("player", 32, 32);

  drawBlock("station_counter", 0x666666);
  drawBlock("station_crate", 0x8b4513, (g) => {
    g.fillStyle(0x5c2e0b);
    g.fillRect(5, 10, 38, 5);
    g.fillRect(5, 33, 38, 5);
  });
  drawBlock("station_cut", 0x666666, (g) => {
    g.fillStyle(0xeeeeee);
    g.fillRoundedRect(4, 8, 40, 32, 4);
    g.fillStyle(0x999999);
    g.fillRoundedRect(8, 12, 4, 24, 2);
    g.fillRoundedRect(36, 12, 4, 24, 2);
  });
  drawBlock("station_pot", 0x2e8b57, (g) => {
    g.fillStyle(0x111111);
    g.fillCircle(24, 24, 9);
    drawDashedCircle(g, 24, 24, 11, 10, 3, 0.1, 0.43);
    drawDashedCircle(g, 24, 24, 13, 2, 3, 0.8, -0.3);
  });
  drawBlock("station_sink", 0x4682b4, (g) => {
    g.fillStyle(0x224488);
    g.fillRect(8, 8, 32, 32);
  });
  drawBlock("station_trash", 0x111111);
  drawBlock("station_delivery", 0x333333, (g) => {
    g.fillStyle(0xffd700);
    g.beginPath();
    g.moveTo(10, 10);
    g.lineTo(38, 10);
    g.lineTo(24, 38);
    g.fill();
  });

  graphics.clear();
  graphics.fillStyle(0x222222);
  graphics.fillRect(0, 0, 48, 48);
  graphics.generateTexture("station_nothing", 48, 48);

  graphics.clear();
  graphics.fillStyle(0x8f85a3);
  graphics.fillRect(2, 2, 44, 44);
  graphics.fillStyle(0x6f6a9f);
  graphics.fillCircle(24, 24, 20);
  graphics.fillStyle(0x8f85a3);
  graphics.fillCircle(24, 24, 14);
  graphics.generateTexture("station_dirty_plate", 48, 48);

  graphics.clear();
  graphics.fillStyle(0x222222);
  graphics.fillRect(0, 0, 48, 48);
  graphics.fillStyle(0x2a2a2a);
  graphics.fillRect(1, 1, 46, 46);
  graphics.generateTexture("floor", 48, 48);

  graphics.clear();
  graphics.fillStyle(0x121826);
  graphics.fillRect(0, 0, 48, 48);
  graphics.fillStyle(0x334155);
  graphics.fillRect(2, 2, 44, 44);
  graphics.fillStyle(0x475569);
  graphics.fillRect(6, 8, 36, 8);
  graphics.fillRect(6, 22, 36, 8);
  graphics.fillRect(6, 36, 36, 6);
  graphics.generateTexture("wall", 48, 48);

  graphics.clear();
  graphics.fillStyle(0x222222);
  graphics.fillRect(0, 0, 48, 48);
  graphics.fillStyle(0x2a2a2a);
  graphics.fillRect(1, 1, 46, 46);
  graphics.fillStyle(0xeab308);
  graphics.fillRoundedRect(8, 14, 32, 20, 8);
  graphics.fillStyle(0x111827);
  graphics.beginPath();
  graphics.moveTo(16, 16);
  graphics.lineTo(32, 24);
  graphics.lineTo(16, 32);
  graphics.fill();
  graphics.generateTexture("conveyor", 48, 48);

  graphics.clear();
  graphics.fillStyle(0xffffff);
  graphics.fillCircle(20, 20, 19);
  graphics.fillStyle(0xeeeeee);
  graphics.fillCircle(20, 20, 16);
  graphics.generateTexture("item_plate", 40, 40);

  graphics.clear();
  graphics.fillStyle(0x111111);
  graphics.fillCircle(20, 20, 16);
  graphics.fillStyle(0x222222);
  graphics.fillCircle(20, 20, 13);
  graphics.fillStyle(0x111111);
  graphics.fillRoundedRect(18, 33, 4, 7, 2);
  graphics.generateTexture("item_pot", 40, 40);

  graphics.clear();
  graphics.fillStyle(0xff0000);
  graphics.fillRect(10, 6, 12, 20);
  graphics.fillStyle(0x000000);
  graphics.fillRect(13, 4, 6, 6);
  graphics.fillStyle(0xffff00);
  graphics.fillRect(12, 12, 8, 4);
  graphics.generateTexture("item_fire_extinguisher", 32, 32);

  graphics.destroy();
}

/**
 * 在 Graphics 上绘制虚线圆弧，用于锅等预览纹理的装饰元素。
 */
function drawDashedCircle(
  graphics: Phaser.GameObjects.Graphics,
  centerX: number,
  centerY: number,
  radius: number,
  width = 10,
  dashCount = 5,
  dashLengthRatio = 0.5,
  offset = 0,
  color = 0x111111,
) {
  graphics.lineStyle(width, color, 1);
  const radPerSegment = (Math.PI * 2) / dashCount;

  for (let index = 0; index < dashCount; index += 1) {
    const start = index * radPerSegment + offset;
    const end = start + dashLengthRatio * radPerSegment;
    graphics.beginPath();
    graphics.arc(centerX, centerY, radius, start, end);
    graphics.strokePath();
  }
}
