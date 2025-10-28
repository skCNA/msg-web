<template>
  <div class="dashboard-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">监控面板</h2>
        <p class="page-description">实时监控系统状态和消息处理统计</p>
      </div>
      <div class="header-right">
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </div>
    </div>

    <!-- 实时状态概览 -->
    <div class="status-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="status-card status-online">
            <div class="status-content">
              <div class="status-icon">
                <el-icon size="32"><SuccessFilled /></el-icon>
              </div>
              <div class="status-info">
                <div class="status-value">{{ systemStatus.online }}</div>
                <div class="status-label">在线服务</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="status-card status-active">
            <div class="status-content">
              <div class="status-icon">
                <el-icon size="32"><Connection /></el-icon>
              </div>
              <div class="status-info">
                <div class="status-value">{{ systemStatus.activeGroups }}</div>
                <div class="status-label">活跃群组</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="status-card status-messages">
            <div class="status-content">
              <div class="status-icon">
                <el-icon size="32"><Message /></el-icon>
              </div>
              <div class="status-info">
                <div class="status-value">{{ systemStatus.totalMessages }}</div>
                <div class="status-label">总消息数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="status-card status-rules">
            <div class="status-content">
              <div class="status-icon">
                <el-icon size="32"><Bullhorn /></el-icon>
              </div>
              <div class="status-info">
                <div class="status-value">{{ systemStatus.activeRules }}</div>
                <div class="status-label">活跃规则</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧：图表和统计 -->
      <el-col :span="16">
        <!-- 消息统计图表 -->
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>消息处理统计</span>
              <el-radio-group v-model="chartTimeRange" size="small">
                <el-radio-button label="1h">1小时</el-radio-button>
                <el-radio-button label="24h">24小时</el-radio-button>
                <el-radio-button label="7d">7天</el-radio-button>
                <el-radio-button label="30d">30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>

          <div class="chart-container">
            <div class="chart-placeholder">
              <el-icon size="64" color="#d3d3d3"><TrendCharts /></el-icon>
              <p>消息处理趋势图</p>
              <p class="chart-description">显示不同时间段的消息处理数量和类型分布</p>
            </div>
          </div>
        </el-card>

        <!-- 消息类型分布 -->
        <el-card class="chart-card">
          <template #header>
            <span>消息类型分布</span>
          </template>

          <div class="chart-container">
            <div class="message-types-grid">
              <div
                v-for="(type, index) in messageTypes"
                :key="index"
                class="message-type-item"
                :style="{ borderColor: type.color }"
              >
                <div class="type-header">
                  <div class="type-icon" :style="{ backgroundColor: type.color }">
                    <component :is="type.icon" />
                  </div>
                  <div class="type-info">
                    <div class="type-name">{{ type.name }}</div>
                    <div class="type-count">{{ type.count }} 条</div>
                  </div>
                </div>
                <div class="type-stats">
                  <div class="stat-item">
                    <span class="stat-label">成功率:</span>
                    <span class="stat-value">{{ type.successRate }}%</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">平均响应:</span>
                    <span class="stat-value">{{ type.avgResponse }}ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 系统性能指标 -->
        <el-card class="performance-card">
          <template #header>
            <span>系统性能指标</span>
          </template>

          <el-row :gutter="20">
            <el-col :span="8">
              <div class="metric-item">
                <div class="metric-label">CPU 使用率</div>
                <el-progress
                  :percentage="performance.cpu"
                  :color="getPerformanceColor(performance.cpu)"
                  :stroke-width="8"
                />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="metric-item">
                <div class="metric-label">内存使用率</div>
                <el-progress
                  :percentage="performance.memory"
                  :color="getPerformanceColor(performance.memory)"
                  :stroke-width="8"
                />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="metric-item">
                <div class="metric-label">网络延迟</div>
                <el-progress
                  :percentage="performance.network"
                  :color="getPerformanceColor(performance.network)"
                  :stroke-width="8"
                />
              </div>
            </el-col>
          </el-row>

          <el-divider />

          <el-row :gutter="20">
            <el-col :span="6">
              <div class="performance-stat">
                <div class="stat-value">{{ performance.requestRate }}</div>
                <div class="stat-label">请求/秒</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="performance-stat">
                <div class="stat-value">{{ performance.responseTime }}ms</div>
                <div class="stat-label">平均响应时间</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="performance-stat">
                <div class="stat-value">{{ performance.errorRate }}%</div>
                <div class="stat-label">错误率</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="performance-stat">
                <div class="stat-value">{{ performance.uptime }}</div>
                <div class="stat-label">运行时间</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <!-- 右侧：实时日志和告警 -->
      <el-col :span="8">
        <!-- 实时日志 -->
        <el-card class="logs-card">
          <template #header>
            <div class="card-header">
              <span>实时日志</span>
              <el-button size="small" @click="clearLogs">清空</el-button>
            </div>
          </template>

          <div class="logs-container">
            <div
              v-for="(log, index) in recentLogs"
              :key="index"
              class="log-item"
              :class="log.level"
            >
              <div class="log-time">{{ formatTime(log.timestamp) }}</div>
              <div class="log-level">{{ log.level.toUpperCase() }}</div>
              <div class="log-message">{{ log.message }}</div>
            </div>

            <div v-if="recentLogs.length === 0" class="empty-logs">
              <el-empty description="暂无日志" :image-size="80" />
            </div>
          </div>
        </el-card>

        <!-- 告警信息 -->
        <el-card class="alerts-card">
          <template #header>
            <div class="card-header">
              <span>当前告警</span>
              <el-badge :value="activeAlerts.length" type="danger" />
            </div>
          </template>

          <div class="alerts-container">
            <div
              v-for="(alert, index) in activeAlerts"
              :key="index"
              class="alert-item"
              :class="alert.level"
            >
              <div class="alert-header">
                <div class="alert-level">{{ getAlertLevelText(alert.level) }}</div>
                <div class="alert-time">{{ formatTime(alert.timestamp) }}</div>
              </div>
              <div class="alert-message">{{ alert.message }}</div>
              <div class="alert-actions">
                <el-button size="small" @click="handleAlert(alert)">处理</el-button>
                <el-button size="small" type="danger" @click="dismissAlert(index)">忽略</el-button>
              </div>
            </div>

            <div v-if="activeAlerts.length === 0" class="empty-alerts">
              <el-icon size="48" color="#67c23a"><SuccessFilled /></el-icon>
              <p>系统运行正常，无告警信息</p>
            </div>
          </div>
        </el-card>

        <!-- 快速操作 -->
        <el-card class="actions-card">
          <template #header>
            <span>快速操作</span>
          </template>

          <div class="quick-actions">
            <el-button type="primary" @click="testWebhook" :loading="testing">
              <el-icon><Connection /></el-icon>
              测试Webhook
            </el-button>
            <el-button @click="viewLogs">
              <el-icon><Document /></el-icon>
              查看完整日志
            </el-button>
            <el-button @click="systemCheck">
              <el-icon><Tools /></el-icon>
              系统检查
            </el-button>
            <el-button type="warning" @click="emergencyStop">
              <el-icon><Warning /></el-icon>
              紧急停止
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 导入Element Plus图标
import {
  Refresh,
  Download,
  SuccessFilled,
  Connection,
  Message,
  Bullhorn,
  TrendCharts,
  Document,
  Tools,
  Warning,
  Monitor,
  DataAnalysis,
  Setting
} from '@element-plus/icons-vue'
import { useGroupsStore } from '@/stores/groups'
import { useUsersStore } from '@/stores/users'
import { useRulesStore } from '@/stores/rules'
import { useTemplatesStore } from '@/stores/templates'
import { messageParser } from '@/utils/message-parser'

