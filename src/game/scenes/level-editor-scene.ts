import Phaser from 'phaser';
import { LevelConfig, getDefaultLevelConfig, FloorConfig, StationConfig, PlayerSpawn, ConveyorFloor, IngredientType } from '@/game/types/level-config';
import { LevelConfigManager } from '@/game/manager/level-config-manager';

export class LevelEditorScene extends Phaser.Scene {
  private levelConfigManager: LevelConfigManager;
  private selectedTool: string | null = null;
  private gridWidth: number = 17;
  private gridHeight: number = 13;
  private tileSize: number = 48;
  private gridGroup: Phaser.GameObjects.Group;
  private objectGroup: Phaser.GameObjects.Group;
  private selectionMarker: Phaser.GameObjects.Rectangle | null = null;

  constructor() {
    super({ key: 'LevelEditorScene' });
    const initialConfig = getDefaultLevelConfig();
    this.levelConfigManager = new LevelConfigManager(initialConfig);
    this.gridGroup = this.add.group();
    this.objectGroup = this.add.group();
  }

  init(data?: any) {
    // 如果有传入的关卡配置，则使用它
    if (data && data.levelConfig) {
      this.levelConfigManager = new LevelConfigManager(data.levelConfig);
      const config = this.levelConfigManager.getConfig();
      this.gridWidth = config.map.width;
      this.gridHeight = config.map.height;
    }
  }

  create() {
    // 设置背景
    this.cameras.main.setBackgroundColor(0x222222);

    // 创建网格
    this.createGrid();

    // 创建对象
    this.renderLevelObjects();

    // 设置输入事件
    this.setupInputEvents();

    // 显示初始提示
    this.add.text(10, 10, '关卡编辑器 - 点击左侧工具选择', {
      fontSize: '16px',
      color: '#ffffff'
    }).setScrollFactor(0);
  }

  private createGrid() {
    // 清除现有的网格
    this.gridGroup.clear(true, true);

    // 绘制网格线
    for (let x = 0; x <= this.gridWidth; x++) {
      const lineX = this.add.line(
        0,
        0,
        x * this.tileSize,
        0,
        x * this.tileSize,
        this.gridHeight * this.tileSize,
        0x444444
      ).setLineWidth(1);
      this.gridGroup.add(lineX);
    }

    for (let y = 0; y <= this.gridHeight; y++) {
      const lineY = this.add.line(
        0,
        0,
        0,
        y * this.tileSize,
        this.gridWidth * this.tileSize,
        y * this.tileSize,
        0x444444
      ).setLineWidth(1);
      this.gridGroup.add(lineY);
    }

    // 将网格置于底层
    this.gridGroup.setDepth(-1);
  }

  private renderLevelObjects() {
    // 清除现有的对象
    this.objectGroup.clear(true, true);

    const config = this.levelConfigManager.getConfig();

    // 渲染地板
    config.map.floors.forEach(floor => {
      this.renderFloor(floor);
    });

    // 渲染工作站
    config.stations.forEach(station => {
      this.renderStation(station);
    });

    // 渲染玩家
    config.players.forEach(player => {
      this.renderPlayer(player);
    });
  }

  private renderFloor(floor: FloorConfig) {
    const x = floor.x * this.tileSize + this.tileSize / 2;
    const y = floor.y * this.tileSize + this.tileSize / 2;

    let tint = 0xffffff;

    switch (floor.type) {
      case 'wall':
        tint = 0x666666;
        break;
      case 'conveyor':
        tint = 0xaaaaaa;
        break;
      case 'normal':
      default:
        tint = 0xdddddd;
        break;
    }

    // 创建一个矩形代表地板
    const floorSprite = this.add.rectangle(x, y, this.tileSize, this.tileSize, tint)
      .setStrokeStyle(1, 0x333333);
    
    // 存储地板配置信息
    floorSprite.setData('floorConfig', floor);
    
    // 添加点击事件
    floorSprite.setInteractive().on('pointerdown', () => {
      this.selectObject(floor, floorSprite);
    });
    
    this.objectGroup.add(floorSprite);
  }

  private renderStation(station: StationConfig) {
    const x = station.x * this.tileSize + this.tileSize / 2;
    const y = station.y * this.tileSize + this.tileSize / 2;

    let tint = 0xffffff;

    switch (station.type) {
      case 'delivery':
        tint = 0x55aa55;
        break;
      case 'trash':
        tint = 0x888888;
        break;
      case 'cut':
        tint = 0xaaaaaa;
        break;
      case 'pot':
        tint = 0xbbbbbb;
        break;
      case 'sink':
        tint = 0x99ccff;
        break;
      case 'plate-counter':
        tint = 0xaaaaff;
        break;
      case 'ingredient':
        // 根据食材类型设置颜色
        switch ((station as any).ingredientType) {
          case 'tomato': tint = 0xff6666; break;
          case 'lettuce': tint = 0x66ff66; break;
          case 'rice': tint = 0xffffcc; break;
          case 'fish': tint = 0x66ccff; break;
          default: tint = 0xcccccc;
        }
        break;
      case 'counter':
      default:
        tint = 0xcccccc;
        break;
    }

    // 创建一个圆形代表工作站
    const stationSprite = this.add.circle(x, y, this.tileSize / 2 - 4, tint)
      .setStrokeStyle(2, 0x333333);
    
    // 存储工作站配置信息
    stationSprite.setData('stationConfig', station);
    
    // 添加点击事件
    stationSprite.setInteractive().on('pointerdown', () => {
      this.selectObject(station, stationSprite);
    });
    
    this.objectGroup.add(stationSprite);
  }

