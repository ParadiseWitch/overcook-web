<template>
  <div id="app">
    <div id="game-container">
      <PhaserGame />
    </div>
    
    <!-- Legend System -->
    <div id="legend-container">
      <!-- Environment -->
      <div class="legend-item"><img class="icon" src="" id="icon-counter">空柜台</div>
      <div class="legend-item"><img class="icon" src="" id="icon-crate">食材箱</div>
      <div class="legend-item"><img class="icon" src="" id="icon-cut">切菜板</div>
      <div class="legend-item"><img class="icon" src="" id="icon-pot-station">煮锅灶</div>
      <div class="legend-item"><img class="icon" src="" id="icon-sink">洗碗池</div>
      <div class="legend-item"><img class="icon" src="" id="icon-delivery">上菜口</div>
      <div class="legend-item"><img class="icon" src="" id="icon-dirty-spawn">脏盘子生成点</div>
      <div class="legend-item"><img class="icon" src="" id="icon-trash">垃圾桶</div>

      <!-- Characters -->
      <div class="legend-item"><img class="icon" src="" id="icon-player1">角色1</div>
      <div class="legend-item"><img class="icon" src="" id="icon-player2">角色2</div>

      <!-- Items - Basics -->
      <div class="legend-item"><img class="icon" src="" id="icon-pot">空锅</div>
      <div class="legend-item"><img class="icon" src="" id="icon-plate">空盘子</div>
      <div class="legend-item"><img class="icon" src="" id="icon-plate-dirty">脏盘子</div>
      <div class="legend-item"><img class="icon" src="" id="icon-soup">成品番茄汤</div>
      <div class="legend-item"><img class="icon" src="" id="icon-soup-pot">锅中的汤</div>

      <!-- Ingredients - Tomato -->
      <div class="legend-item"><img class="icon" src="" id="icon-tomato">番茄(红)</div>
      <div class="legend-item"><img class="icon" src="" id="icon-tomato-cut">切好的番茄</div>

      <!-- Ingredients - Lettuce -->
      <div class="legend-item"><img class="icon" src="" id="icon-lettuce">生菜(绿)</div>
      <div class="legend-item"><img class="icon" src="" id="icon-lettuce-cut">切好的生菜</div>

      <!-- Ingredients - Fish -->
      <div class="legend-item"><img class="icon" src="" id="icon-fish">鱼(银)</div>
      <div class="legend-item"><img class="icon" src="" id="icon-fish-cut">切好的鱼</div>

      <!-- Ingredients - Rice -->
      <div class="legend-item"><img class="icon" src="" id="icon-rice">米(白)</div>
      <div class="legend-item"><img class="icon" src="" id="icon-rice-cooked">煮好的米</div>

      <!-- Ingredients - Onion -->
      <div class="legend-item"><img class="icon" src="" id="icon-onion">洋葱(紫)</div>
      <div class="legend-item"><img class="icon" src="" id="icon-onion-cut">切好的洋葱</div>

      <!-- Ingredients - Potato -->
      <div class="legend-item"><img class="icon" src="" id="icon-potato">土豆(棕)</div>
      <div class="legend-item"><img class="icon" src="" id="icon-potato-cut">切好的土豆</div>

      <!-- Ingredients - Carrot -->
      <div class="legend-item"><img class="icon" src="" id="icon-carrot">胡萝卜(橙)</div>
      <div class="legend-item"><img class="icon" src="" id="icon-carrot-cut">切好的胡萝卜</div>

      <!-- Ingredients - Others -->
      <div class="legend-item"><img class="icon" src="" id="icon-egg">鸡蛋(白椭圆)</div>
      <div class="legend-item"><img class="icon" src="" id="icon-flour">面粉(白袋)</div>
      <div class="legend-item"><img class="icon" src="" id="icon-seaweed">紫菜(深绿)</div>
    </div>

    <div id="controls">
      <span style="color:#4da6ff">P1: WASD移动 | E 互动 | R 切/洗 | 空格 投掷 | Shift 冲刺</span> &nbsp;|&nbsp;
      <span style="color:#ff4d44">P2: 箭头移动 | O 互动 | P 切/洗 | L 投掷 | Enter 冲刺</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import PhaserGame from './components/PhaserGame.vue';
</script>

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