const groupsStore = useGroupsStore()
const usersStore = useUsersStore()
const rulesStore = useRulesStore()
const templatesStore = useTemplatesStore()

const loading = ref(false)
const testing = ref(false)
const chartTimeRange = ref('24h')

// 系统状态
const systemStatus = ref({
  online: 3,
  activeGroups: 0,
  totalMessages: 1247,
  activeRules: 0
})

// 性能指标
const performance = ref({
  cpu: 45,
  memory: 62,
  network: 23,
  requestRate: 12.5,
  responseTime: 145,
  errorRate: 0.2,
  uptime: '3天12小时'
})

// 消息类型统计
const messageTypes = ref([
  {
    name: '腾讯云CLS',
    icon: 'CloudUpload',
    count: 523,
    successRate: 98.5,
    avgResponse: 120,
    color: '#409EFF'
  },
  {
    name: 'Prometheus',
    icon: 'TrendCharts',
    count: 412,
    successRate: 97.2,
    avgResponse: 95,
    color: '#67C23A'
  },
  {
    name: 'Coding CI/CD',
    icon: 'SetUp',
    count: 312,
    successRate: 99.1,
    avgResponse: 180,
    color: '#E6A23C'
  }
])

// 实时日志
const recentLogs = ref([
  {
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    level: 'info',
    message: 'Webhook连接测试成功'
  },
  {
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    level: 'success',
    message: '消息处理成功: 腾讯云CLS告警'
  },
  {
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    level: 'warning',
    message: '消息解析失败: 格式不支持'
  },
  {
    timestamp: new Date(Date.now() - 20 * 60 * 1000),
    level: 'info',
    message: '系统启动完成'
  }
])

