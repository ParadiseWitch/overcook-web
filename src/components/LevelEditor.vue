<template>
  <div id="level-editor-container">
    <!-- 顶部栏 -->
    <header class="editor-header">
      <h1>关卡编辑器</h1>
      <div class="editor-actions">
        <button id="btn-new">新建</button>
        <button id="btn-save">保存</button>
        <button id="btn-import">导入JSON</button>
        <button id="btn-export">导出JSON</button>
        <button id="btn-playtest">试玩</button>
      </div>
    </header>

    <!-- 主体区域 -->
    <div class="editor-main">
      <!-- 左侧工具面板 -->
      <aside class="editor-sidebar">
        <div class="tool-section">
          <h3>基础设置</h3>
          <div class="form-group">
            <label>关卡名称：</label>
            <input type="text" id="level-name" placeholder="输入关卡名称">
          </div>
          <div class="form-group">
            <label>关卡描述：</label>
            <textarea id="level-description" placeholder="输入关卡描述"></textarea>
          </div>
          <div class="form-group">
            <label>游戏模式：</label>
            <select id="game-type">
              <option value="local-coop">本地合作</option>
              <option value="local-versus">本地对战</option>
              <option value="online-coop">线上合作</option>
              <option value="online-versus">线上对战</option>
            </select>
          </div>
          <div class="form-group">
            <label>游戏时长(秒)：</label>
            <input type="number" id="duration" value="300">
          </div>
          <div class="form-group">
            <label>地图尺寸：</label>
            <div class="dimension-inputs">
              <input type="number" id="map-width" value="17" min="5" max="30">宽
              <input type="number" id="map-height" value="13" min="5" max="30">高
            </div>
          </div>
        </div>
        
        <div class="tool-section">
          <h3>地板</h3>
          <div class="tool-buttons">
            <button class="tool-btn" data-tool="normal-floor">⬜ 普通地板</button>
            <button class="tool-btn" data-tool="wall-floor">⬛ 墙壁</button>
            <button class="tool-btn" data-tool="conveyor-floor">➡️ 传送带</button>
          </div>
          <div id="conveyor-settings" class="hidden">
            <div class="form-group">
              <label>方向：</label>
              <select id="conveyor-direction">
                <option value="right">右</option>
                <option value="left">左</option>
                <option value="up">上</option>
                <option value="down">下</option>
              </select>
            </div>
            <div class="form-group">
              <label>速度：</label>
              <input type="number" id="conveyor-speed" value="100" min="1" max="500">
            </div>
          </div>
        </div>
        
        <div class="tool-section">
          <h3>工作站</h3>
          <div class="tool-buttons">
            <button class="tool-btn" data-tool="counter">🔲 空柜台</button>
            <button class="tool-btn" data-tool="plate-counter">🍽️ 盘子柜台</button>
            <button class="tool-btn" data-tool="cut">🔪 切菜板</button>
            <button class="tool-btn" data-tool="pot">🍲 炒锅</button>
            <button class="tool-btn" data-tool="sink">💧 洗碗池</button>
            <button class="tool-btn" data-tool="delivery">📤 上菜口</button>
            <button class="tool-btn" data-tool="trash">🗑️ 垃圾桶</button>
          </div>
          <div class="tool-buttons">
            <button class="tool-btn" data-tool="ingredient-tomato">🍅 番茄箱</button>
            <button class="tool-btn" data-tool="ingredient-lettuce">🥬 生菜箱</button>
            <button class="tool-btn" data-tool="ingredient-rice">🍚 米箱</button>
            <button class="tool-btn" data-tool="ingredient-fish">🐟 鱼箱</button>
          </div>
        </div>
        
        <div class="tool-section">
          <h3>玩家</h3>
          <div class="tool-buttons">
            <button class="tool-btn" data-tool="player-1">▲1 玩家1</button>
            <button class="tool-btn" data-tool="player-2">▲2 玩家2</button>
          </div>
        </div>
      </aside>

      <!-- 中间画布区域 (Phaser Canvas) -->
      <main class="editor-canvas">
        <div id="editor-game-container"></div>
      </main>
    </div>

    <!-- 底部属性面板 -->
    <footer class="editor-properties">
      <h3>属性面板</h3>
      <div id="properties-content">
        <p>请选择一个对象来编辑其属性</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import { LevelEditorScene } from '@/game/scenes/level-editor-scene';

// Phaser相关引用
let gameInstance: any = null;
const selectedTool = ref<string | null>(null);

onMounted(async () => {
  // 初始化编辑器场景
  if ((window as any).Phaser) {
    await initEditor();
  } else {
    // 如果Phaser尚未加载，则等待
    const checkPhaser = setInterval(() => {
      if ((window as any).Phaser) {
        clearInterval(checkPhaser);
        initEditor();
      }
    }, 100);
  }
  
  // 初始化事件监听器
  await nextTick();
  initializeEventListeners();
});

