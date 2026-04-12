import type Phaser from "phaser";

export const TEXTURE_KEYS = [
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
  "item_tomato",
  "item_tomato_cut",
  "item_pot",
  "item_plate",
  "item_plate_dirty",
  "item_soup",
  "item_plate_tomato_cut",
  "item_soup_pot",
  "overcooke",
  "item_lettuce",
  "item_lettuce_cut",
  "item_egg",
  "item_flour",
  "item_rice",
  "item_rice_cooked",
  "item_fish",
  "item_fish_cut",
  "item_seaweed",
  "item_onion",
  "item_onion_cut",
  "item_potato",
  "item_potato_cut",
  "item_carrot",
  "item_carrot_cut",
  "particle_smoke",
  "flame",
  "item_fire_extinguisher",
] as const;

export function preloadTextures(scene: Phaser.Scene) {
  const hasAllTextures = TEXTURE_KEYS.every((key) => scene.textures.exists(key));
  if (hasAllTextures) {
    return;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 });

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

  const drawItem = (
    key: string,
    drawFn: (g: Phaser.GameObjects.Graphics) => void,
  ) => {
    graphics.clear();
    drawFn(graphics);
    graphics.generateTexture(key, 32, 32);
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

  drawItem("item_tomato", (g) => {
    g.fillStyle(0xff4500);
    g.fillCircle(16, 16, 11);
    g.fillStyle(0x00aa00);
    g.fillRect(14, 5, 4, 5);
  });

  drawItem("item_tomato_cut", (g) => {
    g.fillStyle(0xb22222);
    g.fillRect(8, 8, 8, 8);
    g.fillRect(18, 10, 6, 6);
    g.fillRect(10, 20, 6, 6);
    g.fillRect(20, 20, 7, 7);
  });

  graphics.clear();
  graphics.fillStyle(0x111111);
  graphics.fillCircle(20, 20, 16);
  graphics.fillStyle(0x222222);
  graphics.fillCircle(20, 20, 13);
  graphics.fillStyle(0x111111);
  graphics.fillRoundedRect(18, 33, 4, 7, 2);
  graphics.generateTexture("item_pot", 40, 40);

  graphics.clear();
  graphics.fillStyle(0xffffff);
  graphics.fillCircle(20, 20, 19);
  graphics.fillStyle(0xeeeeee);
  graphics.fillCircle(20, 20, 16);
  graphics.generateTexture("item_plate", 40, 40);

  graphics.clear();
  graphics.fillStyle(0xffffff);
  graphics.fillCircle(20, 20, 19);
  graphics.fillStyle(0xeeeeee);
  graphics.fillCircle(20, 20, 16);
  graphics.fillStyle(0x554433);
  graphics.fillCircle(16, 16, 5);
  graphics.fillCircle(24, 24, 4);
  graphics.generateTexture("item_plate_dirty", 40, 40);

  graphics.clear();
  graphics.fillStyle(0xffffff);
  graphics.fillCircle(20, 20, 19);
  graphics.fillStyle(0xd2691e);
  graphics.fillCircle(20, 20, 15);
  graphics.fillStyle(0xff4500);
  graphics.fillCircle(20, 20, 7);
  graphics.generateTexture("item_soup", 40, 40);

  graphics.clear();
  graphics.fillStyle(0xffffff);
  graphics.fillCircle(20, 20, 19);
  graphics.fillStyle(0xeeeeee);
  graphics.fillCircle(20, 20, 16);
  graphics.fillStyle(0xb22222);
  graphics.fillRect(12, 12, 8, 8);
  graphics.fillRect(22, 14, 6, 6);
  graphics.fillRect(14, 24, 6, 6);
  graphics.fillRect(24, 24, 7, 7);
  graphics.generateTexture("item_plate_tomato_cut", 40, 40);

  drawItem("item_soup_pot", (g) => {
    g.fillStyle(0xd2691e);
    g.fillCircle(16, 16, 14);
  });

  drawItem("overcooke", (g) => {
    g.fillStyle(0x000000);
    g.fillCircle(16, 16, 14);
  });

  drawItem("item_lettuce", (g) => {
    g.fillStyle(0x32cd32);
    g.fillCircle(16, 16, 11);
    g.fillStyle(0x228b22);
    g.fillCircle(16, 16, 8);
  });

  drawItem("item_lettuce_cut", (g) => {
    g.fillStyle(0x32cd32);
    g.fillRect(8, 8, 6, 6);
    g.fillRect(18, 10, 5, 5);
    g.fillRect(10, 19, 5, 5);
    g.fillRect(19, 19, 6, 6);
  });

  drawItem("item_egg", (g) => {
    g.fillStyle(0xfff8dc);
    g.fillEllipse(16, 16, 10, 13);
    g.fillStyle(0xffe4b5);
    g.fillEllipse(16, 16, 7, 10);
  });

  drawItem("item_flour", (g) => {
    g.fillStyle(0xf5f5dc);
    g.fillRect(8, 10, 16, 14);
    g.fillStyle(0xdcdcdc);
    g.fillRect(10, 8, 12, 4);
  });

  drawItem("item_rice", (g) => {
    g.fillStyle(0xffffff);
    g.fillRect(10, 10, 12, 12);
    g.fillStyle(0xf0f0f0);
    g.fillRect(11, 11, 10, 10);
  });

  drawItem("item_rice_cooked", (g) => {
    g.fillStyle(0xfffacd);
    g.fillCircle(16, 16, 11);
    g.fillStyle(0xffefd5);
    g.fillCircle(16, 16, 9);
  });

  drawItem("item_fish", (g) => {
    g.fillStyle(0xc0c0c0);
    g.fillEllipse(16, 16, 14, 8);
    g.fillStyle(0xa9a9a9);
    g.beginPath();
    g.moveTo(26, 16);
    g.lineTo(30, 12);
    g.lineTo(30, 20);
    g.fill();
  });

  drawItem("item_fish_cut", (g) => {
    g.fillStyle(0xffc0cb);
    g.fillRect(8, 10, 16, 4);
    g.fillRect(8, 16, 16, 4);
    g.fillRect(8, 22, 16, 4);
  });

  drawItem("item_seaweed", (g) => {
    g.fillStyle(0x006400);
    g.fillRect(8, 8, 16, 16);
    g.fillStyle(0x008000);
    g.fillRect(10, 10, 12, 12);
  });

  drawItem("item_onion", (g) => {
    g.fillStyle(0x9370db);
    g.fillCircle(16, 16, 11);
    g.fillStyle(0x8a2be2);
    g.fillCircle(16, 16, 8);
  });

  drawItem("item_onion_cut", (g) => {
    g.fillStyle(0x9370db);
    g.fillRect(8, 8, 7, 7);
    g.fillRect(18, 9, 6, 6);
    g.fillRect(9, 19, 6, 6);
    g.fillRect(19, 19, 7, 7);
  });

  drawItem("item_potato", (g) => {
    g.fillStyle(0xd2b48c);
    g.fillEllipse(16, 16, 12, 10);
    g.fillStyle(0xbc9a6b);
    g.fillEllipse(16, 16, 9, 7);
  });

  drawItem("item_potato_cut", (g) => {
    g.fillStyle(0xffefd5);
    g.fillRect(8, 8, 7, 7);
    g.fillRect(18, 10, 6, 6);
    g.fillRect(10, 19, 6, 6);
    g.fillRect(19, 20, 6, 6);
  });

  drawItem("item_carrot", (g) => {
    g.fillStyle(0xff8c00);
    g.beginPath();
    g.moveTo(16, 6);
    g.lineTo(10, 26);
    g.lineTo(22, 26);
    g.fill();
    g.fillStyle(0x228b22);
    g.fillRect(14, 4, 4, 5);
  });

  drawItem("item_carrot_cut", (g) => {
    g.fillStyle(0xff8c00);
    g.fillCircle(12, 12, 4);
    g.fillCircle(20, 12, 4);
    g.fillCircle(12, 20, 4);
    g.fillCircle(20, 20, 4);
    g.fillStyle(0xffa500);
    g.fillCircle(12, 12, 2);
    g.fillCircle(20, 12, 2);
    g.fillCircle(12, 20, 2);
    g.fillCircle(20, 20, 2);
  });

  graphics.clear();
  graphics.fillStyle(0xffffff);
  graphics.fillCircle(8, 8, 8);
  graphics.generateTexture("particle_smoke", 16, 16);

  graphics.clear();
  graphics.fillStyle(0xffffff);
  graphics.fillCircle(8, 8, 8);
  graphics.generateTexture("flame", 16, 16);

  drawItem("item_fire_extinguisher", (g) => {
    g.fillStyle(0xff0000);
    g.fillRect(10, 6, 12, 20);
    g.fillStyle(0x000000);
    g.fillRect(13, 4, 6, 6);
    g.fillStyle(0xffff00);
    g.fillRect(12, 12, 8, 4);
  });

  graphics.destroy();
}

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