  private renderPlayer(player: PlayerSpawn) {
    const x = player.x * this.tileSize + this.tileSize / 2;
    const y = player.y * this.tileSize + this.tileSize / 2;

    // 使用三角形代表玩家，朝向向上
    const triangle = this.makeTriangle({
      x: x,
      y: y,
      width: this.tileSize - 8,
      height: this.tileSize - 8,
      fillColor: player.color || (player.id === 1 ? 0x4da6ff : 0xff4444),
      strokeColor: 0x000000,
      strokeWidth: 2
    });

    // 存储玩家配置信息
    triangle.setData('playerConfig', player);
    
    // 添加点击事件
    triangle.setInteractive().on('pointerdown', () => {
      this.selectObject(player, triangle);
    });
    
    this.objectGroup.add(triangle);
  }

  private makeTriangle(config: any) {
    const { x, y, width, height, fillColor, strokeColor, strokeWidth } = config;
    
    const triangle = this.add.graphics();
    triangle.fillStyle(fillColor);
    triangle.fillTriangle(
      x, y - height / 2,      // 顶点
      x - width / 2, y + height / 2,  // 左下角
      x + width / 2, y + height / 2   // 右下角
    );
    
    if (strokeColor && strokeWidth) {
      triangle.lineStyle(strokeWidth, strokeColor);
      triangle.strokeTriangle(
        x, y - height / 2,
        x - width / 2, y + height / 2,
        x + width / 2, y + height / 2
      );
    }
    
    return triangle;
  }

