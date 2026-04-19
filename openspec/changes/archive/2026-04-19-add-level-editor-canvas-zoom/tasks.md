## 1. Extend editor camera zoom rules

- [x] 1.1 为 editor camera 增加缩放步进和最小/最大缩放边界的辅助逻辑。
- [x] 1.2 为缩放后的相机位置补充或复用边界钳制逻辑，确保缩放后视图仍合法。

## 2. Wire wheel zoom into the editor scene

- [x] 2.1 在关卡编辑器 scene 中接入鼠标滚轮事件，并将滚轮输入映射到 camera zoom 更新。
- [x] 2.2 确保滚轮缩放与现有 `Space + drag` 平移交互兼容，不改变既有平移激活规则。

## 3. Verify zoom behavior

- [x] 3.1 增加聚焦测试，覆盖缩放步进、最大/最小缩放边界和缩放后相机合法性。
- [x] 3.2 手动验证编辑器中滚轮放大、缩小、缩放边界以及缩放后的拖拽平移行为。
