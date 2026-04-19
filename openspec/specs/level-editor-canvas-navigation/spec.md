# level-editor-canvas-navigation Specification

## Purpose
TBD - created by archiving change add-level-editor-canvas-pan. Update Purpose after archive.
## Requirements
### Requirement: 编辑器画布支持临时拖拽平移
关卡编辑器在用户按住 `Space` 并在编辑器画布上拖拽指针时，SHALL 允许用户移动当前可见画布区域。

#### Scenario: 按住空格后开始拖拽平移
- **WHEN** 用户按住 `Space`，在编辑器画布上按下指针并开始拖拽
- **THEN** 编辑器视口会跟随这次拖拽手势移动，而不是保持固定

#### Scenario: 未按修饰键时保持正常指针交互
- **WHEN** 用户在未按住 `Space` 的情况下与编辑器画布交互
- **THEN** 编辑器 SHALL 保持原有的非平移指针交互行为

### Requirement: 编辑器相机移动受地图边界约束
关卡编辑器在画布平移过程中，SHALL 将相机移动限制在合法的地图范围内。

#### Scenario: 大地图边界处停止继续拖出
- **WHEN** 用户在一张大于当前视口的地图上向任意边缘方向平移
- **THEN** 编辑器相机会停在最近的合法边界处，并且 SHALL NOT 暴露地图外的无效空间

#### Scenario: 小地图保持居中
- **WHEN** 地图尺寸小于当前视口
- **THEN** 编辑器相机会保持在地图中心，并且 SHALL NOT 因为平移尝试而发生漂移

### Requirement: 平移手势会抑制选择类交互
关卡编辑器在识别到一次有效的 `Space` 修饰拖拽时，SHALL 将其视为画布导航，而不是对象选择操作。

#### Scenario: 平移拖拽不会触发选择
- **WHEN** 用户按住 `Space` 执行一次有效的画布平移手势
- **THEN** 编辑器 SHALL 在这次拖拽会话中抑制选择类指针处理

#### Scenario: 结束平移后恢复正常交互
- **WHEN** 用户释放指针或不再按住 `Space`
- **THEN** 编辑器会在后续指针输入中恢复正常的非平移交互行为

