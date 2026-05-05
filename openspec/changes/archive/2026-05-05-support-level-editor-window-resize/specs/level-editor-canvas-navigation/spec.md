## MODIFIED Requirements

### Requirement: 平移边界在各个缩放级别下保持一致规则
关卡编辑器在不同缩放级别和不同 viewport 尺寸下处理画布平移时，SHALL 基于当前缩放后的可见世界范围应用一致的边界约束。

#### Scenario: 不同缩放级别下都以同一边界规则钳制相机
- **WHEN** 用户在不同缩放级别下将画布拖向同一地图边缘
- **THEN** 编辑器 SHALL 按同一套基于当前可见范围的边界规则限制相机位置

#### Scenario: 缩放后平移边界不会异常漂移
- **WHEN** 用户先缩放画布，再执行平移
- **THEN** 编辑器 SHALL 让平移边界与缩放后的可见区域保持一致，而不会出现边界突变或明显漂移

#### Scenario: Resize 后平移边界使用新的 viewport
- **WHEN** 编辑器 viewport resize 后，用户继续执行画布平移
- **THEN** 编辑器 SHALL 基于 resize 后的 viewport 尺寸和当前缩放级别限制相机位置

### Requirement: 编辑器缩放级别受边界约束
关卡编辑器在处理滚轮缩放或 viewport resize 时，SHALL 将缩放级别限制在定义好的最小值与最大值之间，并在缩放后保持相机视图合法。最小缩放级别 SHALL 基于当前 viewport 尺寸和编辑器导航边界动态计算。

#### Scenario: 达到最大缩放后不再继续放大
- **WHEN** 用户持续滚动鼠标滚轮尝试超过最大缩放级别
- **THEN** 编辑器 SHALL 将缩放限制在最大值，且不会继续放大

#### Scenario: 达到最小缩放后不再继续缩小
- **WHEN** 用户持续滚动鼠标滚轮尝试低于最小缩放级别
- **THEN** 编辑器 SHALL 将缩放限制在最小值，且不会继续缩小

#### Scenario: 缩放后仍然保持合法视图
- **WHEN** 用户执行一次滚轮缩放
- **THEN** 编辑器 SHALL 在缩放后继续满足现有的画布导航边界约束

#### Scenario: Resize 后缩放下限重新计算
- **WHEN** 编辑器 viewport resize 改变当前可见范围
- **THEN** 编辑器 SHALL 基于新的 viewport 尺寸重新计算最小缩放级别

#### Scenario: Resize 后当前缩放低于新的缩放下限
- **WHEN** 编辑器 viewport resize 后，当前缩放级别低于新的最小缩放级别
- **THEN** 编辑器 SHALL 将当前缩放级别提升到新的最小缩放级别
