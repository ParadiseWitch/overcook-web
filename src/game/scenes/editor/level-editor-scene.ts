import Phaser from "phaser";

import { preloadTextures } from "../../textures";
import { LevelConfigManager } from "../../manager/level-config-manager";
import type { LevelConfig } from "../../types/level-config";
import { getDefaultLevelConfig } from "../../types/level-config";
import { useCoordinateSystem } from "@/game/helper/use-coordinate-system";
import useLevelEditorRender from "./level-editor-render";


// 作为编辑器场景的编排层，保留对 Vue 壳层稳定的公共 API。
export class LevelEditorScene extends Phaser.Scene {
  // debug用的坐标轴
  public debugCoord: ReturnType<typeof useCoordinateSystem>
  public levelConfigManager = new LevelConfigManager(getDefaultLevelConfig());
  public gridWidth = 17;
  public gridHeight = 13;
  public tileSize = 48;
  private render: () => void;
  private clear: () => void;

  constructor() {
    super({ key: "LevelEditorScene" });
  }

  /**
   * 根据传入关卡配置初始化编辑器场景。
   */
  init(data?: { levelConfig?: LevelConfig }) {
    const levelConfig = data?.levelConfig ?? getDefaultLevelConfig();
    this.levelConfigManager = new LevelConfigManager(levelConfig);
    this.gridWidth = levelConfig.map.width;
    this.gridHeight = levelConfig.map.height;
    this.tileSize = levelConfig.map.tileSize || 48;
    const { render, clear } = useLevelEditorRender(this, levelConfig);
    this.render = render;
    this.clear = clear;
  }

  /**
   * 创建编辑器场景的显示对象、输入和首帧相机状态。
   */
  create() {
    const worldWidth = this.gridWidth * this.tileSize;
    const worldHeight = this.gridHeight * this.tileSize;
    // 坐标系
    this.debugCoord = useCoordinateSystem(this, {
      originX: 0,
      originY: 0,
      minX: -this.scale.width,
      maxX: worldWidth + this.scale.width,
      minY: -this.scale.height,
      maxY: worldHeight + this.scale.height,
      gridSize: 48,
      fixedToCamera: false
    });
    this.debugCoord.show();
    this.resetCamera();
    preloadTextures(this);
    // 物理世界
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    // 渲染
    this.clear();
    this.render();
  }

  /**
   * 重置相机到默认中心和缩放。
   */
  resetCamera() {
    const gridCenter = this.getGridCenter();
    this.cameras.main.centerOn(gridCenter[0], gridCenter[1]);
    this.cameras.main.setZoom(1.1)
  }

  getGridCenter(): number[] {
    return [this.gridWidth * this.tileSize / 2, this.gridHeight * this.tileSize / 2];
  }
}
