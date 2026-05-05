## 1. Resize 信号与生命周期

- [x] 1.1 在 `LevelEditor.vue` 中添加基于容器尺寸的 resize 观察
- [x] 1.2 忽略宽度或高度小于等于零的容器尺寸
- [x] 1.3 在应用编辑器更新前合并连续的 resize 通知
- [x] 1.4 在组件卸载时清理 observer 和待执行的 animation frame

## 2. 相机 Resize 规则

- [x] 2.1 提取 helper，用于在 viewport resize 前后保留相机中心点和缩放级别
- [x] 2.2 基于当前 viewport 尺寸和稳定的 navigation bounds 重新计算最小缩放级别
- [x] 2.3 使用更新后的可见世界范围，在 resize 后限制相机中心点
- [x] 2.4 添加单元测试，覆盖合法 resize、最小缩放提升和中心点 clamp 场景

## 3. 场景集成

- [x] 3.1 为 `LevelEditorScene` 添加接收新 viewport 尺寸的 resize 入口
- [x] 3.2 在应用相机约束前先 resize Phaser scale 或 game canvas
- [x] 3.3 保持现有平移、滚轮缩放和 reset camera 行为与 resize 后的 viewport 兼容
- [x] 3.4 添加回归覆盖，验证 viewport resize 后的平移和缩放边界

## 4. 面板可见性

- [x] 4.1 当 viewport 尺寸变化时限制浮动面板位置
- [x] 4.2 根据当前 viewport 限制恢复后的浮动面板位置
- [x] 4.3 在 resize 过程中保留 docked panel 状态和已保存的布局偏好
- [x] 4.4 添加布局测试，覆盖更小 viewport 和恢复离屏面板位置的场景

## 5. 验证

- [x] 5.1 运行 `pnpm test -- src/game/editor/test/level-editor-camera.test.ts`
- [x] 5.2 运行 `pnpm test -- src/game/editor/test/editor-layout.test.ts`
- [x] 5.3 运行 `pnpm test`
- [x] 5.4 手动验证 `/editor`：执行平移、缩放和浏览器窗口 resize，确认 canvas 填满编辑器，同时相机上下文和面板仍可用
