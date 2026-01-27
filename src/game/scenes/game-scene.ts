import * as Phaser from "phaser";
import { DEPTH, TILE_SIZE, WORLD_H, WORLD_W } from "../config";

// 导入新类
import { Item } from "../item";
import { Player } from "../player";
import { FireExtinguisher } from "../item/fire-extinguisher";

// 导入管理器
import { ALL_ITEMS, updateItems } from "../manager/item-manager";
import { createMap } from "../manager/map-manager";
import { ALL_PLAYERS, updatePlayers } from "../manager/player-manager";
import { ALL_STATIONS, updateStations } from "../manager/station-manager";
import { handleCollision, handleThrow } from "../physics/collision-handler";
import {
  initFireHelper,
  updateFireHelper,
  isOnFire,
  tryExtinguish,
} from "../helper/fire-helper";

export class GameScene extends Phaser.Scene {
  // 组
  public players: Player[] = []; // 玩家列表
  // public stations!: Phaser.Physics.Arcade.StaticGroup; // 静态工作站组
  public items!: Phaser.Physics.Arcade.Group; // 物品组

  public score: number = 0; // 游戏得分
  public cutDownTime: number = 300; // 倒计时（单位：秒）
  private countDownText!: Phaser.GameObjects.Text; // 倒计时文本

  // 菜单相关
  private isPaused: boolean = false; // 是否处于菜单暂停中（包括初始“开始游戏”）
  private menuContainer?: Phaser.GameObjects.Container;
  private startResumeButton?: Phaser.GameObjects.Text;
  private restartButton?: Phaser.GameObjects.Text;
  private menuItems: Phaser.GameObjects.Text[] = []; // 当前菜单中的按钮列表（用于导航）
  private selectedMenuIndex: number = 0; // 当前选中的菜单按钮索引
  private lastGamepadNavTime: number = 0; // 手柄摇杆导航的节流时间

  constructor() {
    super("GameScene");
  }

