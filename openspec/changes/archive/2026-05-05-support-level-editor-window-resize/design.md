## Context

关卡编辑器当前由 `LevelEditor.vue` 在 mount 时创建 Phaser game，并使用初始化时的窗口宽高作为 canvas 尺寸。`LevelEditorScene` 在 `create()` 阶段基于初始 viewport 和默认 zoom 生成 `canvasBounds`，之后平移、滚轮缩放和 reset camera 都依赖这份边界。

这种模型在固定窗口下工作正常，但当浏览器窗口、编辑器根容器或设备方向发生变化时，Phaser canvas 尺寸、camera viewport、最小 zoom 和浮动面板位置不会同步更新。结果是用户看到的编辑区域和内部相机约束可能分离。

## Goals / Non-Goals

**Goals:**

- 让编辑器 canvas 始终匹配当前编辑器容器尺寸。
- 在 resize 后保持用户当前相机关注点，避免无意义地重置视角。
- 让 zoom 下限和平移 clamp 基于最新 viewport 重新计算。
- 保证浮动面板在窗口变小或布局恢复后仍处于可见区域。
- 将 resize 处理拆成可单测的相机和布局辅助逻辑。

**Non-Goals:**

- 不改变关卡数据结构或持久化格式。
- 不重做编辑器 UI 布局系统。
- 不引入新的响应式 UI 框架或外部依赖。
- 不改变现有 `Space` 拖拽平移和滚轮缩放的用户手势。

## Decisions

### Decision 1: Use the editor container as the source of truth

Resize 应以 `LevelEditor.vue` 中的编辑器容器尺寸为准，而不是直接使用 `window.innerWidth` 和 `window.innerHeight`。这样编辑器未来被嵌入不同布局时，canvas 仍能匹配实际可用区域。

Alternative considered: listening only to `window.resize`. 这更简单，但会把全局窗口尺寸和编辑器实际尺寸绑定在一起，无法处理父容器变化、侧栏变化或未来嵌入式编辑场景。

### Decision 2: Keep navigation bounds stable, update viewport-dependent math

现有 `canvasBounds` 本质上表示编辑器允许导航的世界范围，不应该在每次 resize 时重新从当前 viewport 推导，否则用户放大、平移后 resize 会改变可导航区域。实现时应将它语义化为稳定的 navigation bounds，并在 resize 后只重新计算 camera viewport、min zoom 和 clamp 结果。

Alternative considered: rebuild bounds from the new viewport on every resize. 这能让新窗口完全 fit，但会让导航边界随窗口漂移，破坏当前平移和缩放规则的一致性。

### Decision 3: Preserve camera center and zoom unless they become invalid

Resize 前记录当前 camera center 和 zoom。Resize 后优先恢复 zoom；如果新的 viewport 要求更高的 min zoom，则提升到 min zoom；最后根据 navigation bounds clamp center。这样用户关注的地图区域最大程度保持稳定，同时不会暴露无效空间。

Alternative considered: always reset camera after resize. 这实现简单，但会打断用户正在编辑的上下文，尤其是在大地图或放大编辑局部区域时体验很差。

### Decision 4: Keep layout recovery conservative

浮动面板 resize 后只做可见性 clamp，不自动改 dock 方向、不重排用户保存的布局。这样可以避免窗口临时变小后破坏用户布局偏好。更强的窄屏布局策略可以后续作为独立 UI 改进。

Alternative considered: auto-collapse or auto-redock panels on narrow screens. 这可能提升小屏可用性，但会引入更多状态和恢复规则，不适合作为本次 resize 基础能力的第一步。

### Decision 5: Coalesce resize work

Resize 事件应通过 `ResizeObserver` 加上 animation-frame 级别合并触发，避免浏览器拖动窗口时反复同步重算和重绘。对测试来说，核心逻辑应提取为纯函数或场景方法，事件合并只做薄封装。

Alternative considered: direct synchronous resize handling. 这更直接，但窗口拖拽过程中会产生较高频率的 resize 回调，容易造成视觉抖动和多余渲染。

## Risks / Trade-offs

- [Risk] Phaser scale resize 与 camera resize 顺序不当可能导致短暂的错误 clamp。→ Mitigation: 在场景 resize 入口中按 canvas resize、camera viewport 更新、zoom clamp、center clamp 的顺序处理，并用 helper tests 固化顺序后的结果。
- [Risk] 当前 `canvasBounds` 命名容易让实现者误以为 resize 后要重建。→ Mitigation: 在实现中引入更准确的 helper 命名，例如 `navigationBounds`，并保持外部行为不变。
- [Risk] 面板可见性只做 clamp，不能完全解决极窄窗口下的拥挤问题。→ Mitigation: 本次只保证可找回和可操作，将自动折叠或小屏布局作为后续能力。
- [Risk] `ResizeObserver` 在容器尺寸为零时可能触发无效 resize。→ Mitigation: 忽略非正数尺寸，并在下一次有效尺寸回调时继续更新。

## Migration Plan

不需要数据迁移。部署后已有本地布局配置可以继续读取；恢复布局或窗口缩小时，对浮动面板位置做 migration-free clamp。

Rollback 只需要移除 resize 监听和场景 resize 入口，已有平移、滚轮缩放与布局持久化行为应保持可回退。

## Open Questions

- 是否需要在后续 change 中定义窄屏自动折叠或底部抽屉布局。
- 是否需要为移动端触控缩放和方向变化提供专门交互，而不是仅复用窗口 resize 行为。
