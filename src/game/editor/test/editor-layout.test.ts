/**
 * 测试对象：editor-layout 辅助函数。
 * 测试用例：默认布局恢复、吸附顺序、展开面板选择和浮动位置钳制。
 * 测试目标：保护面板布局持久化和视口归一化规则。
 * 期望：布局辅助函数能把吸附面板和浮动面板稳定约束在可预期范围内。
 */
import {
  DEFAULT_PANEL_SPECS,
  clampFloatingPosition,
  createDefaultEditorLayout,
  dockPanel,
  getExpandedDockPanel,
  getNextDockOrder,
  restoreEditorLayout,
} from "../editor-layout";

describe("editor-layout", () => {
  it("creates the expected default docked layout", () => {
    const layout = createDefaultEditorLayout();

    expect(layout["basic-settings"]).toMatchObject({
      dockedEdge: "left",
      minimized: false,
      size: DEFAULT_PANEL_SPECS["basic-settings"].size,
    });
    expect(layout["properties"]).toMatchObject({
      dockedEdge: "right",
      minimized: false,
      size: DEFAULT_PANEL_SPECS.properties.size,
    });
  });

  it("docks a panel to the nearest edge and clears floating coordinates", () => {
    const next = dockPanel(
      createDefaultEditorLayout(),
      "toolbox",
      "right",
      2,
    );

    expect(next.toolbox).toMatchObject({
      dockedEdge: "right",
      dockOrder: 2,
      position: null,
    });
  });

  it("clamps floating positions into the viewport", () => {
    expect(
      clampFloatingPosition(
        { x: -30, y: 9999 },
        { width: 320, height: 420 },
        { width: 1440, height: 900 },
      ),
    ).toEqual({
      x: 0,
      y: 480,
    });
  });

  it("restores persisted layout while dropping unknown panels", () => {
    const restored = restoreEditorLayout({
      "basic-settings": {
        dockedEdge: "left",
        dockOrder: 0,
        minimized: true,
        position: null,
        size: { width: 320, height: 260 },
        zIndex: 7,
      },
      ghost: {
        dockedEdge: null,
        dockOrder: 0,
        minimized: false,
        position: { x: 100, y: 100 },
        size: { width: 1, height: 1 },
        zIndex: 1,
      },
    });

    expect(restored["basic-settings"].minimized).toBe(true);
    expect("ghost" in restored).toBe(false);
  });

  it("preserves dock order when a docked panel collapses or expands", () => {
    const layout = createDefaultEditorLayout();

    expect(getNextDockOrder(layout, "toolbox", "left")).toBe(
      layout.toolbox.dockOrder,
    );
  });

  it("prefers the top-most expanded docked panel in compact mode", () => {
    const layout = createDefaultEditorLayout();
    layout.toolbox.minimized = true;
    layout.validation.minimized = false;
    layout.validation.zIndex = 99;

    expect(getExpandedDockPanel(layout)).toBe("validation");
  });
});