onUnmounted(() => {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
  }
});

const initEditor = async () => {
  // 获取容器的尺寸
  const container = document.getElementById('editor-game-container');
  let width = 816; // 默认 17 * 48
  let height = 624; // 默认 13 * 48
  
  if (container) {
    // 计算容器可用空间，减去一些边距
    const availableWidth = container.clientWidth || 816;
    const availableHeight = container.clientHeight || 624;
    
    // 计算缩放比例以适应容器，同时保持地图比例
    const tileWidth = 17 * 48; // 默认宽度
    const tileHeight = 13 * 48; // 默认高度
    
    const scaleX = availableWidth / tileWidth;
    const scaleY = availableHeight / tileHeight;
    const scale = Math.min(scaleX, scaleY, 1); // 不超过1倍
    
    width = tileWidth * scale;
    height = tileHeight * scale;
  }

  const config = {
    type: (window as any).Phaser.AUTO,
    width,
    height,
    parent: 'editor-game-container',
    physics: {
      default: 'arcade',
      arcade: {
        debug: true,
        gravity: { y: 0 }
      }
    },
    scale: {
      mode: (window as any).Phaser.Scale.FIT,
      autoCenter: (window as any).Phaser.Scale.CENTER_BOTH,
      width,
      height,
    },
    scene: LevelEditorScene
  };

  gameInstance = new (window as any).Phaser.Game(config);
  
  // 等待场景启动完成后设置回调
  setTimeout(() => {
    const scene = gameInstance.scene.getScene('LevelEditorScene');
    if (scene) {
      // 监听对象选择事件
      scene.events.on('object-selected', (obj: any) => {
        updatePropertiesPanel(obj);
      });
      
      // 初始化基础设置表单事件
      initializeFormEvents(scene);
    }
  }, 500);
};

// 初始化表单事件
const initializeFormEvents = (scene: any) => {
  // 关卡名称变化
  const levelNameInput = document.getElementById('level-name') as HTMLInputElement;
  if (levelNameInput) {
    levelNameInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      scene.updateLevelName(target.value);
    });
  }
  
  // 关卡描述变化
  const levelDescInput = document.getElementById('level-description') as HTMLTextAreaElement;
  if (levelDescInput) {
    levelDescInput.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement;
      scene.updateLevelDescription(target.value);
    });
  }
  
  // 游戏模式变化
  const gameTypeSelect = document.getElementById('game-type') as HTMLSelectElement;
  if (gameTypeSelect) {
    gameTypeSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      scene.updateGameType(target.value as any);
    });
  }
  
  // 游戏时长变化
  const durationInput = document.getElementById('duration') as HTMLInputElement;
  if (durationInput) {
    durationInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      scene.updateDuration(parseInt(target.value) || 300);
    });
  }
  
  // 地图尺寸变化
  const mapWidthInput = document.getElementById('map-width') as HTMLInputElement;
  const mapHeightInput = document.getElementById('map-height') as HTMLInputElement;
  
  if (mapWidthInput && mapHeightInput) {
    const updateMapSize = () => {
      const width = parseInt(mapWidthInput.value) || 17;
      const height = parseInt(mapHeightInput.value) || 13;
      scene.updateMapSize(width, height);
    };
    
    mapWidthInput.addEventListener('input', updateMapSize);
    mapHeightInput.addEventListener('input', updateMapSize);
  }
};

// 工具选择处理
const selectTool = (tool: string) => {
  selectedTool.value = selectedTool.value === tool ? null : tool;
  
  // 更新按钮样式
  const buttons = document.querySelectorAll('.tool-btn');
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tool') === selectedTool.value);
  });
  
  // 通知Phaser场景更新选中的工具
  if (gameInstance) {
    const scene = gameInstance.scene.getScene('LevelEditorScene');
    if (scene && scene.setSelectedTool) {
      scene.setSelectedTool(selectedTool.value);
    }
  }
};

