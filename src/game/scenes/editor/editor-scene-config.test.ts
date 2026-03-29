import { createNewLevel, importLevelConfig, setLevelConfig } from "./editor-scene-config";
import { getDefaultLevelConfig } from "../../types/level-config";

describe("editor-scene-config", () => {
  it("does not depend on removed view-mode state when resetting or loading config", () => {
    const refreshScene = vi.fn();
    const context = {
      levelConfigManager: {
        importJSON: vi.fn(() => true),
        getConfig: vi.fn(() => getDefaultLevelConfig()),
      },
      selectedObject: { kind: "player", id: 1 } as const,
      refreshScene,
    };

    expect(() => createNewLevel(context as never)).not.toThrow();
    expect(() => setLevelConfig(context as never, getDefaultLevelConfig())).not.toThrow();
    expect(() => importLevelConfig(context as never, JSON.stringify(getDefaultLevelConfig()))).not.toThrow();
    expect(refreshScene).toHaveBeenCalledTimes(3);
  });
});
