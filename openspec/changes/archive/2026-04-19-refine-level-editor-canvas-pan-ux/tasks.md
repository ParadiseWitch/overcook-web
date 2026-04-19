## 1. Refine pan interaction feedback

- [x] 1.1 为关卡编辑器 scene 增加平移相关的 cursor 状态切换，覆盖默认、可抓取和抓取中三种状态。
- [x] 1.2 确保按下 `Space`、按下左键、释放左键、释放 `Space` 四个阶段的 cursor 切换符合交互预期。

## 2. Fix pan boundary consistency across zoom levels

- [x] 2.1 调整 editor camera 的边界计算方式，使其显式基于当前缩放后的可见世界范围。
- [x] 2.2 修正缩放后平移边界不一致的问题，并确保与现有滚轮缩放和平移逻辑兼容。

## 3. Verify pan UX and boundary behavior

- [x] 3.1 增加聚焦测试，覆盖多个 zoom 级别下的边界计算结果以及平移 cursor 状态切换。
- [x] 3.2 手动验证平移过程中 cursor 状态变化，以及不同缩放级别下的边界一致性。
