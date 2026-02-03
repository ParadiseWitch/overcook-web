<template>
  <div ref="gameContainer" class="game-container">
    <div id="game-container" class="phaser-game"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import StartGame from '../game/main';

const gameContainer = ref<HTMLElement | null>(null);
let gameInstance: any = null;

onMounted(() => {
  if (gameContainer.value) {
    gameInstance = StartGame('game-container');
  }
});

onUnmounted(() => {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
  }
});
</script>

<style scoped>
.game-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 4px solid #444;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.8);
  background: #1a1a1a;
  overflow: hidden;
}

.phaser-game {
  width: 100%;
  height: 100%;
}
</style>