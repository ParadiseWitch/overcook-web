import { LevelConfigManager } from "./level-config-manager";
import { getDefaultLevelConfig, LevelConfig } from "../types/level-config";

describe("LevelConfigManager", () => {
  it("returns an isolated config snapshot", () => {
    const manager = new LevelConfigManager(getDefaultLevelConfig());

    const snapshot = manager.getConfig();
    snapshot.map.width = 99;
    snapshot.map.floors.push({ type: "wall", x: 1, y: 1 });
    snapshot.orderPool.recipes.push("lettuce-salad");

    const current = manager.getConfig();

    expect(current.map.width).toBe(17);
    expect(current.map.floors).toHaveLength(0);
    expect(current.orderPool.recipes).toEqual([]);
  });

  it("removes out-of-bounds objects when map size shrinks", () => {
    const manager = new LevelConfigManager(getDefaultLevelConfig());

    manager.addFloor({ type: "normal", x: 16, y: 12 });
    manager.addStation({ type: "delivery", x: 15, y: 10 });
    manager.addPlayer({ id: 1, x: 14, y: 11, color: 0x4da6ff });

    manager.updateMapSize(10, 10);

    const config = manager.getConfig();
    expect(config.map.width).toBe(10);
    expect(config.map.height).toBe(10);
    expect(config.map.floors).toEqual([]);
    expect(config.stations).toEqual([]);
    expect(config.players).toEqual([]);
  });

  it("imports valid json and normalizes missing optional fields", () => {
    const rawConfig = {
      ...getDefaultLevelConfig(),
      description: undefined,
      scoreTarget: {
        star1: 10,
        star2: 20,
        star3: 30,
      },
    };
    const manager = new LevelConfigManager();

    expect(manager.importJSON(JSON.stringify(rawConfig))).toBe(true);

    expect(manager.getConfig()).toMatchObject({
      id: rawConfig.id,
      name: rawConfig.name,
      duration: rawConfig.duration,
      scoreTarget: rawConfig.scoreTarget,
    });
  });

  it("validates required gameplay elements and recipe ingredients", () => {
    const config: LevelConfig = {
      ...getDefaultLevelConfig(),
      players: [{ id: 1, x: 1, y: 1, color: 0x4da6ff }],
      stations: [
        { type: "delivery", x: 2, y: 2 },
        { type: "ingredient", x: 3, y: 3, ingredientType: "lettuce", infinite: true },
      ],
      orderPool: {
        recipes: ["fish-sushi", "lettuce-salad"],
        maxActiveOrders: 4,
        spawnInterval: 15,
      },
    };
    const manager = new LevelConfigManager(config);

    const result = manager.validate();

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toContainEqual(
      expect.stringContaining("鱼寿司"),
    );
    expect(result.warnings).not.toContainEqual(
      expect.stringContaining("生菜沙拉"),
    );
  });
});
