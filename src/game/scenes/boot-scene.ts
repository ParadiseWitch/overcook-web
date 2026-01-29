import { GameObjects } from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.generateTextures();
  }
  create() {
    this.updateLegendIcons();
    this.scene.start("GameScene");
  }

  // 生成所有图形资源
  generateTextures() {
    const g = this.make.graphics({ x: 0, y: 0 });

    // --- 1. 角色 (等腰三角形) ---
    g.clear();
    g.fillStyle(0xffffff);
    g.beginPath();
    // Centered isosceles triangle (center is at 16,16 for 32x32 texture)
    g.moveTo(30, 15); // Tip pointing right
    g.lineTo(3, 0); // Bottom left
    g.lineTo(3, 30); // Bottom right
    g.fill();
    g.generateTexture("player", 32, 32);

    // --- 2. 柜台/设施 ---
    const drawBlock = (
      key: string,
      color: number,
      detail?: (g: GameObjects.Graphics) => void,
    ) => {
      g.clear();
      g.fillStyle(0x333333);
      g.fillRect(0, 0, 48, 48); // 边框
      g.fillStyle(color);
      g.fillRect(2, 2, 44, 44); // 桌面
      if (detail) detail(g);
      g.generateTexture(key, 48, 48);
    };

    drawBlock("station_counter", 0x666666); // 灰色空柜台
    drawBlock("station_crate", 0x8b4513, (g) => {
      // 褐色箱子
      g.fillStyle(0x5c2e0b);
      g.fillRect(5, 10, 38, 5);
      g.fillRect(5, 33, 38, 5);
    });
    drawBlock("station_cut", 0x666666, (g) => {
      // 白色切菜板
      g.fillStyle(0xeeeeee);
      g.fillRoundedRect(4, 8, 40, 32, 4);
      g.fillStyle(0x999999);
      g.fillRoundedRect(8, 12, 4, 24, 2);
      g.fillStyle(0x999999);
      g.fillRoundedRect(36, 12, 4, 24, 2);
    });
    drawBlock("station_pot", 0x2e8b57, (g) => {
      // 绿色炉灶
      g.fillStyle(0x111111);
      g.fillCircle(24, 24, 9);
      this.drawDashedCircle(g, 24, 24, 11, 10, 3, 0.1, 0.43); // 炉头
      this.drawDashedCircle(g, 24, 24, 13, 2, 3, 0.8, -0.3); // 炉头
    });
    drawBlock("station_sink", 0x4682b4, (g) => {
      // 蓝色水池
      g.fillStyle(0x224488);
      g.fillRect(8, 8, 32, 32);
    });
    drawBlock("station_trash", 0x111111);
    g.clear();
    g.fillStyle(0x222222);
    g.fillRect(0, 0, 48, 48);
    g.generateTexture("station_nothing", 48, 48);

    g.clear();
    g.fillStyle(0x8f85a3);
    g.fillRect(2, 2, 44, 44);
    g.fillStyle(0x6f6a9f);
    g.fillCircle(24, 24, 20);
    g.fillStyle(0x8f85a3);
    g.fillCircle(24, 24, 14);
    g.generateTexture("station_dirty_plate", 48, 48);

    // 上菜口
    drawBlock("station_delivery", 0x333333, (g) => {
      // 黄色箭头
      g.fillStyle(0xffd700); // 黄色箭头
      g.beginPath();
      g.moveTo(10, 10);
      g.lineTo(38, 10);
      g.lineTo(24, 38);
      g.fill();
    });

    // 地板
    g.clear();
    g.fillStyle(0x222222);
    g.fillRect(0, 0, 48, 48);
    g.fillStyle(0x2a2a2a);
    g.fillRect(1, 1, 46, 46);
    g.generateTexture("floor", 48, 48);

    // --- 3. 物品 ---
    const drawItem = (
      key: string,
      drawFn: (g: GameObjects.Graphics) => void,
    ) => {
      g.clear();
      drawFn(g);
      g.generateTexture(key, 32, 32);
    };

    // 生番茄 (红方圆)
    drawItem("item_tomato", (g) => {
      g.fillStyle(0xff4500);
      g.fillCircle(16, 16, 11);
      g.fillStyle(0x00aa00);
      g.fillRect(14, 5, 4, 5);
    });

    // 切好的番茄 (碎块)
    drawItem("item_tomato_cut", (g) => {
      g.fillStyle(0xb22222);
      g.fillRect(8, 8, 8, 8);
      g.fillRect(18, 10, 6, 6);
      g.fillRect(10, 20, 6, 6);
      g.fillRect(20, 20, 7, 7);
    });

    // 空锅
    g.clear();
    g.fillStyle(0x111111);
    g.fillCircle(20, 20, 16);
    g.fillStyle(0x222222);
    g.fillCircle(20, 20, 13);
    g.fillStyle(0x111111);
    g.fillRoundedRect(18, 33, 4, 7, 2);
    g.generateTexture("item_pot", 40, 40);

    // 干净盘子 (larger than ingredients - 40x40 texture)
    g.clear();
    g.fillStyle(0xffffff);
    g.fillCircle(20, 20, 19);
    g.fillStyle(0xeeeeee);
    g.fillCircle(20, 20, 16);
    g.generateTexture("item_plate", 40, 40);

    // 脏盘子 (larger than ingredients - 40x40 texture)
    g.clear();
    g.fillStyle(0xffffff);
    g.fillCircle(20, 20, 19);
    g.fillStyle(0xeeeeee);
    g.fillCircle(20, 20, 16);
    g.fillStyle(0x554433);
    g.fillCircle(16, 16, 5); // 污渍
    g.fillCircle(24, 24, 4);
    g.generateTexture("item_plate_dirty", 40, 40);

    // 成品汤 (larger than ingredients - 40x40 texture)
    g.clear();
    g.fillStyle(0xffffff);
    g.fillCircle(20, 20, 19); // 盘子底
    g.fillStyle(0xd2691e);
    g.fillCircle(20, 20, 15); // 汤
    g.fillStyle(0xff4500);
    g.fillCircle(20, 20, 7); // 汤心
    g.generateTexture("item_soup", 40, 40);

    // Plate with cut tomato
    g.clear();
    // Draw plate first
    g.fillStyle(0xffffff);
    g.fillCircle(20, 20, 19);
    g.fillStyle(0xeeeeee);
    g.fillCircle(20, 20, 16);
    // Draw cut tomato on top
    g.fillStyle(0xb22222);
    // Adjust coordinates to be centered on the 40x40 plate texture
    g.fillRect(8 + 4, 8 + 4, 8, 8);
    g.fillRect(18 + 4, 10 + 4, 6, 6);
    g.fillRect(10 + 4, 20 + 4, 6, 6);
    g.fillRect(20 + 4, 20 + 4, 7, 7);
    g.generateTexture("item_plate_tomato_cut", 40, 40);

    // 锅里的汤 (纯液体)
    drawItem("item_soup_pot", (g) => {
      g.fillStyle(0xd2691e);
      g.fillCircle(16, 16, 14);
    });

    // 煮糊食材的材质
    drawItem("overcooke", (g) => {
      g.fillStyle(0x000000);
      g.fillCircle(16, 16, 14);
    });

    // === 新增食材纹理 ===
    
    // 生菜 (绿色圆形)
    drawItem("item_lettuce", (g) => {
      g.fillStyle(0x32cd32);
      g.fillCircle(16, 16, 11);
      g.fillStyle(0x228b22);
      g.fillCircle(16, 16, 8);
    });

    // 切好的生菜 (绿色碎块)
    drawItem("item_lettuce_cut", (g) => {
      g.fillStyle(0x32cd32);
      g.fillRect(8, 8, 6, 6);
      g.fillRect(18, 10, 5, 5);
      g.fillRect(10, 19, 5, 5);
      g.fillRect(19, 19, 6, 6);
    });

    // 鸡蛋 (白色椭圆)
    drawItem("item_egg", (g) => {
      g.fillStyle(0xfff8dc);
      g.fillEllipse(16, 16, 10, 13);
      g.fillStyle(0xffe4b5);
      g.fillEllipse(16, 16, 7, 10);
    });

    // 面粉 (白色袋子)
    drawItem("item_flour", (g) => {
      g.fillStyle(0xf5f5dc);
      g.fillRect(8, 10, 16, 14);
      g.fillStyle(0xdcdcdc);
      g.fillRect(10, 8, 12, 4);
    });

    // 米 (白色颗粒)
    drawItem("item_rice", (g) => {
      g.fillStyle(0xffffff);
      g.fillRect(10, 10, 12, 12);
      g.fillStyle(0xf0f0f0);
      g.fillRect(11, 11, 10, 10);
    });

    // 煮好的米 (黄白色)
    drawItem("item_rice_cooked", (g) => {
      g.fillStyle(0xfffacd);
      g.fillCircle(16, 16, 11);
      g.fillStyle(0xffefd5);
      g.fillCircle(16, 16, 9);
    });

    // 鱼 (银色鱼形)
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

    // 切好的鱼 (鱼片)
    drawItem("item_fish_cut", (g) => {
      g.fillStyle(0xffc0cb);
      g.fillRect(8, 10, 16, 4);
      g.fillRect(8, 16, 16, 4);
      g.fillRect(8, 22, 16, 4);
    });

    // 紫菜 (深绿色方块)
    drawItem("item_seaweed", (g) => {
      g.fillStyle(0x006400);
      g.fillRect(8, 8, 16, 16);
      g.fillStyle(0x008000);
      g.fillRect(10, 10, 12, 12);
    });

    // 洋葱 (紫色圆形)
    drawItem("item_onion", (g) => {
      g.fillStyle(0x9370db);
      g.fillCircle(16, 16, 11);
      g.fillStyle(0x8a2be2);
      g.fillCircle(16, 16, 8);
    });

    // 切好的洋葱 (紫色碎块)
    drawItem("item_onion_cut", (g) => {
      g.fillStyle(0x9370db);
      g.fillRect(8, 8, 7, 7);
      g.fillRect(18, 9, 6, 6);
      g.fillRect(9, 19, 6, 6);
      g.fillRect(19, 19, 7, 7);
    });

    // 土豆 (棕色椭圆)
    drawItem("item_potato", (g) => {
      g.fillStyle(0xd2b48c);
      g.fillEllipse(16, 16, 12, 10);
      g.fillStyle(0xbc9a6b);
      g.fillEllipse(16, 16, 9, 7);
    });

    // 切好的土豆 (土豆块)
    drawItem("item_potato_cut", (g) => {
      g.fillStyle(0xffefd5);
      g.fillRect(8, 8, 7, 7);
      g.fillRect(18, 10, 6, 6);
      g.fillRect(10, 19, 6, 6);
      g.fillRect(19, 20, 6, 6);
    });

    // 胡萝卜 (橙色长条)
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

    // 切好的胡萝卜 (橙色圆片)
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

    // dash smoke
    g.clear();
    g.fillStyle(0xffffff);
    g.fillCircle(8, 8, 8);
    g.generateTexture("particle_smoke", 16, 16);

    g.clear();
    g.fillStyle(0xffffff);
    g.fillCircle(8, 8, 8);
    g.generateTexture("flame", 16, 16);

    drawItem("item_fire_extinguisher", (g) => {
      g.fillStyle(0xff0000);
      g.fillRect(10, 6, 12, 20);
      g.fillStyle(0x000000);
      g.fillRect(13, 4, 6, 6);
      g.fillStyle(0xffff00);
      g.fillRect(12, 12, 8, 4);
    });
  }

  // 将生成的纹理导出给DOM图例使用
  updateLegendIcons() {
    const map: Record<string, string> = {
      "icon-counter": "station_counter",
      "icon-crate": "station_crate",
      "icon-cut": "station_cut",
      "icon-pot-station": "station_pot",
      "icon-sink": "station_sink",
      "icon-delivery": "station_delivery",
      "icon-trash": "station_trash",
      "icon-dirty-spawn": "station_dirty_plate",
      "icon-tomato": "item_tomato",
      "icon-tomato-cut": "item_tomato_cut",
      "icon-pot": "item_pot",
      "icon-plate": "item_plate",
      "icon-plate-dirty": "item_plate_dirty",
      "icon-soup": "item_soup",
      "icon-soup-pot": "item_soup_pot",
      // 新增食材图标
      "icon-lettuce": "item_lettuce",
      "icon-lettuce-cut": "item_lettuce_cut",
      "icon-fish": "item_fish",
      "icon-fish-cut": "item_fish_cut",
      "icon-rice": "item_rice",
      "icon-rice-cooked": "item_rice_cooked",
      "icon-onion": "item_onion",
      "icon-onion-cut": "item_onion_cut",
      "icon-potato": "item_potato",
      "icon-potato-cut": "item_potato_cut",
      "icon-carrot": "item_carrot",
      "icon-carrot-cut": "item_carrot_cut",
      "icon-egg": "item_egg",
      "icon-flour": "item_flour",
      "icon-seaweed": "item_seaweed",
    };
    for (let id in map) {
      const key = map[id];
      const canvas: HTMLCanvasElement = this.textures
        .get(key)
        .getSourceImage() as HTMLCanvasElement;
      const img: HTMLImageElement = document.getElementById(
        id,
      ) as HTMLImageElement;
      if (img) img.src = canvas.toDataURL();
    }

    // Player icons need special handling since they're tinted
    const playerCanvas1 = this.createTintedPlayerIcon(0x4da6ff);
    const playerCanvas2 = this.createTintedPlayerIcon(0xff4444);
    const player1IconDom = document.getElementById(
      "icon-player1",
    ) as HTMLImageElement;
    if (player1IconDom) {
      player1IconDom.src = playerCanvas1;
    }
    const player2IconDom = document.getElementById(
      "icon-player2",
    ) as HTMLImageElement;
    if (player2IconDom) {
      player2IconDom.src = playerCanvas2;
    }
  }

  // Helper to create tinted player icons for legend
  createTintedPlayerIcon(color: number) {
    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 24;
    const ctx: CanvasRenderingContext2D = canvas.getContext(
      "2d",
    ) as CanvasRenderingContext2D;

    // Draw the base player shape (using same triangle points as texture)
    ctx.beginPath();
    ctx.moveTo(26 - 16, 16 - 16); // Centered: (26,16) -> (10,0)
    ctx.lineTo(6 - 16, 6 - 16); // (6,6) -> (-10,-10)
    ctx.lineTo(6 - 16, 26 - 16); // (6,26) -> (-10,10)
    ctx.closePath();

    // Set color
    // ctx.fillStyle = Phaser.Display.Color.HexStringToColor('#' + color.toString(16).padStart(6, '0')).webSafeString();
    ctx.fillStyle = Phaser.Display.Color.HexStringToColor(
      "#" + color.toString(16).padStart(6, "0"),
    ).rgba;
    ctx.fill();

    return canvas.toDataURL();
  }

  drawDashedCircle(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    radius: number,
    width: number = 10,
    dashNum: number = 5,
    dashLenRatio = 0.5,
    offset: number = 0,
    color: number = 0x111111,
  ) {
    g.lineStyle(width, color, 1);
    const radPerSeg = (Math.PI * 2) / dashNum;
    for (let i = 0; i < dashNum; i++) {
      const start = i * radPerSeg + offset;
      const end = start + dashLenRatio * radPerSeg;
      g.beginPath();
      g.arc(cx, cy, radius, start, end);
      g.strokePath(); // 单独描边，不会连笔
    }
  }
}
