export interface CoordinateSystemOptions {
  originX?: number;
  originY?: number;
  width?: number;
  height?: number;
  gridSize?: number;
  gridColor?: number;
  xAxisColor?: number;
  yAxisColor?: number;
  textColor?: string;
  lineAlpha?: number;
  axisAlpha?: number;
  fontSize?: string;
  showLabels?: boolean;
  fixedToCamera?: boolean;

  /** 层级 */
  depth?: number;
}

export function useCoordinateSystem(
  scene: Phaser.Scene,
  initialOptions: CoordinateSystemOptions = {}
) {
  let options: CoordinateSystemOptions = { ...initialOptions };

  let container: Phaser.GameObjects.Container | undefined;
  let graphics: Phaser.GameObjects.Graphics | undefined;
  let texts: Phaser.GameObjects.Text[] = [];

  let visible = false;

  function draw() {
    const {
      originX = 0,
      originY = 0,
      width = scene.scale.width,
      height = scene.scale.height,
      gridSize = 50,
      gridColor = 0x444444,
      xAxisColor = 0xff0000,
      yAxisColor = 0x00ff00,
      textColor = '#ffffff',
      lineAlpha = 0.4,
      axisAlpha = 1,
      fontSize = '12px',
      showLabels = true,
      fixedToCamera = false,
      depth = 999999
    } = options;

    // ✅ 创建容器（统一管理层级）
    container = scene.add.container(0, 0);
    container.setDepth(depth);

    // graphics
    graphics = scene.add.graphics();
    container.add(graphics);

    const g = graphics;

    // ===== 网格 =====
    g.lineStyle(1, gridColor, lineAlpha);

    for (let x = 0; x <= width; x += gridSize) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, height);
      g.strokePath();
    }

    for (let y = 0; y <= height; y += gridSize) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(width, y);
      g.strokePath();
    }

    // ===== 坐标轴 =====
    g.lineStyle(2, xAxisColor, axisAlpha);

    g.beginPath();
    g.moveTo(0, originY);
    g.lineTo(width, originY);
    g.strokePath();

    g.lineStyle(2, yAxisColor, axisAlpha);
    g.beginPath();
    g.moveTo(originX, 0);
    g.lineTo(originX, height);
    g.strokePath();

    // 原点
    g.fillStyle(0x00ff00, 1);
    g.fillCircle(originX, originY, 4);

    // ===== 刻度 =====
    if (showLabels) {
      // X轴
      for (let x = 0; x <= width; x += gridSize) {
        g.lineStyle(1, xAxisColor, axisAlpha);
        g.beginPath();
        g.moveTo(x, originY - 5);
        g.lineTo(x, originY + 5);
        g.strokePath();

        const t = scene.add.text(x + 2, originY + 6, `${x}`, {
          fontSize,
          color: textColor
        });

        container.add(t);
        texts.push(t);
      }

      // Y轴
      for (let y = 0; y <= height; y += gridSize) {
        g.lineStyle(1, yAxisColor, axisAlpha);
        g.beginPath();
        g.moveTo(originX - 5, y);
        g.lineTo(originX + 5, y);
        g.strokePath();

        const t = scene.add.text(originX + 6, y + 2, `${y}`, {
          fontSize,
          color: textColor
        });

        container.add(t);
        texts.push(t);
      }

      const originText = scene.add.text(originX + 8, originY + 8, '(0,0)', {
        fontSize,
        color: '#00ff00'
      });

      container.add(originText);
      texts.push(originText);
    }

    // 是否固定到摄像机
    if (fixedToCamera) {
      container.setScrollFactor(0);
    }
  }

  function destroy() {
    container?.destroy();
    container = undefined;

    graphics = undefined;
    texts = [];
  }

  function show() {
    if (visible) return;
    visible = true;
    draw();
  }

  function hide() {
    if (!visible) return;
    visible = false;
    destroy();
  }

  function toggle() {
    visible ? hide() : show();
  }

  function updateOptions(newOptions: Partial<CoordinateSystemOptions>) {
    options = { ...options, ...newOptions };

    if (visible) {
      destroy();
      draw();
    }
  }

  function isVisible() {
    return visible;
  }

  return {
    show,
    hide,
    toggle,
    updateOptions,
    isVisible
  };
}
