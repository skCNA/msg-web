<template>
  <div class="simple-layout">
    <h2>简化Layout</h2>
    <router-view />
  </div>
</template>

<script setup lang="ts">
console.log('Layout组件已加载')
</script>

<style scoped>
.simple-layout {
  padding: 20px;
}
</style>