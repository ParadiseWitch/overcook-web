import { reactive, ref } from "vue";

import { createPanelLayoutController } from "../useEditorPanelLayout";
import type { EditorPanelId } from "@/game/editor/editor-layout";

/**
 * 测试对象：createPanelLayoutController。
 * 测试用例：在紧凑视口下展开一个已最小化的吸附面板。
 * 测试目标：验证同一吸附边仅保留一个展开面板的布局规则。
 * 期望：当前面板恢复展开，原本展开的同边面板被最小化。
 */
const panelEntries: Array<{ id: EditorPanelId; title: string }> = [
  { id: "basic-settings", title: "Basic" },
  { id: "score-target", title: "Score" },
  { id: "toolbox", title: "Tools" },
  { id: "order-pool", title: "Orders" },
  { id: "validation", title: "Validation" },
  { id: "properties", title: "Properties" },
];

describe("useEditorPanelLayout", () => {
  it("minimizes sibling docked panels when expanding one in compact view", () => {
    const sceneRef = ref({
      setInteractionBlocked: vi.fn(),
    });
    const viewport = reactive({ width: 900, height: 700 });
    const controller = createPanelLayoutController({
      panelEntries,
      viewport,
      sceneRef,
    });

    controller.panelLayouts.toolbox.dockedEdge = "left";
    controller.panelLayouts.toolbox.minimized = true;
    controller.panelLayouts.validation.dockedEdge = "left";
    controller.panelLayouts.validation.minimized = false;

    controller.togglePanelMinimize("toolbox");

    expect(controller.panelLayouts.toolbox.minimized).toBe(false);
    expect(controller.panelLayouts.validation.minimized).toBe(true);
  });
});
