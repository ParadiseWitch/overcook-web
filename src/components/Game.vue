<template>
  <div class="game-shell">
    <div ref="gameContainer" class="game-container">
      <div id="game-container" class="phaser-game"></div>
    </div>
    <section class="legend-container" v-if="legendEntries.length > 0">
      <div class="legend-item player-item">
        <img class="icon" :src="playerIcons.player1" alt="Player 1" />
        <span>Player 1</span>
      </div>
      <div class="legend-item player-item">
        <img class="icon" :src="playerIcons.player2" alt="Player 2" />
        <span>Player 2</span>
      </div>
      <div class="legend-item" v-for="entry in legendEntries" :key="entry.id">
        <img class="icon" :src="legendIcons[entry.id]" :alt="entry.label" />
        <span>{{ entry.label }}</span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type Phaser from "phaser";
import { onMounted, onUnmounted, ref } from "vue";
import StartGame from "../game/main";
import { useGameLegendIcons } from "./useGameLegendIcons";

const gameContainer = ref<HTMLElement | null>(null);
const legendIcons = ref<Record<string, string>>({});
const playerIcons = ref({ player1: "", player2: "" });
const { buildFromScene, legendEntries } = useGameLegendIcons();

let gameInstance: Phaser.Game | null = null;

function syncLegendIcons(attempt = 0) {
  if (!gameInstance) {
    return;
  }

  const scene = gameInstance.scene.getScene("GameScene") as Phaser.Scene;
  if (!scene || !scene.sys || !scene.sys.isActive()) {
    if (attempt < 40) {
      window.setTimeout(() => syncLegendIcons(attempt + 1), 50);
    }
    return;
  }

  const legendState = buildFromScene(scene);
  legendIcons.value = legendState.legendIcons;
  playerIcons.value = legendState.playerIcons;
}

onMounted(() => {
  if (gameContainer.value) {
    gameInstance = StartGame("game-container");
    syncLegendIcons();
  }
});

onUnmounted(() => {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
  }
  legendIcons.value = {};
  playerIcons.value = { player1: "", player2: "" };
});
</script>

<style scoped>
.game-shell {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #121212;
}

.game-container {
  width: 100%;
  min-height: 72vh;
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
  min-height: 72vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.legend-container {
  margin-top: 10px;
  background: #222;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #444;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px 15px;
  width: min(940px, calc(100vw - 24px));
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #ccc;
}

.player-item {
  color: #f5f5f5;
  font-weight: 600;
}

.icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
  display: inline-block;
  background: #111;
  border-radius: 4px;
}
</style>
