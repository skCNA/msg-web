<template>
  <div class="test-page">
    <h1>测试页面</h1>
    <p>如果你能看到这个页面，说明系统运行正常！</p>

    <el-button type="primary" @click="showMessage">
      点击测试
    </el-button>

    <div v-if="message" class="message">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const message = ref('')

const showMessage = () => {
  ElMessage.success('按钮点击成功！')
  message.value = '系统运行正常，时间：' + new Date().toLocaleString()
}
</script>

<style scoped>
.test-page {
  padding: 20px;
  text-align: center;
}

.message {
  margin-top: 20px;
  padding: 10px;
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
  color: #1e40af;
}
</style>