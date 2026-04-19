## 1. Reorganize editor runtime modules

- [x] 1.1 将当前关卡编辑器运行时文件移动或重命名到统一的 editor 领域目录中，并明确 `scene`、`renderer`、`camera` 的命名。
- [x] 1.2 更新 import 和现有 editor 相关测试，使其使用新的模块路径，同时不改变 gameplay runtime 行为。

## 2. Implement camera navigation rules

- [x] 2.1 增加 editor camera 工具模块，用于处理网格居中和受边界约束的相机定位，并覆盖小地图居中规则。
- [x] 2.2 增加 editor camera pan helper，将 `Space` 修饰的拖拽输入按当前缩放值换算成相机移动。

## 3. Wire scene interaction and verify behavior

- [x] 3.1 将 camera pan helper 接入关卡编辑器 scene，使 `Space + drag` 可以平移画布，并在手势激活期间抑制选择类交互。
- [x] 3.2 增加或更新针对 camera clamp 和 drag-to-pan 计算的聚焦测试，然后手动验证画布平移、边界行为和编辑器画布上的正常指针交互。
