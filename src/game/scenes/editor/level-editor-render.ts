import type { FloorConfig, LevelConfig } from "@/game/types/level-config";



export default function useLevelEditorRender(scene: Phaser.Scene, levelConfig: LevelConfig) {
  const tileSize = levelConfig.map.tileSize;
  const mapWidth = levelConfig.map.width;
  const mapHeight = levelConfig.map.height;


  function clear() {
    // TODO: 
  }
  /**
   * 按当前关卡配置重绘所有地板、工作站和玩家出生点。
   */
  function render() {
    // this.objectGroup.clear(true, true);
    renderFloors();
    // renderStations(scene);
    // renderPlayers(scene);
  }

  function renderFloors() {
    const overrides = new Map(
      levelConfig.map.floors.map((floor) => [`${floor.x},${floor.y}`, floor] as const),
    );

    const floors: FloorConfig[] = [];
    for (let y = 0; y < mapHeight; y += 1) {
      for (let x = 0; x < mapWidth; x += 1) {
        renderFloor(overrides.get(`${x},${y}`) ?? { type: "normal", x, y, texture: "floor" })
      }
    }
    return floors;
  }

  function renderFloor(floorConfig: FloorConfig) {
    const { centerX, centerY } = toWorldPosition(floorConfig.x, floorConfig.y);
    const tile = scene.add.image(centerX, centerY, floorConfig.texture ?? "floor");
    tile.setDisplaySize(tileSize, tileSize);
    tile.setInteractive();
    tile.on("pointerdown", (_pointer: Phaser.Input.Pointer) => {
      // TODO: 选中物体高亮
    });
  }

  /**
   * 把网格坐标转换成世界空间中心点坐标。
   */
  function toWorldPosition(x: number, y: number) {
    return {
      centerX: x * tileSize + tileSize / 2,
      centerY: y * tileSize + tileSize / 2,
    };
  }
  return {
    render,
    clear,
  }
}