  create(data?: { skipInitialMenu?: boolean }) {
    // 场景每次创建（包括重新开始）时，清空全局管理数组，避免旧角色 / 工作站残留
    ALL_PLAYERS.length = 0;
    ALL_ITEMS.length = 0;
    ALL_STATIONS.length = 0;

    // 初始化物理世界边界
    this.physics.world.setBounds(
      0,
      0,
      TILE_SIZE * WORLD_W,
      TILE_SIZE * WORLD_H,
    );

    // 初始化物理组
    // runChildUpdate 对于 Station 子类调用其 update 方法很重要。
    // this.stations = this.physics.add.staticGroup({ classType: Phaser.Physics.Arcade.Sprite });
    this.items = this.physics.add.group({
      classType: Item,
      runChildUpdate: true,
    });

    // 初始化火焰助手
    initFireHelper(this);

    // 初始化管理器

    // 创建游戏世界
    createMap(this); // 创建地图和工作站
    // 设置碰撞检测
    handleCollision(this);
    handleThrow(this);
    // 初始化UI
    this.score = 0;
    this.add
      .text(20, 20, "得分: 0", { fontSize: "32px", fontStyle: "bold" })
      .setDepth(DEPTH.UI)
      .setName("scoreText");

    // 初始化倒计时文本，显示在右下角
    const camera = this.cameras.main;
    const padding = 20;
    this.countDownText = this.add
      .text(
        camera.width - padding,
        camera.height - padding,
        `剩余时间: ${this.formatCountDownTime()}`,
        { fontSize: "28px", fontStyle: "bold" },
      )
      .setDepth(DEPTH.UI)
      .setOrigin(1, 1)
      .setName("countDownText");

    // 创建菜单 UI（开始 / 继续 / 重新开始）
    this.createMenuUI();

    // 首次进入场景：显示“开始游戏”菜单；重新开始时可跳过
    if (data && data.skipInitialMenu) {
      this.isPaused = false;
      this.hideMenu();
    } else {
      this.showInitialMenu();
    }

    // 键盘 ESC 打开 / 关闭菜单
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-ESC", () => {
        this.togglePauseMenu();
      });

      // 键盘上下键导航菜单，Enter 确认
      this.input.keyboard.on("keydown-UP", () => {
        if (this.menuContainer?.visible) {
          this.moveMenuSelection(-1);
        }
      });
      this.input.keyboard.on("keydown-DOWN", () => {
        if (this.menuContainer?.visible) {
          this.moveMenuSelection(1);
        }
      });
      this.input.keyboard.on("keydown-ENTER", () => {
        if (this.menuContainer?.visible) {
          this.confirmMenuSelection();
        }
      });
    }

    // 绑定手柄到玩家2（第一个连接的手柄 -> 第二个玩家）
    if (this.input.gamepad) {
      // 已经连接的手柄（例如在加载前就插好的）
      this.input.gamepad.gamepads.forEach((pad) => {
        if (!pad) return;
        if (ALL_PLAYERS.length > 1 && !ALL_PLAYERS[1].gamepad) {
          ALL_PLAYERS[1].setGamepad(pad);
        }
      });

      // 之后新连接的手柄
      this.input.gamepad.on(
        "connected",
        (pad: Phaser.Input.Gamepad.Gamepad) => {
          if (ALL_PLAYERS.length > 1 && !ALL_PLAYERS[1].gamepad) {
            ALL_PLAYERS[1].setGamepad(pad);
          }
        },
      );

      // 任意手柄上的 “+” 或 Start 键 打开 / 关闭菜单；
      // 在菜单打开时，使用十字键 / 摇杆上下导航，A 键确认
      this.input.gamepad.on(
        "down",
        (_pad: Phaser.Input.Gamepad.Gamepad, button: any, index: number) => {
          const btnIndex =
            typeof button === "number" ? button : (button.index ?? index);
          // 常见手柄上：7 / 9 作为 Start / Options / “+” 键
          if (btnIndex === 7 || btnIndex === 9) {
            this.togglePauseMenu();
            return;
          }

          // 菜单打开时：用手柄按钮控制导航与确认
          if (this.menuContainer?.visible) {
            // 12: dpad up, 13: dpad down, 0: A 按钮（大多数手柄）
            if (btnIndex === 12) {
              this.moveMenuSelection(-1);
            } else if (btnIndex === 13) {
              this.moveMenuSelection(1);
            } else if (btnIndex === 0) {
              this.confirmMenuSelection();
            }
            return;
          }
        },
      );
    }
  }

  update(time: number, delta: number) {
    // 菜单打开时，允许手柄摇杆上下导航（持续按住时缓慢滚动）
    if (this.menuContainer?.visible && this.input.gamepad) {
      this.input.gamepad.gamepads.forEach((pad) => {
        if (!pad) return;
        const axisV = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;
        const deadZone = 0.3;
        if (Math.abs(axisV) > deadZone) {
          const now = time;
          // 简单节流：每 200ms 允许一次导航
          if (now - this.lastGamepadNavTime > 200) {
            this.lastGamepadNavTime = now;
            this.moveMenuSelection(axisV < 0 ? -1 : 1);
          }
        }
      });
    }

    // 打开菜单或初始“开始游戏”状态时，暂停游戏逻辑与倒计时
    if (this.isPaused) {
      return;
    }

    // 更新倒计时
    if (this.cutDownTime > 0) {
      this.cutDownTime -= delta / 1000;
      if (this.cutDownTime < 0) {
        this.cutDownTime = 0;
      }
      this.countDownText.setText(`剩余时间: ${this.formatCountDownTime()}`);
    }

    // 更新玩家状态
    updatePlayers(delta);
    // 更新工作站状态
    updateStations(delta);
    // 更新item
    updateItems(delta);
    // 更新火焰系统
    updateFireHelper(delta);

    // 处理灭火器灭火逻辑
    ALL_PLAYERS.forEach((player) => {
      if (player.heldItem instanceof FireExtinguisher) {
        const extinguisher = player.heldItem;
        if (extinguisher.isCurrentlySpraying()) {
          const sprayRange = extinguisher.getSprayRange();
          const sprayAngle = extinguisher.getSprayAngle();
          const sprayX = player.x + player.facing.x * 20;
          const sprayY = player.y + player.facing.y * 20;

          ALL_STATIONS.forEach((station) => {
            if (isOnFire(station)) {
              tryExtinguish(
                station,
                sprayX,
                sprayY,
                sprayRange,
                sprayAngle,
                player.facing,
                delta,
              );
            }
          });
        }
      }
    });
  }

  /**
   * 将剩余时间格式化为 分钟:秒数:毫秒（MM:SS:ms）
   */
  private formatCountDownTime(): string {
    const totalMs = Math.max(this.cutDownTime, 0) * 1000;
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const ms = Math.floor(totalMs % 1000);

    const mm = minutes.toString().padStart(2, "0");
    const ss = seconds.toString().padStart(2, "0");
    const mmm = ms.toString().padStart(3, "0");

    return `${mm}:${ss}:${mmm}`;
  }

  /**
   * 创建菜单 UI（只创建一次，后续复用）
   */
  private createMenuUI() {
    const { width, height } = this.scale;

    const bg = this.add
      .rectangle(width / 2, height / 2, 420, 260, 0x000000, 0.7)
      .setDepth(DEPTH.UI + 10);

    const title = this.add
      .text(width / 2, height / 2 - 80, "游戏菜单", {
        fontSize: "32px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI + 11);

    const startResume = this.add
      .text(width / 2, height / 2 - 10, "开始游戏", {
        fontSize: "28px",
        fontStyle: "bold",
        color: "#ffffff",
        backgroundColor: "#00aa88",
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI + 11)
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => {
        this.onClickStartOrResume();
      });

    const restart = this.add
      .text(width / 2, height / 2 + 60, "重新开始", {
        fontSize: "24px",
        fontStyle: "bold",
        color: "#ffffff",
        backgroundColor: "#aa5500",
        padding: { left: 20, right: 20, top: 8, bottom: 8 },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI + 11)
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => {
        this.onClickRestart();
      });

    this.menuContainer = this.add
      .container(0, 0, [bg, title, startResume, restart])
      .setDepth(DEPTH.UI + 10)
      .setScrollFactor(0)
      .setVisible(false);

    this.startResumeButton = startResume;
    this.restartButton = restart;
    this.menuItems = [startResume, restart];
  }

  /**
   * 初始进入场景时的菜单：只显示“开始游戏”
   */
  private showInitialMenu() {
    if (!this.menuContainer || !this.startResumeButton || !this.restartButton)
      return;
    this.isPaused = true;
    this.menuContainer.setVisible(true);
    this.startResumeButton.setText("开始游戏");
    this.restartButton.setVisible(false);
    this.selectedMenuIndex = 0;
    this.updateMenuSelectionVisual();
  }

  /**
   * 游戏进行中按 ESC / “+” 键弹出的菜单：显示“继续游戏”和“重新开始”
   */
  private showPauseMenu() {
    if (!this.menuContainer || !this.startResumeButton || !this.restartButton)
      return;
    this.isPaused = true;
    this.menuContainer.setVisible(true);
    this.startResumeButton.setText("继续游戏");
    this.restartButton.setVisible(true);
    // 打开暂停菜单时，默认选中“继续游戏”
    this.selectedMenuIndex = 0;
    this.updateMenuSelectionVisual();
  }

  private hideMenu() {
    if (!this.menuContainer) return;
    this.isPaused = false;
    this.menuContainer.setVisible(false);
  }

  private togglePauseMenu() {
    // 如果菜单还没创建好，直接返回
    if (!this.menuContainer || !this.startResumeButton || !this.restartButton)
      return;

    // 如果是初始还未开始游戏的菜单，不响应 ESC / 手柄切换
    if (
      this.menuContainer.visible &&
      this.startResumeButton.text === "开始游戏"
    ) {
      return;
    }

    if (this.menuContainer.visible) {
      this.hideMenu();
    } else {
      this.showPauseMenu();
    }
  }

  private onClickStartOrResume() {
    // 无论“开始游戏”还是“继续游戏”，都是关闭菜单并恢复游戏
    this.hideMenu();
  }

  private onClickRestart() {
    // 使用 data 告诉新一轮游戏：直接开始，不再显示“开始游戏”菜单
    this.scene.restart({ skipInitialMenu: true });
  }

  /**
   * 菜单导航：移动当前选中的按钮
   */
  private moveMenuSelection(delta: number) {
    if (
      !this.menuContainer ||
      !this.menuContainer.visible ||
      this.menuItems.length === 0
    )
      return;

    // 只在可见按钮之间循环
    const visibleCount = this.menuItems.filter((b) => b.visible).length;
    if (visibleCount === 0) return;

    let idx = this.selectedMenuIndex;
    let safety = 0;
    do {
      idx = (idx + delta + this.menuItems.length) % this.menuItems.length;
      safety++;
      if (safety > this.menuItems.length + 1) break;
    } while (!this.menuItems[idx].visible);

    this.selectedMenuIndex = idx;
    this.updateMenuSelectionVisual();
  }

  /**
   * 根据当前选中索引更新按钮的高亮效果
   */
  private updateMenuSelectionVisual() {
    this.menuItems.forEach((btn, idx) => {
      if (!btn.visible) {
        btn.setStyle({ backgroundColor: "transparent" });
        return;
      }
      if (idx === this.selectedMenuIndex) {
        // 选中的按钮高亮（黄色背景）
        btn.setStyle({ backgroundColor: "#ffcc00" });
      } else {
        // 非选中按钮恢复各自的默认颜色
        if (btn === this.startResumeButton) {
          btn.setStyle({ backgroundColor: "#00aa88" });
        } else if (btn === this.restartButton) {
          btn.setStyle({ backgroundColor: "#aa5500" });
        }
      }
    });
  }

  /**
   * 确认当前选中的按钮（键盘 Enter / 手柄 A）
   */
  private confirmMenuSelection() {
    if (
      !this.menuContainer ||
      !this.menuContainer.visible ||
      this.menuItems.length === 0
    )
      return;
    const btn = this.menuItems[this.selectedMenuIndex];
    if (!btn || !btn.visible) return;

    if (btn === this.startResumeButton) {
      this.onClickStartOrResume();
    } else if (btn === this.restartButton) {
      this.onClickRestart();
    }
  }
}
