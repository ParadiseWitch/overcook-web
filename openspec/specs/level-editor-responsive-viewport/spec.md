# level-editor-responsive-viewport Specification

## Purpose
TBD - created by archiving change support-level-editor-window-resize. Update Purpose after archive.
## Requirements
### Requirement: 编辑器画布跟随容器尺寸变化
关卡编辑器在编辑器根容器尺寸变化时，SHALL 将 Phaser canvas 和内部游戏尺寸更新为当前容器的有效尺寸。

#### Scenario: 容器尺寸变大
- **WHEN** 编辑器容器宽度或高度变大
- **THEN** 编辑器 SHALL 将 Phaser canvas 的渲染尺寸更新为新的容器尺寸

#### Scenario: 容器尺寸变小
- **WHEN** 编辑器容器宽度或高度变小
- **THEN** 编辑器 SHALL 将 Phaser canvas 的渲染尺寸更新为新的容器尺寸

#### Scenario: 容器尺寸暂时无效
- **WHEN** 编辑器容器报告的宽度或高度小于等于零
- **THEN** 编辑器 SHALL 忽略该次 resize 更新，并保持最近一次有效画布尺寸

### Requirement: Resize 后保持相机编辑上下文
关卡编辑器在 viewport resize 后，SHALL 尽量保留用户当前相机中心点和缩放级别，并在必要时将其调整到合法范围内。

#### Scenario: 当前相机状态在新 viewport 中仍合法
- **WHEN** 编辑器 viewport 发生 resize，且当前相机中心点和缩放级别在新 viewport 中仍合法
- **THEN** 编辑器 SHALL 保持当前相机中心点和缩放级别不变

#### Scenario: 当前缩放低于新的最小缩放
- **WHEN** 编辑器 viewport 变大导致当前缩放级别低于新的最小缩放级别
- **THEN** 编辑器 SHALL 将缩放级别提升到新的最小缩放级别，并保持相机中心点在合法范围内

#### Scenario: 当前中心点超出新的合法范围
- **WHEN** 编辑器 viewport resize 后当前相机中心点超出合法导航范围
- **THEN** 编辑器 SHALL 将相机中心点限制到最近的合法位置

### Requirement: Resize 后保持浮动面板可见
关卡编辑器在 viewport resize 或恢复持久化布局时，SHALL 确保浮动面板的位置不会完全离开当前可见 viewport。

#### Scenario: 窗口变小后浮动面板超出右侧边界
- **WHEN** 编辑器 viewport 变小，且某个浮动面板的位置超出新的右侧可见边界
- **THEN** 编辑器 SHALL 将该面板位置限制到新的可见范围内

#### Scenario: 窗口变小后浮动面板超出底部边界
- **WHEN** 编辑器 viewport 变小，且某个浮动面板的位置超出新的底部可见边界
- **THEN** 编辑器 SHALL 将该面板位置限制到新的可见范围内

#### Scenario: 恢复布局时位置不适合当前 viewport
- **WHEN** 编辑器从本地存储恢复浮动面板位置，且该位置不适合当前 viewport
- **THEN** 编辑器 SHALL 对恢复后的位置执行可见范围限制，而不是丢弃整个布局配置

### Requirement: Resize 更新会被合并处理
关卡编辑器在短时间内收到连续 resize 通知时，SHALL 合并处理这些更新，以避免重复重算和明显视觉抖动。

#### Scenario: 浏览器窗口被连续拖拽调整
- **WHEN** 编辑器在同一渲染帧附近收到多次 resize 通知
- **THEN** 编辑器 SHALL 只基于最后一次有效尺寸执行一次画布和相机更新

#### Scenario: 合并后仍使用最新尺寸
- **WHEN** 多次 resize 通知被合并处理
- **THEN** 编辑器 SHALL 使用最后一次有效容器尺寸作为更新目标

