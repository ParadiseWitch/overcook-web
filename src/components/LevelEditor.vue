<template>
  <div ref="editorRoot" class="editor-root">
    <div ref="canvasContainer" class="canvas-container" />
  </div>
</template>

<script setup lang="ts">
import Phaser from "phaser";
import { LevelEditorScene } from "@/game/editor/level-editor-scene";
import { ref, reactive, onMounted, onUnmounted } from "vue";
const editorRoot = ref<HTMLElement | null>(null);
const canvasContainer = ref<HTMLElement | null>(null);
const canvasSize = reactive({ width: window.innerWidth, height: window.innerHeight });

let phaserInstance: Phaser.Game | null = null;

onMounted(() => {
  phaserInstance = new Phaser.Game({
    type: Phaser.AUTO,
    width: canvasSize.width,
    height: canvasSize.height,
    parent: canvasContainer.value,
    backgroundColor: "#020617",
    physics: {
      default: "arcade",
      arcade: { debug: false, gravity: { x: 0, y: 0 } },
    },
    scene: [LevelEditorScene],
  });
});

onUnmounted(() => {
  phaserInstance?.destroy(true);
});

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
