<template>
  <div class="settings-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">系统设置</h2>
        <p class="page-description">管理系统配置、参数和偏好设置</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="saveSettings" :loading="saving">
          <el-icon><Check /></el-icon>
          保存设置
        </el-button>
        <el-button @click="resetSettings">
          <el-icon><RefreshLeft /></el-icon>
          重置默认
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="settings-content">
      <!-- 左侧：设置导航 -->
      <el-col :span="6">
        <el-card class="settings-nav">
          <template #header>
            <span>设置分类</span>
          </template>

          <el-menu
            :default-active="activeTab"
            mode="vertical"
            @select="handleTabSelect"
          >
            <el-menu-item index="general">
              <el-icon><Setting /></el-icon>
              <span>通用设置</span>
            </el-menu-item>
            <el-menu-item index="notification">
              <el-icon><Bell /></el-icon>
              <span>通知设置</span>
            </el-menu-item>
            <el-menu-item index="security">
              <el-icon><Lock /></el-icon>
              <span>安全设置</span>
            </el-menu-item>
            <el-menu-item index="storage">
              <el-icon><FolderOpened /></el-icon>
              <span>存储设置</span>
            </el-menu-item>
            <el-menu-item index="api">
              <el-icon><Connection /></el-icon>
              <span>API配置</span>
            </el-menu-item>
            <el-menu-item index="advanced">
              <el-icon><Tools /></el-icon>
              <span>高级设置</span>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>

      <!-- 右侧：设置内容 -->
      <el-col :span="18">
        <!-- 通用设置 -->
        <el-card v-show="activeTab === 'general'" class="settings-panel">
          <template #header>
            <span>通用设置</span>
          </template>

          <el-form :model="settings.general" label-width="120px">
            <el-form-item label="系统名称">
              <el-input v-model="settings.general.systemName" placeholder="Webhook配置管理系统" />
            </el-form-item>

            <el-form-item label="系统描述">
              <el-input
                v-model="settings.general.systemDescription"
                type="textarea"
                :rows="3"
                placeholder="统一管理Webhook配置的智能化平台"
              />
            </el-form-item>

            <el-form-item label="默认语言">
              <el-select v-model="settings.general.language" style="width: 200px">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>

            <el-form-item label="主题模式">
              <el-radio-group v-model="settings.general.theme">
                <el-radio label="light">浅色模式</el-radio>
                <el-radio label="dark">深色模式</el-radio>
                <el-radio label="auto">跟随系统</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="自动刷新">
              <el-switch
                v-model="settings.general.autoRefresh"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>

            <el-form-item label="刷新间隔">
              <el-input-number
                v-model="settings.general.refreshInterval"
                :min="5"
                :max="300"
                :disabled="!settings.general.autoRefresh"
              />
              <span style="margin-left: 8px">秒</span>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 通知设置 -->
        <el-card v-show="activeTab === 'notification'" class="settings-panel">
          <template #header>
            <span>通知设置</span>
          </template>

          <el-form :model="settings.notification" label-width="120px">
            <el-form-item label="邮件通知">
              <el-switch
                v-model="settings.notification.emailEnabled"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>

            <el-form-item label="邮件地址" v-if="settings.notification.emailEnabled">
              <el-input
                v-model="settings.notification.emailAddress"
                placeholder="admin@example.com"
                type="email"
              />
            </el-form-item>

            <el-form-item label="通知级别">
              <el-checkbox-group v-model="settings.notification.levels">
                <el-checkbox label="P0">P0 - 严重</el-checkbox>
                <el-checkbox label="P1">P1 - 警告</el-checkbox>
                <el-checkbox label="P2">P2 - 注意</el-checkbox>
                <el-checkbox label="P3">P3 - 信息</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="通知频率">
              <el-radio-group v-model="settings.notification.frequency">
                <el-radio label="realtime">实时通知</el-radio>
                <el-radio label="hourly">每小时汇总</el-radio>
                <el-radio label="daily">每日汇总</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="静音时间">
              <el-time-picker
                v-model="settings.notification.quietHours"
                is-range
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
              />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 安全设置 -->
        <el-card v-show="activeTab === 'security'" class="settings-panel">
          <template #header>
            <span>安全设置</span>
          </template>

          <el-form :model="settings.security" label-width="120px">
            <el-form-item label="API密钥">
              <el-input
                v-model="settings.security.apiKey"
                type="password"
                show-password
                placeholder="点击生成新的API密钥"
              >
                <template #append>
                  <el-button @click="generateApiKey">生成</el-button>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="访问限制">
              <el-switch
                v-model="settings.security.ipRestriction"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>

            <el-form-item label="允许IP" v-if="settings.security.ipRestriction">
              <el-input
                v-model="settings.security.allowedIPs"
                type="textarea"
                :rows="3"
                placeholder="每行一个IP地址或IP段"
              />
            </el-form-item>

            <el-form-item label="日志记录">
              <el-switch
                v-model="settings.security.logging"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>

            <el-form-item label="日志保留">
              <el-input-number
                v-model="settings.security.logRetention"
                :min="1"
                :max="365"
                :disabled="!settings.security.logging"
              />
              <span style="margin-left: 8px">天</span>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 存储设置 -->
        <el-card v-show="activeTab === 'storage'" class="settings-panel">
          <template #header>
            <span>存储设置</span>
          </template>

          <el-form :model="settings.storage" label-width="120px">
            <el-form-item label="存储位置">
              <el-radio-group v-model="settings.storage.location">
                <el-radio label="local">本地存储</el-radio>
                <el-radio label="cloud">云端存储</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="数据压缩">
              <el-switch
                v-model="settings.storage.compression"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>

            <el-form-item label="自动备份">
              <el-switch
                v-model="settings.storage.autoBackup"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>

            <el-form-item label="备份频率" v-if="settings.storage.autoBackup">
              <el-select v-model="settings.storage.backupFrequency">
                <el-option label="每日" value="daily" />
                <el-option label="每周" value="weekly" />
                <el-option label="每月" value="monthly" />
              </el-select>
            </el-form-item>

            <el-form-item label="存储使用量">
              <div class="storage-usage">
                <el-progress
                  :percentage="storageUsage.percentage"
                  :color="getStorageColor(storageUsage.percentage)"
                  :stroke-width="8"
                />
                <div class="usage-info">
                  <span>{{ storageUsage.used }} / {{ storageUsage.total }}</span>
                  <el-button size="small" @click="clearCache">清理缓存</el-button>
                </div>
              </div>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- API配置 -->
        <el-card v-show="activeTab === 'api'" class="settings-panel">
          <template #header>
            <span>API配置</span>
          </template>

          <el-form :model="settings.api" label-width="120px">
            <el-form-item label="API版本">
              <el-select v-model="settings.api.version">
                <el-option label="v1.0" value="v1.0" />
                <el-option label="v2.0" value="v2.0" />
              </el-select>
            </el-form-item>

            <el-form-item label="请求限制">
              <el-input-number
                v-model="settings.api.rateLimit"
                :min="10"
                :max="10000"
              />
              <span style="margin-left: 8px">请求/分钟</span>
            </el-form-item>

            <el-form-item label="超时时间">
              <el-input-number
                v-model="settings.api.timeout"
                :min="1000"
                :max="60000"
                :step="1000"
              />
              <span style="margin-left: 8px">毫秒</span>
            </el-form-item>

            <el-form-item label="CORS设置">
              <el-input
                v-model="settings.api.corsOrigins"
                type="textarea"
                :rows="3"
                placeholder="每行一个允许的域名，* 表示允许所有域名"
              />
            </el-form-item>

            <el-form-item label="API文档">
              <el-switch
                v-model="settings.api.docsEnabled"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 高级设置 -->
        <el-card v-show="activeTab === 'advanced'" class="settings-panel">
          <template #header>
            <span>高级设置</span>
          </template>

          <el-form :model="settings.advanced" label-width="120px">
            <el-form-item label="调试模式">
              <el-switch
                v-model="settings.advanced.debugMode"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>

            <el-form-item label="性能监控">
              <el-switch
                v-model="settings.advanced.performanceMonitoring"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>

            <el-form-item label="消息队列">
              <el-switch
                v-model="settings.advanced.messageQueue"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>

            <el-form-item label="并发处理">
              <el-input-number
                v-model="settings.advanced.concurrency"
                :min="1"
                :max="100"
              />
              <span style="margin-left: 8px">并发数</span>
            </el-form-item>

            <el-form-item label="缓存大小">
              <el-input-number
                v-model="settings.advanced.cacheSize"
                :min="10"
                :max="1000"
              />
              <span style="margin-left: 8px">MB</span>
            </el-form-item>

            <el-form-item label="危险操作">
              <el-button type="danger" @click="confirmDangerousOperation">
                <el-icon><Warning /></el-icon>
                重置系统
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 导入Element Plus图标
import {
  Check,
  RefreshLeft,
  Setting,
  Bell,
  Lock,
  FolderOpened,
  Connection,
  Tools,
  Warning,
  Download,
  Upload,
  View,
  Edit,
  Delete
} from '@element-plus/icons-vue'

