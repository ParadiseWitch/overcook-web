<template>
  <div ref="editorRoot" class="editor-root">
    <div ref="canvasContainer" class="canvas-container" />
  </div>
</template>

<script setup lang="ts">
import Phaser from "phaser";
import { LevelEditorScene } from "@/game/editor/level-editor-scene";
import type { ViewportSize } from "@/game/editor/level-editor-camera";
import {
  createViewportResizeScheduler,
  getElementViewportSize,
  isValidViewportSize,
  type ViewportResizeScheduler,
} from "@/game/editor/level-editor-resize";
import { ref, onMounted, onUnmounted } from "vue";

const editorRoot = ref<HTMLElement | null>(null);
const canvasContainer = ref<HTMLElement | null>(null);

let phaserInstance: Phaser.Game | null = null;
let resizeObserver: ResizeObserver | null = null;
let resizeScheduler: ViewportResizeScheduler | null = null;
let removeWindowResizeListener: (() => void) | null = null;

onMounted(() => {
  const initialViewport = getCurrentViewportSize();

  phaserInstance = new Phaser.Game({
    type: Phaser.AUTO,
    width: initialViewport.width,
    height: initialViewport.height,
    parent: canvasContainer.value,
    backgroundColor: "#020617",
    physics: {
      default: "arcade",
      arcade: { debug: false, gravity: { x: 0, y: 0 } },
    },
    scene: [LevelEditorScene],
  });

  startResizeObservation();
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  resizeScheduler?.cancel();
  resizeScheduler = null;
  removeWindowResizeListener?.();
  removeWindowResizeListener = null;
  phaserInstance?.destroy(true);
});

function startResizeObservation() {
  resizeScheduler = createViewportResizeScheduler(applyEditorResize);

  const target = canvasContainer.value ?? editorRoot.value;
  if (!target) {
    return;
  }

  if (typeof ResizeObserver === "undefined") {
    const handleWindowResize = () => {
      resizeScheduler?.schedule(getCurrentViewportSize());
    };
    window.addEventListener("resize", handleWindowResize);
    removeWindowResizeListener = () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  } else {
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) {
        return;
      }

      resizeScheduler?.schedule({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      });
    });
    resizeObserver.observe(target);
  }

  resizeScheduler.schedule(getCurrentViewportSize());
}

function applyEditorResize(viewport: ViewportSize) {
  if (!phaserInstance) {
    return;
  }

  phaserInstance.scale.resize(viewport.width, viewport.height);

  const scene = phaserInstance.scene.getScene("LevelEditorScene");
  if (scene instanceof LevelEditorScene) {
    scene.resizeViewport(viewport);
  }
}

function getCurrentViewportSize(): ViewportSize {
  const target = canvasContainer.value ?? editorRoot.value;
  if (!target) {
    return getWindowViewportSize();
  }

  const viewport = getElementViewportSize(target);
  return isValidViewportSize(viewport) ? viewport : getWindowViewportSize();
}

function getWindowViewportSize(): ViewportSize {
  return {
    width: Math.max(1, Math.floor(window.innerWidth)),
    height: Math.max(1, Math.floor(window.innerHeight)),
  };
}
</script>

<style scoped>
.editor-root {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  /* background: radial-gradient(circle at top, rgba(14, 165, 233, .12), transparent 35%), linear-gradient(180deg, #0f172a 0%, #020617 100%); */
}

.canvas-container {
  width: 100%;
  height: 100%;
}
</style>
