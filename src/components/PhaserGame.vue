<template>
  <div ref="gameContainer" class="game-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import StartGame from '../game/main';

const gameContainer = ref<HTMLElement | null>(null);
let gameInstance: any = null;

onMounted(() => {
  if (gameContainer.value) {
    // Set the container element ID that Phaser expects
    gameContainer.value.id = 'game-container';
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
  position: relative;
  border: 4px solid #444;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.8);
  background: #1a1a1a;
}
</style>