const activeTab = ref('general')
const saving = ref(false)

// 设置数据
const settings = reactive({
  general: {
    systemName: 'Webhook配置管理系统',
    systemDescription: '统一管理Webhook配置的智能化平台',
    language: 'zh-CN',
    theme: 'light',
    autoRefresh: true,
    refreshInterval: 30
  },
  notification: {
    emailEnabled: false,
    emailAddress: '',
    levels: ['P0', 'P1'],
    frequency: 'realtime',
    quietHours: null
  },
  security: {
    apiKey: '',
    ipRestriction: false,
    allowedIPs: '',
    logging: true,
    logRetention: 30
  },
  storage: {
    location: 'local',
    compression: true,
    autoBackup: true,
    backupFrequency: 'daily'
  },
  api: {
    version: 'v1.0',
    rateLimit: 1000,
    timeout: 10000,
    corsOrigins: '*',
    docsEnabled: true
  },
  advanced: {
    debugMode: false,
    performanceMonitoring: true,
    messageQueue: true,
    concurrency: 10,
    cacheSize: 100
  }
})

// 存储使用情况
const storageUsage = ref({
  used: '2.3 MB',
  total: '10 MB',
  percentage: 23
})

// 事件处理
const handleTabSelect = (tab: string) => {
  activeTab.value = tab
}