  private setupInputEvents() {
    // 监听画布点击事件
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // 如果没有选择工具，则不处理点击
      if (!this.selectedTool) return;

      // 获取点击位置对应的网格坐标
      const gridX = Math.floor(pointer.worldX / this.tileSize);
      const gridY = Math.floor(pointer.worldY / this.tileSize);

      // 检查是否在网格范围内
      if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
        this.handleObjectPlacement(gridX, gridY);
      }
    });
  }

  private handleObjectPlacement(x: number, y: number) {
    // 检查该位置是否已有对象
    const existingObject = this.findObjectAtPosition(x, y);
    if (existingObject) {
      // 如果是相同类型的工具，则移除现有对象
      if (this.isSameObjectType(existingObject, this.selectedTool)) {
        this.removeObjectAtPosition(x, y);
      } else {
        // 如果是不同类型，则替换
        this.removeObjectAtPosition(x, y);
      }
    }

    // 根据选择的工具放置对象
    switch (this.selectedTool) {
      case 'normal-floor':
        this.levelConfigManager.addFloor({ type: 'normal', x, y });
        break;
      case 'wall-floor':
        this.levelConfigManager.addFloor({ type: 'wall', x, y });
        break;
      case 'conveyor-floor':
        this.levelConfigManager.addFloor({ 
          type: 'conveyor', 
          x, 
          y, 
          direction: 'right',
          speed: 100
        } as ConveyorFloor);
        break;
      case 'counter':
        this.levelConfigManager.addStation({ type: 'counter', x, y });
        break;
      case 'plate-counter':
        this.levelConfigManager.addStation({ type: 'plate-counter', x, y });
        break;
      case 'cut':
        this.levelConfigManager.addStation({ type: 'cut', x, y });
        break;
      case 'pot':
        this.levelConfigManager.addStation({ type: 'pot', x, y });
        break;
      case 'sink':
        this.levelConfigManager.addStation({ type: 'sink', x, y });
        break;
      case 'delivery':
        this.levelConfigManager.addStation({ type: 'delivery', x, y });
        break;
      case 'trash':
        this.levelConfigManager.addStation({ type: 'trash', x, y });
        break;
      case 'player-1':
        this.levelConfigManager.addPlayer({ id: 1, x, y, color: 0x4da6ff });
        break;
      case 'player-2':
        this.levelConfigManager.addPlayer({ id: 2, x, y, color: 0xff4444 });
        break;
      case 'ingredient-tomato':
        this.levelConfigManager.addStation({ 
          type: 'ingredient', 
          x, y,
          ingredientType: 'tomato' as IngredientType,
          infinite: true
        });
        break;
      case 'ingredient-lettuce':
        this.levelConfigManager.addStation({ 
          type: 'ingredient', 
          x, y,
          ingredientType: 'lettuce' as IngredientType,
          infinite: true
        });
        break;
      case 'ingredient-rice':
        this.levelConfigManager.addStation({ 
          type: 'ingredient', 
          x, y,
          ingredientType: 'rice' as IngredientType,
          infinite: true
        });
        break;
      case 'ingredient-fish':
        this.levelConfigManager.addStation({ 
          type: 'ingredient', 
          x, y,
          ingredientType: 'fish' as IngredientType,
          infinite: true
        });
        break;
    }

    // 重新渲染对象
    this.renderLevelObjects();
  }

  private isSameObjectType(existingObj: any, tool: string | null): boolean {
    if (!tool) return false;

    // 检查工具类型与现有对象类型是否匹配
    if (existingObj.type === 'floor') {
      return tool.includes('-floor');
    } else if (existingObj.type === 'station') {
      return !tool.includes('-floor') && !tool.includes('player-');
    } else if (existingObj.type === 'player') {
      return tool.includes('player-');
    }

    return false;
  }

  private findObjectAtPosition(x: number, y: number) {
    const config = this.levelConfigManager.getConfig();

    // 检查是否存在地板
    const floorIndex = config.map.floors.findIndex(f => f.x === x && f.y === y);
    if (floorIndex !== -1) return { type: 'floor', index: floorIndex, config: config.map.floors[floorIndex] };

    // 检查是否存在工作站
    const stationIndex = config.stations.findIndex(s => s.x === x && s.y === y);
    if (stationIndex !== -1) return { type: 'station', index: stationIndex, config: config.stations[stationIndex] };

    // 检查是否存在玩家
    const playerIndex = config.players.findIndex(p => p.x === x && p.y === y);
    if (playerIndex !== -1) return { type: 'player', index: playerIndex, config: config.players[playerIndex] };

    return null;
  }

  private removeObjectAtPosition(x: number, y: number) {
    // 尝试移除地板
    if (this.levelConfigManager.removeFloor(x, y)) {
      return;
    }

    // 尝试移除工作站
    if (this.levelConfigManager.removeStation(x, y)) {
      return;
    }

    // 尝试移除玩家
    // 注意：这里需要特殊处理，因为玩家是通过ID而不是坐标删除的
    const config = this.levelConfigManager.getConfig();
    const playerIndex = config.players.findIndex(p => p.x === x && p.y === y);
    if (playerIndex !== -1) {
      config.players.splice(playerIndex, 1);
      this.levelConfigManager.setConfig(config);
      return;
    }
  }

  private selectObject(object: any, sprite: Phaser.GameObjects.GameObject) {
    // 取消之前的选择
    if (this.selectionMarker) {
      this.selectionMarker.destroy();
      this.selectionMarker = null;
    }

    // 创建新的选择标记
    // 对于精灵对象，我们直接使用其位置和尺寸
    let centerX = 0, centerY = 0, width = 40, height = 40;
    
    if ('x' in sprite && typeof sprite.x === 'number') {
      centerX = sprite.x;
    }
    if ('y' in sprite && typeof sprite.y === 'number') {
      centerY = sprite.y;
    }
    
    // 根据精灵类型估算尺寸
    if ('width' in sprite && typeof sprite.width === 'number') {
      width = sprite.width;
    } else if ('displayWidth' in sprite && typeof sprite.displayWidth === 'number') {
      width = sprite.displayWidth;
    }
    
    if ('height' in sprite && typeof sprite.height === 'number') {
      height = sprite.height;
    } else if ('displayHeight' in sprite && typeof sprite.displayHeight === 'number') {
      height = sprite.displayHeight;
    }

    this.selectionMarker = this.add.rectangle(
      centerX,
      centerY,
      width + 8,
      height + 8,
      0x00ff00
    ).setStrokeStyle(2, 0x00ff00).setFillStyle(0x00ff00, 0.2);

    // 触发属性面板更新
    this.events.emit('object-selected', object);
  }

  public setSelectedTool(tool: string) {
    this.selectedTool = tool;
  }

  public clearSelection() {
    if (this.selectionMarker) {
      this.selectionMarker.destroy();
      this.selectionMarker = null;
    }
  }

  public getLevelConfig(): LevelConfig {
    return this.levelConfigManager.getConfig();
  }

  public setLevelConfig(config: LevelConfig) {
    this.levelConfigManager = new LevelConfigManager(config);
    this.gridWidth = config.map.width;
    this.gridHeight = config.map.height;
    this.createGrid();
    this.renderLevelObjects();
  }

  public exportLevelConfig(): LevelConfig {
    return this.levelConfigManager.getConfig();
  }

  public updateLevelName(name: string) {
    this.levelConfigManager.updateBasicInfo({ name });
  }

  public updateLevelDescription(description: string) {
    this.levelConfigManager.updateBasicInfo({ description });
  }

  public updateGameType(gameType: 'local-coop' | 'local-versus' | 'online-coop' | 'online-versus') {
    this.levelConfigManager.updateBasicInfo({ gameType });
  }

  public updateDuration(duration: number) {
    this.levelConfigManager.updateBasicInfo({ duration });
  }

  public updateMapSize(width: number, height: number) {
    this.levelConfigManager.updateMapSize(width, height);
    this.gridWidth = width;
    this.gridHeight = height;
    this.createGrid();
    this.renderLevelObjects();
  }
  
  // Getter for selectedTool to make it accessible
  public getSelectedTool(): string | null {
    return this.selectedTool;
  }
}