## Why

关卡编辑器目前只在初始化时读取窗口尺寸，浏览器窗口或编辑器容器尺寸变化后，Phaser canvas、相机可见范围和浮动面板位置不会随之协调更新。这会导致画布尺寸失真、相机边界与实际视口不一致，以及面板在小窗口中不可见。

这次变更需要让编辑器在窗口缩放、容器尺寸变化和设备方向变化时保持连续、可预测的编辑体验。

## What Changes

- 编辑器 SHALL 监听编辑区域尺寸变化，并将 Phaser canvas resize 到当前容器尺寸。
- 编辑器 SHALL 在 resize 后保持当前相机关注点和缩放级别，必要时重新 clamp 到合法导航边界。
- 编辑器 SHALL 基于新的 viewport 重新计算最小缩放级别，避免 resize 后暴露无效区域或出现边界漂移。
- 编辑器 SHALL 在窗口变小时重新限制浮动面板位置，确保面板仍可被用户找回和操作。
- 编辑器 SHALL 合并连续 resize 更新，避免 resize 过程中频繁重算造成明显抖动。

## Capabilities

### New Capabilities
- `level-editor-responsive-viewport`: 定义关卡编辑器在窗口或容器尺寸变化时的 canvas resize、相机连续性和面板可见性行为。

### Modified Capabilities
- `level-editor-canvas-navigation`: 调整画布导航需求，使平移和滚轮缩放边界在 viewport resize 后继续基于当前可见范围保持一致。

## Impact

- Affected code:
  - `src/components/LevelEditor.vue`
  - `src/game/editor/level-editor-scene.ts`
  - `src/game/editor/level-editor-camera.ts`
  - `src/game/editor/editor-layout.ts`
  - Existing editor camera and layout tests under `src/game/editor/test/`
- No public API or persisted level format changes are expected.
- Existing local layout persistence may need migration-free clamping when restored into a smaller viewport.
