<template>
  <div id="not-found">
    <h1>Page Not Found</h1>
    <p>The requested page does not exist.</p>
    <router-link to="/">Go to Main Game</router-link> | 
    <router-link to="/editor">Go to Level Editor</router-link>
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
}

.router-link {
  color: #4da6ff;
  text-decoration: none;
  margin: 5px;
}

.router-link:hover {
  text-decoration: underline;
}
</style>