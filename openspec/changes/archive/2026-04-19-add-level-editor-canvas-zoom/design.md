## Context

当前关卡编辑器已经具备两类基础画布导航能力：相机边界约束，以及按住 `Space` 后拖拽画布进行平移。现阶段的导航交互仍然缺少缩放，这意味着用户在查看大地图全貌和精细调整局部布局之间只能依赖拖拽移动，效率较低。

现有 editor runtime 已经把相机规则拆到 `level-editor-camera` 与 `level-editor-camera-pan` 等模块中，因此滚轮缩放应继续沿用同一条相机控制边界：缩放本身由相机负责，scene 只负责接线鼠标滚轮输入，并在缩放后继续复用现有的边界约束与平移行为。

## Goals / Non-Goals

**Goals:**
- 为关卡编辑器增加基于鼠标滚轮的画布缩放能力。
- 为 editor camera 增加最小/最大缩放边界，避免异常视图。
- 保持缩放后的画布仍然符合现有平移与边界约束规则。
- 将滚轮缩放纳入现有 `level-editor-canvas-navigation` 能力定义。

**Non-Goals:**
- 不包含双击缩放、缩放预设按钮、触控板手势缩放或小地图缩放控件。
- 不改变关卡数据结构，也不持久化编辑器缩放级别。
- 不重新设计平移交互或 Vue 编辑器面板。

## Decisions

### Use mouse wheel to control camera zoom directly
滚轮输入会直接映射到 Phaser camera 的 zoom 值，而不是通过重新计算 tile 尺寸或重建地图对象来“模拟”缩放。这样可以保持渲染、命中检测和平移行为都围绕同一个相机模型工作。

Alternative considered:
- 通过修改 tile 大小模拟画布缩放。放弃原因是这会让渲染尺寸、世界坐标和相机逻辑产生双重状态，后续维护成本更高。

### Clamp zoom level with explicit editor limits
缩放会被限制在 editor 定义的最小值和最大值之间，避免用户无限放大或缩小到不可用状态。缩放后的相机位置会继续走现有的 camera clamp 逻辑，以确保地图边界行为稳定。

Alternative considered:
- 不设缩放边界，完全依赖 Phaser 默认行为。放弃原因是会导致编辑器容易进入不可读或难以恢复的视图状态。

### Keep wheel zoom in the existing navigation capability
滚轮缩放不会新建独立 capability，而是作为 `level-editor-canvas-navigation` 的自然扩展。因为从用户视角看，拖拽平移和滚轮缩放都属于同一组画布导航交互，拆成多个主 specs 反而会割裂语义。

Alternative considered:
- 新建单独的 `level-editor-canvas-zoom` capability。放弃原因是它和已有导航能力强耦合，会让主规格被人为拆散。

## Risks / Trade-offs

- [缩放后相机边界可能出现跳动] → 在缩放更新后立即复用现有 camera clamp 规则，保证视图回到合法范围。
- [滚轮缩放过快或过慢会影响手感] → 将滚轮步进抽成明确的缩放增量，便于后续调参和测试。
- [缩放与现有平移手势叠加后可能产生交互混乱] → 保持滚轮缩放与 `Space + drag` 平移互不改变激活规则，只共享相机状态。

## Migration Plan

1. 在 editor camera 模块中增加缩放边界和缩放值计算辅助逻辑。
2. 在 level editor scene 中接入鼠标滚轮事件并更新 camera zoom。
3. 在缩放后继续执行相机位置钳制，保证缩放后的边界行为稳定。
4. 补充聚焦测试，覆盖缩放步进与缩放边界。

回滚策略：整体回退本次 change 即可，不涉及数据迁移或持久化状态。

## Open Questions

- 当前无需新增开放问题；滚轮缩放的范围和交互方式已经足够明确。
