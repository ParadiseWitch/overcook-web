<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// App component using Vue Router
</script>

<style>
#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>

<style>
body {
  margin: 0;
  background: #121212;
  color: #fff;
  font-family: "Microsoft YaHei", sans-serif;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 100vh;
  user-select: none;
}

#game-container {
  position: relative;
  border: 4px solid #444;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.8);
  background: #1a1a1a;
}

/* 图例样式 */
#legend-container {
  margin-top: 10px;
  background: #222;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #444;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px 15px;
  width: 900px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #ccc;
}

.icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
  display: inline-block;
  position: relative;
}

/* 操作说明 */
#controls {
  margin-top: 10px;
  font-size: 13px;
  color: #888;
  text-align: center;
}

.key {
  background: #ddd;
  color: #111;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  border-bottom: 2px solid #999;
}
</style>