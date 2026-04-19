## Context

当前关卡编辑器使用 Phaser 场景承载画布，已经具备地图尺寸、相机初始化和基础格子渲染能力，但画布导航仍停留在静态视角。现有编辑器运行时代码分散在 `src/game/scenes/editor` 与 `src/game/editor` 两处，职责命名也不统一：场景编排、相机边界、渲染辅助混在不同目录和不同粒度的命名下。对这样一套结构直接叠加 `Space + drag` 输入状态机会让后续的点击选择、缩放、框选等交互更难继续演进。

这个变更需要同时解决两个问题：为用户补上常见的画布平移能力，以及在实现该能力前收敛编辑器运行时代码的边界，让相机控制可以成为一个独立的 editor 模块职责。

## Goals / Non-Goals

**Goals:**
- 为关卡编辑器增加按住 `Space` 并拖拽指针时的临时画布平移能力。
- 将相机移动限制在合法地图区域内，并在地图小于视口时保持稳定行为。
- 在平移修饰键未激活时保留原有的格子或对象交互行为。
- 将编辑器运行时文件收拢到统一的 editor 领域目录下，并通过重命名明确 `scene`、`renderer`、`camera` 的职责边界。

**Non-Goals:**
- 不包含滚轮缩放、中键平移、小地图导航或多选工具。
- 不修改关卡数据格式、保存行为或 gameplay scene 的相机行为。
- 不重新设计 Vue 编辑器面板，也不处理关卡编辑器运行时之外的更大范围目录重构。

## Decisions

### Use Phaser camera movement rather than moving rendered objects
编辑器当前已经将 `cameras.main` 视为真实视口，因此画布平移将直接更新相机位置，而不是去平移渲染出来的格子对象，或额外维护一套并行的 viewport offset 状态。这样可以让世界坐标、命中测试和后续缩放行为继续与 Phaser 语义保持一致。

Alternative considered:
- 在拖拽时移动或整体偏移所有编辑器渲染对象。放弃原因是它会复制一套视口状态、让命中测试更复杂，并提高后续相机特性的实现成本。

### Separate camera utilities from scene orchestration
`scene` 仍然作为组合根节点，负责接线输入、渲染生命周期和相机初始化；但相机相关规则会被拆到 editor 专用的 camera 模块里。一个模块负责相机边界和居中规则，另一个模块负责拖拽平移的计算与临时交互状态转换。这样可以避免 `scene` 演变成一个包揽所有输入逻辑的大文件。

Alternative considered:
- 把所有新逻辑都直接塞进 `LevelEditorScene`。放弃原因是虽然实现会更快，但会让未来的选择、拖拽和缩放交互进一步耦合在一起。

### Reorganize level editor runtime paths before attaching the new behavior
编辑器运行时模块会先被收拢到统一的 editor 领域路径下，并使用更清晰的命名来表达 `scene`、`renderer` 和 `camera` 等职责。之所以把重命名放进同一个 change，是因为新交互会直接触碰这些边界；如果延后清理，就意味着要在已经确认有误导性的命名之上继续叠加新功能。

Alternative considered:
- 先交付画布平移，再延后处理重命名。放弃原因是这会让同一批文件被马上再改一轮，也会让首次平移实现的评审边界更模糊。

### Treat `Space` as a temporary pan modifier that suppresses selection-style input
画布平移只会在按住 `Space` 并且用户在画布上拖拽指针时激活。在平移进行中的这次拖拽会话里，选择类的指针处理会被抑制；当修饰键释放或拖拽结束后，编辑器恢复到正常交互状态。

Alternative considered:
- 添加一个持久化的“平移模式”切换开关。放弃原因是它不符合常见编辑器的交互习惯，也会引入这次需求并未要求的额外 UI 状态。

## Risks / Trade-offs

- [地图小于视口时，相机 clamp 逻辑可能失效] → 明确定义小地图的居中行为，而不是隐含假设 `min <= max`。
- [路径和文件重命名可能打断 import 或测试] → 将重命名严格限制在本次 change 触及的 editor 运行时模块内，并在同一个 patch 中同步更新 import 和测试。
- [指针拖拽行为可能与未来的格子选择冲突] → 隔离平移激活规则，让后续选择逻辑只依赖一个统一的 “is panning” 状态，而不是复制手势判断。
- [同一个 change 同时包含重构和功能会放大评审面] → 将重命名范围收窄到 `scene`、`camera`、`renderer` 边界，不夹带无关的 editor 清理工作。

## Migration Plan

1. Move or rename the current editor runtime modules into their editor-focused structure.
2. Update imports and tests to follow the new names.
3. Introduce editor camera boundary and pan calculation helpers.
4. Wire `Space + drag` input into the editor scene.
5. Verify editor navigation behavior manually and with focused tests for camera clamp and pan calculations.

回滚策略：将本次 change 作为一个整体回退即可，不涉及持久化数据或 schema 迁移。

## Open Questions

- 现阶段没有额外开放问题。画布平移的交互方式与范围已经足够明确，可以进入实现阶段。
