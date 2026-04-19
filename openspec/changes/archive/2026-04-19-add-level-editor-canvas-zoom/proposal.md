## Why

当前关卡编辑器已经支持按住 `Space` 拖拽画布，但用户仍然无法通过鼠标滚轮快速放大或缩小画布视图。在地图较大或需要精细调整局部布局时，缺少缩放能力会显著降低编辑效率，也让现有画布导航能力不完整。

## What Changes

- 为关卡编辑器增加基于鼠标滚轮的画布缩放能力。
- 为编辑器相机增加缩放边界规则，避免出现过度放大或过度缩小导致的异常视图。
- 在缩放发生时保持当前画布导航行为一致，使缩放后的平移和边界约束仍然成立。
- 更新现有编辑器画布导航规格，将滚轮缩放纳入同一能力定义。

## Capabilities

### New Capabilities

### Modified Capabilities
- `level-editor-canvas-navigation`: 扩展编辑器画布导航能力，增加滚轮缩放以及相应的缩放边界和交互约束。

## Impact

- 影响 Phaser 版关卡编辑器运行时代码，尤其是 editor scene 与 camera 相关模块。
- 需要扩展现有 editor camera 测试，覆盖缩放边界与缩放后导航行为。
- 不涉及关卡数据结构、存档格式或 gameplay runtime 的行为变化。