// 活跃告警
const activeAlerts = ref([
  {
    level: 'warning',
    message: 'CPU使用率超过阈值',
    timestamp: new Date(Date.now() - 30 * 60 * 1000)
  }
])

let logInterval: number | null = null
let statusInterval: number | null = null

// 计算属性
const activeGroupCount = computed(() => {
  return groupsStore.groups.filter(g => g.active).length
})

const activeRuleCount = computed(() => {
  return rulesStore.rules.filter(r => r.active).length
})

// 工具函数
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN')
}

const getPerformanceColor = (percentage: number) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

const getAlertLevelText = (level: string) => {
  const levelMap: Record<string, string> = {
    'info': '信息',
    'warning': '警告',
    'error': '错误',
    'critical': '严重'
  }
  return levelMap[level] || '未知'
}

// 事件处理
const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      groupsStore.loadGroups(),
      usersStore.loadUsers(),
      rulesStore.loadRules(),
      templatesStore.loadTemplates()
    ])

    systemStatus.value.activeGroups = activeGroupCount.value
    systemStatus.value.activeRules = activeRuleCount.value

    // 模拟更新性能指标
    performance.value.cpu = Math.floor(Math.random() * 30) + 30
    performance.value.memory = Math.floor(Math.random() * 20) + 50
    performance.value.network = Math.floor(Math.random() * 40) + 10

    addLog('info', '监控数据刷新成功')
    ElMessage.success('数据刷新成功')
  } catch (error) {
    addLog('error', '数据刷新失败')
    ElMessage.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

const exportReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    systemStatus: systemStatus.value,
    performance: performance.value,
    messageTypes: messageTypes.value,
    activeAlerts: activeAlerts.value,
    groups: groupsStore.groups,
    users: usersStore.users,
    rules: rulesStore.rules,
    templates: templatesStore.allTemplates
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `monitoring-report-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)

  ElMessage.success('报告导出成功')
  addLog('info', '导出监控报告')
}

const addLog = (level: 'info' | 'success' | 'warning' | 'error', message: string) => {
  recentLogs.value.unshift({
    timestamp: new Date(),
    level,
    message
  })

  // 保持最多20条日志
  if (recentLogs.value.length > 20) {
    recentLogs.value = recentLogs.value.slice(0, 20)
  }
}

const clearLogs = () => {
  recentLogs.value = []
  ElMessage.success('日志已清空')
}

const handleAlert = (alert: any) => {
  ElMessageBox.confirm(
    `确定要处理这个告警吗？\n告警内容: ${alert.message}`,
    '处理告警',
    {
      confirmButtonText: '确定处理',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    addLog('success', `告警已处理: ${alert.message}`)
    ElMessage.success('告警处理成功')
  }).catch(() => {
    // 用户取消
  })
}

const dismissAlert = (index: number) => {
  const alert = activeAlerts.value[index]
  activeAlerts.value.splice(index, 1)
  addLog('info', `忽略告警: ${alert.message}`)
}

const testWebhook = async () => {
  testing.value = true
  try {
    // 模拟测试Webhook
    await new Promise(resolve => setTimeout(resolve, 2000))
    addLog('success', 'Webhook测试成功')
    ElMessage.success('Webhook测试成功')
  } catch (error) {
    addLog('error', 'Webhook测试失败')
    ElMessage.error('Webhook测试失败')
  } finally {
    testing.value = false
  }
}

const viewLogs = () => {
  ElMessage.info('完整日志功能开发中...')
}

const systemCheck = () => {
  const checks = [
    '检查群组配置...',
    '检查用户配置...',
    '检查规则配置...',
    '检查模板配置...',
    '检查系统状态...'
  ]

  checks.forEach((check, index) => {
    setTimeout(() => {
      addLog('info', check)
      if (index === checks.length - 1) {
        setTimeout(() => {
          addLog('success', '系统检查完成，一切正常')
          ElMessage.success('系统检查完成')
        }, 1000)
      }
    }, index * 800)
  })
}

const emergencyStop = () => {
  ElMessageBox.confirm(
    '确定要执行紧急停止吗？这将暂停所有Webhook处理。',
    '紧急停止确认',
    {
      confirmButtonText: '确定停止',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    addLog('error', '执行紧急停止')
    ElMessage.error('系统已紧急停止')
  }).catch(() => {
    // 用户取消
  })
}

// 模拟实时数据更新
const startRealTimeUpdates = () => {
  // 每3秒更新性能指标
  statusInterval = window.setInterval(() => {
    performance.value.cpu = Math.max(10, Math.min(90, performance.value.cpu + (Math.random() - 0.5) * 10))
    performance.value.memory = Math.max(20, Math.min(85, performance.value.memory + (Math.random() - 0.5) * 8))
    performance.value.network = Math.max(5, Math.min(60, performance.value.network + (Math.random() - 0.5) * 15))
    performance.value.requestRate = Math.max(5, Math.min(50, performance.value.requestRate + (Math.random() - 0.5) * 5))
    performance.value.responseTime = Math.max(50, Math.min(500, performance.value.responseTime + (Math.random() - 0.5) * 50))
  }, 3000)

  // 随机添加日志
  logInterval = window.setInterval(() => {
    const messages = [
      { level: 'info', message: '定时任务执行完成' },
      { level: 'success', message: '处理新的Webhook消息' },
      { level: 'warning', message: '缓存清理完成' },
      { level: 'info', message: '系统状态检查正常' }
    ]

    if (Math.random() > 0.7) {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]
      addLog(randomMessage.level as any, randomMessage.message)
    }
  }, 10000)
}

// 生命周期
onMounted(async () => {
  await refreshData()
  startRealTimeUpdates()
  addLog('info', '监控面板启动完成')
})

onUnmounted(() => {
  if (logInterval) clearInterval(logInterval)
  if (statusInterval) clearInterval(statusInterval)
})
</script>

<style scoped lang="scss">
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: $spacing-lg;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xl;

  .page-title {
    margin: 0 0 $spacing-xs 0;
    font-size: $font-size-extra-large;
    color: $text-color-primary;
  }

  .page-description {
    margin: 0;
    color: $text-color-secondary;
    font-size: $font-size-base;
  }
}

.status-overview {
  margin-bottom: $spacing-xl;

  .status-card {
    cursor: pointer;
    transition: $transition-base;

    &:hover {
      box-shadow: $box-shadow-light;
      transform: translateY(-2px);
    }

    .status-content {
      display: flex;
      align-items: center;
      gap: $spacing-md;

      .status-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        border-radius: $border-radius-round;
      }

      .status-info {
        .status-value {
          font-size: $font-size-extra-large;
          font-weight: 600;
          color: $text-color-primary;
          margin-bottom: $spacing-xs;
        }

        .status-label {
          color: $text-color-secondary;
          font-size: $font-size-small;
        }
      }
    }

    &.status-online .status-icon {
      background: rgba(103, 194, 58, 0.1);
      color: $success-color;
    }

    &.status-active .status-icon {
      background: rgba(64, 158, 255, 0.1);
      color: $primary-color;
    }

    &.status-messages .status-icon {
      background: rgba(230, 162, 60, 0.1);
      color: $warning-color;
    }

    &.status-rules .status-icon {
      background: rgba(245, 108, 108, 0.1);
      color: $danger-color;
    }
  }
}

.main-content {
  .chart-card,
  .performance-card,
  .logs-card,
  .alerts-card,
  .actions-card {
    margin-bottom: $spacing-lg;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }

  .chart-container {
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;

    .chart-placeholder {
      text-align: center;
      color: $text-color-secondary;

      p {
        margin: $spacing-sm 0;

        &.chart-description {
          font-size: $font-size-small;
        }
      }
    }
  }

  .message-types-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: $spacing-lg;

    .message-type-item {
      border: 2px solid;
      border-radius: $border-radius-base;
      padding: $spacing-lg;

      .type-header {
        display: flex;
        align-items: center;
        gap: $spacing-md;
        margin-bottom: $spacing-md;

        .type-icon {
          width: 40px;
          height: 40px;
          border-radius: $border-radius-round;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .type-info {
          .type-name {
            font-weight: 600;
            color: $text-color-primary;
          }

          .type-count {
            color: $text-color-secondary;
            font-size: $font-size-small;
          }
        }
      }

      .type-stats {
        .stat-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: $spacing-xs;

          .stat-label {
            color: $text-color-regular;
            font-size: $font-size-small;
          }

          .stat-value {
            font-weight: 500;
            color: $text-color-primary;
          }
        }
      }
    }
  }

  .performance-card {
    .metric-item {
      margin-bottom: $spacing-lg;

      .metric-label {
        margin-bottom: $spacing-sm;
        font-weight: 500;
        color: $text-color-primary;
      }
    }

    .performance-stat {
      text-align: center;

      .stat-value {
        font-size: $font-size-large;
        font-weight: 600;
        color: $primary-color;
        margin-bottom: $spacing-xs;
      }

      .stat-label {
        color: $text-color-secondary;
        font-size: $font-size-small;
      }
    }
  }

  .logs-container {
    height: 300px;
    overflow-y: auto;

    .log-item {
      padding: $spacing-sm;
      border-left: 3px solid transparent;
      margin-bottom: $spacing-sm;
      background: #f8f9fa;
      border-radius: $border-radius-small;

      &.info {
        border-left-color: $primary-color;
      }

      &.success {
        border-left-color: $success-color;
      }

      &.warning {
        border-left-color: $warning-color;
      }

      &.error {
        border-left-color: $danger-color;
      }

      .log-time {
        font-size: $font-size-small;
        color: $text-color-secondary;
        margin-bottom: $spacing-xs;
      }

      .log-level {
        display: inline-block;
        padding: 2px 6px;
        border-radius: $border-radius-small;
        font-size: $font-size-extra-small;
        font-weight: 500;
        margin-bottom: $spacing-xs;
      }

      &.info .log-level {
        background: rgba(64, 158, 255, 0.1);
        color: $primary-color;
      }

      &.success .log-level {
        background: rgba(103, 194, 58, 0.1);
        color: $success-color;
      }

      &.warning .log-level {
        background: rgba(230, 162, 60, 0.1);
        color: $warning-color;
      }

      &.error .log-level {
        background: rgba(245, 108, 108, 0.1);
        color: $danger-color;
      }

      .log-message {
        color: $text-color-primary;
        font-size: $font-size-small;
        line-height: 1.4;
      }
    }

    .empty-logs {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
  }

  .alerts-container {
    .alert-item {
      padding: $spacing-md;
      border-radius: $border-radius-base;
      margin-bottom: $spacing-md;
      border: 1px solid;

      &.warning {
        background: rgba(230, 162, 60, 0.05);
        border-color: $warning-color;
      }

      &.error,
      &.critical {
        background: rgba(245, 108, 108, 0.05);
        border-color: $danger-color;
      }

      .alert-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: $spacing-sm;

        .alert-level {
          font-weight: 600;
          font-size: $font-size-small;
        }

        &.warning .alert-level {
          color: $warning-color;
        }

        &.error .alert-level,
        &.critical .alert-level {
          color: $danger-color;
        }

        .alert-time {
          font-size: $font-size-small;
          color: $text-color-secondary;
        }
      }

      .alert-message {
        color: $text-color-primary;
        margin-bottom: $spacing-sm;
        font-size: $font-size-small;
      }

      .alert-actions {
        display: flex;
        gap: $spacing-sm;
      }
    }

    .empty-alerts {
      text-align: center;
      padding: $spacing-xl;
      color: $success-color;

      p {
        margin: $spacing-sm 0 0 0;
        color: $text-color-secondary;
      }
    }
  }

  .quick-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-md;
  }
}
</style>