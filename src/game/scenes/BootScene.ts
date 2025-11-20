import { GameObjects } from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() { this.generateTextures(); }
  create() {
    this.updateLegendIcons();
    this.scene.start('GameScene');
  }

  // 生成所有图形资源
  generateTextures() {
    const g = this.make.graphics({ x: 0, y: 0 });

    // --- 1. 角色 (等腰三角形) ---
    g.clear();
    g.fillStyle(0xffffff);
    g.beginPath();
    // Centered isosceles triangle (center is at 16,16 for 32x32 texture)
    g.moveTo(26, 16); // Tip pointing right
    g.lineTo(6, 6);   // Bottom left
    g.lineTo(6, 26);  // Bottom right
    g.fill();
    g.generateTexture('player', 32, 32);

    // --- 2. 柜台/设施 ---
    const drawBlock = (key: string, color: number, detail?: (g: GameObjects.Graphics) => void) => {
      g.clear();
      g.fillStyle(0x333333); g.fillRect(0, 0, 48, 48); // 边框
      g.fillStyle(color); g.fillRect(2, 2, 44, 44);   // 桌面
      if (detail) detail(g);
      g.generateTexture(key, 48, 48);
    };

    drawBlock('station_counter', 0x666666); // 灰色空柜台
    drawBlock('station_crate', 0x8B4513, (g) => { // 褐色箱子
      g.fillStyle(0x5c2e0b); g.fillRect(5, 10, 38, 5);
      g.fillRect(5, 33, 38, 5);
    });
    drawBlock('station_cut', 0xFFFFFF, (g) => { // 白色切菜板
      g.fillStyle(0xcccccc); g.fillRect(4, 4, 40, 40);
      g.fillStyle(0xeeeeee); g.fillRect(8, 8, 32, 32);
    });
    drawBlock('station_pot', 0x2E8B57, (g) => { // 绿色炉灶
      g.fillStyle(0x111111); g.fillCircle(24, 24, 16); // 炉头
    });
    drawBlock('station_sink', 0x4682B4, (g) => { // 蓝色水池
      g.fillStyle(0x224488); g.fillRect(8, 8, 32, 32);
    });
    drawBlock('station_trash', 0x111111);
    drawBlock('station_wall', 0x222222);

    // 上菜口
    drawBlock('station_delivery', 0x333333, (g) => { // 黄色箭头
      g.fillStyle(0xFFD700); // 黄色箭头
      g.beginPath(); g.moveTo(10, 10); g.lineTo(38, 10); g.lineTo(24, 38); g.fill();
    });

    // 地板
    g.clear();
    g.fillStyle(0x222222); g.fillRect(0, 0, 48, 48);
    g.fillStyle(0x2a2a2a); g.fillRect(1, 1, 46, 46);
    g.generateTexture('floor', 48, 48);

    // --- 3. 物品 ---
    const drawItem = (key: string, drawFn: (g: GameObjects.Graphics) => void) => {
      g.clear();
      drawFn(g);
      g.generateTexture(key, 32, 32);
    };

    // 生番茄 (红方圆)
    drawItem('item_tomato', (g) => {
      g.fillStyle(0xFF4500); g.fillCircle(16, 16, 11);
      g.fillStyle(0x00aa00); g.fillRect(14, 5, 4, 5);
    });

    // 切好的番茄 (碎块)
    drawItem('item_tomato_cut', (g) => {
      g.fillStyle(0xB22222);
      g.fillRect(8, 8, 8, 8); g.fillRect(18, 10, 6, 6);
      g.fillRect(10, 20, 6, 6); g.fillRect(20, 20, 7, 7);
    });

    // 干净盘子 (larger than ingredients - 40x40 texture)
    g.clear();
    g.fillStyle(0xffffff); g.fillCircle(20, 20, 19);
    g.fillStyle(0xeeeeee); g.fillCircle(20, 20, 16);
    g.generateTexture('item_plate', 40, 40);

    // 脏盘子 (larger than ingredients - 40x40 texture)
    g.clear();
    g.fillStyle(0xffffff); g.fillCircle(20, 20, 19);
    g.fillStyle(0xeeeeee); g.fillCircle(20, 20, 16);
    g.fillStyle(0x554433); g.fillCircle(16, 16, 5); // 污渍
    g.fillCircle(24, 24, 4);
    g.generateTexture('item_plate_dirty', 40, 40);

    // 成品汤 (larger than ingredients - 40x40 texture)
    g.clear();
    g.fillStyle(0xffffff); g.fillCircle(20, 20, 19); // 盘子底
    g.fillStyle(0xD2691E); g.fillCircle(20, 20, 15); // 汤
    g.fillStyle(0xFF4500); g.fillCircle(20, 20, 7);  // 汤心
    g.generateTexture('item_soup', 40, 40);

    // 锅里的汤 (纯液体)
    drawItem('item_soup_pot', (g) => {
      g.fillStyle(0xD2691E); g.fillCircle(16, 16, 14);
    });
  }

  // 将生成的纹理导出给DOM图例使用
  updateLegendIcons() {
    const map: Record<string, string> = {
      'icon-counter': 'station_counter',
      'icon-crate': 'station_crate',
      'icon-cut': 'station_cut',
      'icon-pot': 'station_pot',
      'icon-sink': 'station_sink',
      'icon-delivery': 'station_delivery',
      'icon-trash': 'station_trash',
      'icon-tomato': 'item_tomato',
      'icon-tomato-cut': 'item_tomato_cut',
      'icon-plate': 'item_plate',
      'icon-plate-dirty': 'item_plate_dirty',
      'icon-soup': 'item_soup',
      'icon-soup-pot': 'item_soup_pot'
    };
    for (let id in map) {
      const key = map[id];
      const canvas: HTMLCanvasElement = this.textures.get(key).getSourceImage() as HTMLCanvasElement;
      const img: HTMLImageElement = document.getElementById(id) as HTMLImageElement;
      if (img) img.src = canvas.toDataURL();
    }

    // Player icons need special handling since they're tinted
    const playerCanvas1 = this.createTintedPlayerIcon(0x4da6ff);
    const playerCanvas2 = this.createTintedPlayerIcon(0xff4444);
    const player1IconDom = document.getElementById('icon-player1') as HTMLImageElement;
    if (player1IconDom) {
      player1IconDom.src = playerCanvas1;
    }
    const player2IconDom = document.getElementById('icon-player2') as HTMLImageElement;
    if (player2IconDom) {
      player2IconDom.src = playerCanvas2;
    }
  }

  // Helper to create tinted player icons for legend
  createTintedPlayerIcon(color: number) {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

    // Draw the base player shape (using same triangle points as texture)
    ctx.beginPath();
    ctx.moveTo(26 - 16, 16 - 16); // Centered: (26,16) -> (10,0)
    ctx.lineTo(6 - 16, 6 - 16);   // (6,6) -> (-10,-10)
    ctx.lineTo(6 - 16, 26 - 16);  // (6,26) -> (-10,10)
    ctx.closePath();

    // Set color
    // ctx.fillStyle = Phaser.Display.Color.HexStringToColor('#' + color.toString(16).padStart(6, '0')).webSafeString();
    ctx.fillStyle = Phaser.Display.Color.HexStringToColor('#' + color.toString(16).padStart(6, '0')).rgba;
    ctx.fill();

    return canvas.toDataURL();
  }
}
