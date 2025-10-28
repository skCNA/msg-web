<template>
  <div class="rules-simple-container">
    <h2>规则配置（简化版）</h2>
    <p>如果你能看到这个页面，说明基础功能正常。</p>

    <el-button type="primary" @click="showMessage">
      测试按钮
    </el-button>

    <div v-if="message" class="message">
      {{ message }}
    </div>

    <div class="rules-list">
      <h3>当前规则列表：</h3>
      <div v-if="rules.length === 0" class="empty">
        暂无规则
      </div>
      <div v-else>
        <div v-for="rule in rules" :key="rule.id" class="rule-item">
          <strong>{{ rule.name }}</strong> -
          关键字: {{ rule.keywords.join(', ') }} -
          状态: {{ rule.active ? '启用' : '禁用' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRulesStore } from '@/stores/rules'

const rulesStore = useRulesStore()
const message = ref('')

const rules = ref([])

const showMessage = () => {
  ElMessage.success('按钮点击成功！')
  message.value = '规则配置系统运行正常，时间：' + new Date().toLocaleString()
}

onMounted(async () => {
  try {
    await rulesStore.loadRules()
    rules.value = rulesStore.rules
    console.log('Rules loaded:', rules.value)
  } catch (error) {
    console.error('Failed to load rules:', error)
    ElMessage.error('加载规则失败')
  }
})
</script>

<style scoped>
.rules-simple-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.message {
  margin-top: 20px;
  padding: 10px;
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
  color: #1e40af;
}

.rules-list {
  margin-top: 30px;
}

.rule-item {
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #f9fafb;
}

.empty {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 20px;
}
</style>