// 更新属性面板
const updatePropertiesPanel = (obj: any) => {
  const propertiesContent = document.getElementById('properties-content');
  if (!propertiesContent) return;
  
  if (obj.type === 'none' && obj.message) {
    propertiesContent.innerHTML = `<p>${obj.message}</p>`;
    return;
  }
  
  let content = '<h4>对象属性</h4>';
  
  if (obj.type) {
    content += `<p><strong>类型:</strong> ${obj.type}</p>`;
  }
  
  if (obj.x !== undefined && obj.y !== undefined) {
    content += `<p><strong>位置:</strong> (${obj.x}, ${obj.y})</p>`;
  }
  
  if (obj.id) {
    content += `<p><strong>ID:</strong> ${obj.id}</p>`;
  }
  
  if (obj.ingredientType) {
    content += `<p><strong>食材类型:</strong> ${obj.ingredientType}</p>`;
  }
  
  if (obj.direction) {
    content += `<p><strong>方向:</strong> ${obj.direction}</p>`;
  }
  
  if (obj.speed) {
    content += `<p><strong>速度:</strong> ${obj.speed}</p>`;
  }
  
  content += `<button onclick="deleteSelectedObject()">删除对象</button>`;
  
  propertiesContent.innerHTML = content;
  
  // 定义删除函数
  (window as any).deleteSelectedObject = () => {
    if (gameInstance) {
      const scene = gameInstance.scene.getScene('LevelEditorScene');
      if (scene && scene.clearSelection) {
        scene.clearSelection();
      }
      // 重新渲染
      updatePropertiesPanel({ type: 'none', message: '请选择一个对象来编辑其属性' });
    }
  };
};

// 初始化事件监听器
const initializeEventListeners = () => {
  // 为工具按钮添加事件监听器
  const toolButtons = document.querySelectorAll('.tool-btn');
  toolButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const tool = (e.target as HTMLElement).getAttribute('data-tool');
      if (tool) {
        selectTool(tool);
      }
    });
  });
  
  // 初始化传送带设置区域
  const conveyorButton = document.querySelector('[data-tool="conveyor-floor"]');
  const conveyorSettings = document.getElementById('conveyor-settings');
  
  if (conveyorButton && conveyorSettings) {
    conveyorButton.addEventListener('click', () => {
      if (selectedTool.value === 'conveyor-floor') {
        conveyorSettings.classList.remove('hidden');
      } else {
        conveyorSettings.classList.add('hidden');
      }
    });
  }
  
  // 添加按钮事件
  const newBtn = document.getElementById('btn-new');
  const saveBtn = document.getElementById('btn-save');
  const importBtn = document.getElementById('btn-import');
  const exportBtn = document.getElementById('btn-export');
  const playtestBtn = document.getElementById('btn-playtest');
  
  if (newBtn) {
    newBtn.addEventListener('click', () => {
      alert('新建关卡功能将在后续版本中实现');
    });
  }
  
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (gameInstance) {
        const scene = gameInstance.scene.getScene('LevelEditorScene');
        if (scene) {
          const config = scene.exportLevelConfig();
          const jsonStr = JSON.stringify(config, null, 2);
          
          // 创建下载链接
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${config.name || 'level'}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
    });
  }
  
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (gameInstance) {
        const scene = gameInstance.scene.getScene('LevelEditorScene');
        if (scene) {
          const config = scene.exportLevelConfig();
          const jsonStr = JSON.stringify(config, null, 2);
          
          // 创建下载链接
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${config.name || 'level'}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
    });
  }
  
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      alert('导入功能将在后续版本中实现');
    });
  }
  
  if (playtestBtn) {
    playtestBtn.addEventListener('click', () => {
      alert('试玩功能将在后续版本中实现');
    });
  }
};

// 导出函数供外部调用
defineExpose({
  gameInstance
});
</script>

<style scoped>
#level-editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #121212;
  color: #fff;
  font-family: "Microsoft YaHei", sans-serif;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: #1a1a1a;
  border-bottom: 1px solid #444;
}

.editor-actions button {
  margin-left: 10px;
  padding: 8px 15px;
  background: #2c3e50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.editor-actions button:hover {
  background: #34495e;
}

.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-sidebar {
  width: 280px;
  background: #1e1e1e;
  padding: 15px;
  overflow-y: auto;
  border-right: 1px solid #444;
}

.tool-section {
  margin-bottom: 20px;
}

.tool-section h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #4da6ff;
  border-bottom: 1px solid #444;
  padding-bottom: 5px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 6px;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
}

.dimension-inputs input {
  width: 60px;
  display: inline-block;
  margin: 0 5px;
}

.tool-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
}

.tool-btn {
  padding: 8px 10px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.tool-btn:hover {
  background: #2980b9;
}

.tool-btn.active {
  background: #e74c3c;
  box-shadow: 0 0 5px rgba(231, 76, 60, 0.5);
}

.editor-canvas {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #222;
  overflow: auto;
}

#editor-game-container {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 400px;
  border: 2px solid #444;
  background: #1a1a1a;
}

.editor-properties {
  height: 150px;
  background: #1e1e1e;
  padding: 15px;
  border-top: 1px solid #444;
  overflow-y: auto;
}

.editor-properties h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #4da6ff;
}

.hidden {
  display: none;
}
</style>