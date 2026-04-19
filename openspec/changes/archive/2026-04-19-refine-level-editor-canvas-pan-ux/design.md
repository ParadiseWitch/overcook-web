## Context

当前关卡编辑器已经支持两类基础画布导航交互：按住 `Space` 拖拽平移，以及滚轮缩放。现有实现主要解决了功能存在性，但还缺少两类重要的交互收口：一是平移过程中没有明确的光标状态反馈，用户难以判断自己处于“可抓取”还是“正在拖拽”；二是平移边界在不同缩放级别下表现不一致，说明相机边界计算与缩放后的可见世界尺寸之间还没有完全对齐。

从现有实现看，边界问题最可能来自于相机可见范围的计算方式与缩放级别耦合不稳定：如果边界钳制使用的宽高并不总是精确代表“当前 zoom 下真实可见的世界范围”，那么每个缩放级别下得到的最小/最大中心点就会漂移，最终表现为平移边界不一致。

## Goals / Non-Goals

**Goals:**
- 为关卡编辑器平移交互增加明确的光标状态反馈。
- 修正缩放场景下的平移边界一致性问题，使各个 zoom 级别下的边界规则统一。
- 保持现有 `Space + drag` 平移激活方式不变。
- 将光标状态与边界一致性纳入现有 `level-editor-canvas-navigation` 能力。

**Non-Goals:**
- 不重新设计拖拽平移手势本身，也不引入新的平移快捷键。
- 不修改关卡数据结构、持久化格式或 gameplay runtime 相机行为。
- 不新增复杂的自定义鼠标资源系统；优先复用标准 cursor 状态。

## Decisions

### Use cursor states to expose pan interaction mode
按住 `Space` 进入可平移状态时，画布 cursor 会切换为“手掌张开”语义；按下鼠标左键并进入实际拖拽时，cursor 会切换为“抓取中/拳头”语义；释放鼠标后回到可抓取状态；释放 `Space` 后恢复默认鼠标。这样可以让平移状态通过系统级视觉反馈即时可见，而不需要额外 UI 提示。

Alternative considered:
- 不改 cursor，只保留现有交互。放弃原因是状态不可见，会让平移功能显得“能用但不明确”。

### Compute camera clamp against zoom-adjusted visible world span
边界计算需要显式基于当前缩放下的可见世界范围进行，而不是依赖语义不够稳定的显示尺寸属性。更稳妥的做法是以 camera viewport 尺寸和当前 zoom 推导“半可见宽高”，然后据此得到合法的中心点区间。这样在每个缩放级别下，边界规则都由同一公式导出。

Alternative considered:
- 继续沿用当前现成属性直接做边界钳制。放弃原因是这正是边界不一致的可疑来源，无法保证各个 zoom 下表现统一。

### Keep pan UX refinement and boundary bugfix in one change
光标反馈和边界一致性都属于平移体验的一部分，且都会落在 editor scene / camera 的同一组模块里，因此合并到一个 change 中实现更利于评审与回归。

Alternative considered:
- 把 UX 优化和边界 bugfix 拆成两个 change。放弃原因是它们共享相同上下文和验证面，拆开反而增加重复成本。

## Risks / Trade-offs

- [不同浏览器对 cursor 样式支持不完全一致] → 优先使用标准 cursor 语义，例如 `grab` / `grabbing`，避免依赖自定义图片资源。
- [修改边界计算后可能影响现有缩放和平移手感] → 用聚焦测试覆盖多个 zoom 级别下的边界结果，并结合手工回归确认。
- [scene 中输入状态进一步增多] → 将 cursor 状态切换和边界计算尽量保持在独立 helper 或清晰的 scene 方法内，避免扩散到 renderer。

## Migration Plan

1. 为 editor camera 增加基于缩放后可见世界范围的边界计算。
2. 在 level editor scene 中增加平移光标状态管理。
3. 用聚焦测试覆盖多个 zoom 级别下的边界结果与 cursor 状态切换。
4. 手动验证按键、按鼠标、释放鼠标、释放 `Space` 四个阶段的 cursor 变化，以及不同缩放级别下的边界一致性。

回滚策略：整体回退本次 change 即可，不涉及持久化数据或迁移。

## Open Questions

- 当前无需新增开放问题；边界修复和光标反馈的目标已经足够明确。
