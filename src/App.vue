<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
console.log('App.vue 已加载')
</script>

<style>
#app {
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 0;
}

html, body {
  margin: 0;
  padding: 0;
}
</style>