const saveSettings = async () => {
  saving.value = true
  try {
    // 保存到localStorage
    localStorage.setItem('system-settings', JSON.stringify(settings))

    // 模拟保存延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    ElMessage.success('设置保存成功')
  } catch (error) {
    ElMessage.error('设置保存失败')
  } finally {
    saving.value = false
  }
}

const resetSettings = () => {
  ElMessageBox.confirm(
    '确定要重置所有设置为默认值吗？此操作不可恢复。',
    '重置确认',
    {
      confirmButtonText: '确定重置',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 重置为默认值
    Object.assign(settings, {
      general: {
        systemName: 'Webhook配置管理系统',
        systemDescription: '统一管理Webhook配置的智能化平台',
        language: 'zh-CN',
        theme: 'light',
        autoRefresh: true,
        refreshInterval: 30
      },
      notification: {
        emailEnabled: false,
        emailAddress: '',
        levels: ['P0', 'P1'],
        frequency: 'realtime',
        quietHours: null
      },
      security: {
        apiKey: '',
        ipRestriction: false,
        allowedIPs: '',
        logging: true,
        logRetention: 30
      },
      storage: {
        location: 'local',
        compression: true,
        autoBackup: true,
        backupFrequency: 'daily'
      },
      api: {
        version: 'v1.0',
        rateLimit: 1000,
        timeout: 10000,
        corsOrigins: '*',
        docsEnabled: true
      },
      advanced: {
        debugMode: false,
        performanceMonitoring: true,
        messageQueue: true,
        concurrency: 10,
        cacheSize: 100
      }
    })

    ElMessage.success('设置已重置为默认值')
  })
}

const generateApiKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let apiKey = ''
  for (let i = 0; i < 32; i++) {
    apiKey += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  settings.security.apiKey = apiKey
  ElMessage.success('API密钥已生成')
}

const getStorageColor = (percentage: number) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

const clearCache = () => {
  ElMessageBox.confirm(
    '确定要清理缓存吗？这将删除临时文件和缓存数据。',
    '清理缓存',
    {
      confirmButtonText: '确定清理',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 模拟清理缓存
    setTimeout(() => {
      storageUsage.value.used = '1.2 MB'
      storageUsage.value.percentage = 12
      ElMessage.success('缓存清理完成')
    }, 1000)
  })
}

const confirmDangerousOperation = () => {
  ElMessageBox.confirm(
    '这是一个危险操作，将清空所有数据并重置系统。确定要继续吗？',
    '危险操作确认',
    {
      confirmButtonText: '确定执行',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    ElMessage.error('危险操作已执行（演示）')
  })
}

// 加载设置
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('system-settings')
    if (saved) {
      const savedSettings = JSON.parse(saved)
      Object.assign(settings, savedSettings)
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

// 生命周期
onMounted(() => {
  loadSettings()
})
</script>

<style scoped lang="scss">
.settings-container {
  max-width: 1200px;
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

.settings-content {
  .settings-nav {
    .el-menu {
      border: none;
    }
  }

  .settings-panel {
    margin-bottom: $spacing-lg;

    .el-form {
      max-width: 600px;
    }
  }
}

.storage-usage {
  .usage-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: $spacing-sm;
  }
}

.el-form-item {
  margin-bottom: $spacing-lg;
}

// 响应式适配
@media (max-width: 768px) {
  .settings-content {
    .el-col:first-child {
      margin-bottom: $spacing-lg;
    }
  }

  .page-header {
    flex-direction: column;
    gap: $spacing-md;
  }
}
</style>