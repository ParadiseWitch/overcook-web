## Why

当前关卡编辑器已经有基础的网格渲染和相机初始化，但缺少常见的画布导航能力：用户无法按住 `Space` 并拖拽鼠标来快速查看大地图。与此同时，编辑器运行时代码分散在 `src/game/scenes/editor` 和 `src/game/editor` 两处，命名也混用了 `scene`、`render`、`helper` 等不同粒度，继续在现状上叠加交互逻辑会放大维护成本。

## What Changes

- 为关卡编辑器增加画布平移能力：按住 `Space` 时，在画布上拖拽鼠标会移动编辑器视口。
- 将编辑器相机移动限制在合法地图边界内，避免平移时暴露地图外的无效空间。
- 在未按住 `Space` 时保持原有的格子或对象交互行为；在画布平移进行中抑制选择类交互。
- 将关卡编辑器运行时代码收拢到统一的 editor 领域目录下，并明确 `scene`、`camera`、`renderer` 等职责对应的路径和文件命名。
- 在接入新交互逻辑之前，先重命名编辑器运行时模块，使相机控制和渲染职责表达更清晰。

## Capabilities

### New Capabilities
- `level-editor-canvas-navigation`: 关卡编辑器的画布导航行为，包括按住 `Space` 时的临时拖拽平移，以及受边界约束的相机移动。

### Modified Capabilities

## Impact

- 影响 Phaser 版关卡编辑器运行时代码，尤其是当前的 editor scene、camera helper 和 renderer 模块。
- 当前引用编辑器渲染行为的测试文件需要同步跟随新的 editor 模块命名和位置。
- 预计不会涉及玩法运行时、存档格式或公共 API 的变化。
