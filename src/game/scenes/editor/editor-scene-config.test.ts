import { importLevelConfig } from "./editor-scene-config";
import { getDefaultLevelConfig } from "../../types/level-config";

describe("editor-scene-config", () => {
  it("imports config without depending on removed view-mode state", () => {
    const refreshScene = vi.fn();
    const context = {
      levelConfigManager: {
        importJSON: vi.fn(() => true),
      },
      selectedObject: { kind: "player", id: 1 } as const,
      refreshScene,
    };

    expect(() => importLevelConfig(context as never, JSON.stringify(getDefaultLevelConfig()))).not.toThrow();
    expect(refreshScene).toHaveBeenCalledTimes(1);
  });
});
