<template>
  <div class="demo-manager">
    <div class="page-header">
      <h2>演示数据管理</h2>
      <p>管理系统演示数据，包括群组、用户和规则配置</p>
    </div>

    <div class="demo-actions">
      <el-card class="action-card">
        <template #header>
          <div class="card-header">
            <el-icon><DataBoard /></el-icon>
            <span>数据统计</span>
          </div>
        </template>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ groupCount }}</div>
            <div class="stat-label">群组数量</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ userCount }}</div>
            <div class="stat-label">用户数量</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ ruleCount }}</div>
            <div class="stat-label">规则数量</div>
          </div>
        </div>
      </el-card>

      <el-card class="action-card">
        <template #header>
          <div class="card-header">
            <el-icon><Tools /></el-icon>
            <span>数据操作</span>
          </div>
        </template>
        <div class="action-buttons">
          <el-button type="primary" @click="initData" :loading="loading">
            <el-icon><Plus /></el-icon>
            初始化演示数据
          </el-button>
          <el-button type="warning" @click="clearData" :loading="loading">
            <el-icon><Delete /></el-icon>
            清除所有数据
          </el-button>
          <el-button @click="exportData" :disabled="isEmpty">
            <el-icon><Download /></el-icon>
            导出配置
          </el-button>
          <el-button @click="refreshStats">
            <el-icon><Refresh /></el-icon>
            刷新统计
          </el-button>
        </div>
      </el-card>

      <el-card class="action-card">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>系统功能</span>
          </div>
        </template>
        <div class="feature-list">
          <div class="feature-item">
            <el-icon><OfficeBuilding /></el-icon>
            <div class="feature-content">
              <h4>群组配置</h4>
              <p>管理Webhook接收群组和连接配置</p>
              <el-button size="small" @click="$router.push('/groups')">管理群组</el-button>
            </div>
          </div>
          <div class="feature-item">
            <el-icon><User /></el-icon>
            <div class="feature-content">
              <h4>用户管理</h4>
              <p>管理用户信息和多平台账号配置</p>
              <el-button size="small" @click="$router.push('/users')">管理用户</el-button>
            </div>
          </div>
          <div class="feature-item">
            <el-icon><Bullhorn /></el-icon>
            <div class="feature-content">
              <h4>规则配置</h4>
              <p>配置消息匹配规则和用户提及策略</p>
              <el-button size="small" @click="$router.push('/rules')">管理规则</el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <div class="info-section">
      <el-alert
        title="使用说明"
        type="info"
        :closable="false"
        show-icon
      >
        <ol>
          <li>首次使用请点击"初始化演示数据"来创建示例配置</li>
          <li>系统会自动创建3个群组、5个用户和6条规则</li>
          <li>你可以基于这些示例配置进行修改和扩展</li>
          <li>所有数据都保存在浏览器本地存储中</li>
          <li>使用"导出配置"功能可以备份你的配置</li>
        </ol>
      </el-alert>
    </div>

    <div v-if="message" class="message-section">
      <el-alert
        :title="message.title"
        :type="message.type"
        :closable="true"
        @close="message = null"
        show-icon
      >
        {{ message.content }}
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useGroupsStore } from '@/stores/groups'
import { useUsersStore } from '@/stores/users'
import { useRulesStore } from '@/stores/rules'
import { configManager } from '@/utils/config-manager'
import { initDemoData, clearDemoData } from '@/utils/init-demo-data'

const groupsStore = useGroupsStore()
const usersStore = useUsersStore()
const rulesStore = useRulesStore()

const loading = ref(false)
const message = ref(null)
const groupCount = ref(0)
const userCount = ref(0)
const ruleCount = ref(0)

const isEmpty = ref(true)

// 刷新统计数据
const refreshStats = async () => {
  await Promise.all([
    groupsStore.loadGroups(),
    usersStore.loadUsers(),
    rulesStore.loadRules()
  ])

  groupCount.value = groupsStore.groups.length
  userCount.value = usersStore.users.length
  ruleCount.value = rulesStore.rules.length
  isEmpty.value = groupCount.value === 0 && userCount.value === 0 && ruleCount.value === 0
}

// 初始化演示数据
const initData = async () => {
  try {
    loading.value = true
    initDemoData()
    await refreshStats()

    message.value = {
      title: '初始化成功',
      type: 'success',
      content: `已创建 ${groupCount.value} 个群组、${userCount.value} 个用户和 ${ruleCount.value} 个规则`
    }

    ElMessage.success('演示数据初始化成功')
  } catch (error) {
    message.value = {
      title: '初始化失败',
      type: 'error',
      content: '请重试或检查浏览器控制台'
    }
    ElMessage.error('初始化失败')
  } finally {
    loading.value = false
  }
}

// 清除数据
const clearData = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有数据吗？此操作不可恢复。',
      '确认清除',
      {
        confirmButtonText: '确定清除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    loading.value = true
    clearDemoData()
    await refreshStats()

    message.value = {
      title: '清除成功',
      type: 'success',
      content: '所有数据已清除'
    }

    ElMessage.success('数据清除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清除失败')
    }
  } finally {
    loading.value = false
  }
}

// 导出数据
const exportData = () => {
  try {
    const data = configManager.exportConfig()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `webhook-config-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)

    ElMessage.success('配置导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  refreshStats()
})
</script>

<style scoped lang="scss">
.demo-manager {
  max-width: 1000px;
  margin: 0 auto;
  padding: $spacing-lg;
}

.page-header {
  text-align: center;
  margin-bottom: $spacing-xl;

  h2 {
    margin: 0 0 $spacing-xs 0;
    color: $text-color-primary;
  }

  p {
    margin: 0;
    color: $text-color-secondary;
  }
}

.demo-actions {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.action-card {
  .card-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-weight: 600;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-md;

    .stat-item {
      text-align: center;
      padding: $spacing-md;
      background: #f8f9fa;
      border-radius: $border-radius-base;

      .stat-value {
        font-size: $font-size-extra-large;
        font-weight: 600;
        color: $primary-color;
        margin-bottom: $spacing-xs;
      }

      .stat-label {
        font-size: $font-size-small;
        color: $text-color-secondary;
      }
    }
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
  }

  .feature-list {
    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: $spacing-md;
      margin-bottom: $spacing-lg;

      &:last-child {
        margin-bottom: 0;
      }

      .el-icon {
        font-size: 24px;
        color: $primary-color;
        margin-top: $spacing-xs;
      }

      .feature-content {
        flex: 1;

        h4 {
          margin: 0 0 $spacing-xs 0;
          color: $text-color-primary;
        }

        p {
          margin: 0 0 $spacing-sm 0;
          color: $text-color-secondary;
          font-size: $font-size-small;
        }
      }
    }
  }
}

.info-section {
  margin-bottom: $spacing-lg;
}

.message-section {
  margin-bottom: $spacing-lg;
}
</style>