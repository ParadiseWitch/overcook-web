<template>
  <div id="not-found">
    <h1>页面不存在</h1>
    <p>你访问的页面不存在，请返回可用入口。</p>
    <div class="links">
      <router-link to="/">返回主游戏</router-link>
      <router-link to="/editor">前往关卡编辑器</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// NotFound component
</script>

<style scoped>
#not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #121212;
  color: #fff;
  font-family: "Microsoft YaHei", sans-serif;
  gap: 12px;
  text-align: center;
}

.links {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

a {
  color: #4da6ff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
