<template>
  <div class="storage-test">
    <el-card class="mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <span>存储方案测试</span>
          <el-tag :type="storageBackend === 'sqlite' ? 'success' : 'warning'">
            当前存储: {{ storageBackend }}
          </el-tag>
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 存储后端信息 -->
        <el-card>
          <template #header>存储后端信息</template>
          <div class="space-y-2">
            <div>后端类型: {{ storageBackend }}</div>
            <div v-if="storageInfo?.sqliteInfo">
              <div>数据库文件: {{ storageInfo.sqliteInfo.dbName }}</div>
              <div>文件系统: {{ storageInfo.sqliteInfo.fileSystemType }}</div>
              <div v-if="storageInfo.sqliteInfo.estimatedSize">
                估计大小: {{ storageInfo.sqliteInfo.estimatedSize }}
              </div>
              <div v-if="storageInfo.sqliteInfo.quota">
                存储配额: {{ storageInfo.sqliteInfo.quota }}
              </div>
            </div>
            <div v-if="storageInfo?.localStorageInfo">
              <div>localStorage 可用: {{ storageInfo.localStorageInfo.available }}</div>
              <div v-if="storageInfo.localStorageInfo.estimatedSize">
                估计大小: {{ storageInfo.localStorageInfo.estimatedSize }}
              </div>
            </div>
            <div v-if="stats">
              <div>群组数量: {{ stats.groups || 0 }}</div>
              <div>用户数量: {{ stats.users || 0 }}</div>
              <div>规则数量: {{ stats.rules || 0 }}</div>
              <div>模板数量: {{ stats.templates || 0 }}</div>
              <div v-if="stats.storageSize">存储大小: {{ formatBytes(stats.storageSize) }}</div>
            </div>
          </div>
        </el-card>

        <!-- 操作按钮 -->
        <el-card>
          <template #header>测试操作</template>
          <div class="space-y-2">
            <el-button @click="testAddGroup" type="primary" size="small">
              添加测试群组
            </el-button>
            <el-button @click="testAddUser" type="primary" size="small">
              添加测试用户
            </el-button>
            <el-button @click="testAddRule" type="primary" size="small">
              添加测试规则
            </el-button>
            <el-button @click="testAddTemplate" type="primary" size="small">
              添加测试模板
            </el-button>
            <el-button @click="loadData" type="info" size="small">
              刷新数据
            </el-button>
            <el-button @click="exportData" type="success" size="small">
              导出配置
            </el-button>
            <el-button @click="clearData" type="danger" size="small">
              清空数据
            </el-button>
            <el-button @click="migrateFromLocalStorage" type="warning" size="small">
              从 localStorage 迁移
            </el-button>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 数据展示 -->
    <el-card class="mb-4">
      <template #header>当前数据</template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="群组" name="groups">
          <div v-if="groups.length === 0" class="text-gray-500">暂无群组数据</div>
          <div v-else class="space-y-2">
            <div v-for="group in groups" :key="group.id" class="border p-2 rounded">
              <div class="font-semibold">{{ group.name }}</div>
              <div class="text-sm text-gray-600">{{ group.description }}</div>
              <div class="text-xs text-gray-400">
                创建时间: {{ formatDate(group.created_at) }}
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="用户" name="users">
          <div v-if="users.length === 0" class="text-gray-500">暂无用户数据</div>
          <div v-else class="space-y-2">
            <div v-for="user in users" :key="user.id" class="border p-2 rounded">
              <div class="font-semibold">{{ user.name }}</div>
              <div class="text-sm text-gray-600">{{ user.email }}</div>
              <div class="text-xs text-gray-400">
                创建时间: {{ formatDate(user.created_at) }}
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="规则" name="rules">
          <div v-if="rules.length === 0" class="text-gray-500">暂无规则数据</div>
          <div v-else class="space-y-2">
            <div v-for="rule in rules" :key="rule.id" class="border p-2 rounded">
              <div class="font-semibold">{{ rule.name }}</div>
              <div class="text-sm text-gray-600">关键词: {{ rule.keywords?.join(', ') }}</div>
              <div class="text-xs text-gray-400">
                创建时间: {{ formatDate(rule.created_at) }}
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="模板" name="templates">
          <div v-if="templates.length === 0" class="text-gray-500">暂无模板数据</div>
          <div v-else class="space-y-2">
            <div v-for="template in templates" :key="template.id" class="border p-2 rounded">
              <div class="font-semibold">{{ template.name }}</div>
              <div class="text-sm text-gray-600">{{ template.description }}</div>
              <div class="text-xs text-gray-400">
                更新时间: {{ formatDate(template.updated_at) }}
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 操作日志 -->
    <el-card>
      <template #header>操作日志</template>
      <div class="max-h-40 overflow-y-auto">
        <div v-for="(log, index) in logs" :key="index" class="text-sm py-1">
          <span class="text-gray-500">{{ formatDate(log.timestamp) }}</span>
          <span :class="log.type === 'success' ? 'text-green-600' : log.type === 'error' ? 'text-red-600' : 'text-blue-600'">
            {{ log.message }}
          </span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { configManagerV2 } from '@/utils/config-manager-v2'
import { StorageInfo } from '@/utils/storage-info'
import type { Group, User, Rule, Template } from '@/types'

const storageBackend = ref<'sqlite' | 'localStorage'>('localStorage')
const storageInfo = ref<any>(null)
const groups = ref<Group[]>([])
const users = ref<User[]>([])
const rules = ref<Rule[]>([])
const templates = ref<Template[]>([])
const stats = ref<any>(null)
const activeTab = ref('groups')
const logs = ref<Array<{
  timestamp: Date
  message: string
  type: 'success' | 'error' | 'info'
}>>([])

// 添加日志
function addLog(message: string, type: 'success' | 'error' | 'info' = 'info') {
  logs.value.unshift({
    timestamp: new Date(),
    message,
    type
  })

  // 保持日志数量在 50 条以内
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }
}

// 格式化日期
function formatDate(dateString: string | Date) {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 格式化字节大小
function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 加载数据
async function loadData() {
  try {
    // 加载存储信息
    storageInfo.value = await StorageInfo.getStorageInfo()

    // 加载业务数据
    groups.value = await configManagerV2.getGroupsAsync()
    users.value = await configManagerV2.getUsersAsync()
    rules.value = await configManagerV2.getRulesAsync()
    templates.value = await configManagerV2.getTemplatesAsync()
    stats.value = await configManagerV2.getStats()

    storageBackend.value = configManagerV2.getStorageBackend()
    addLog(`数据加载成功 (使用 ${storageBackend.value})`, 'success')
  } catch (error) {
    addLog(`数据加载失败: ${error}`, 'error')
    console.error('Failed to load data:', error)
  }
}

// 测试添加群组
async function testAddGroup() {
  try {
    const groupData = {
      name: `测试群组 ${Date.now()}`,
      identifier: `test-group-${Date.now()}`,
      description: '这是一个测试群组',
      webhooks: [{
        id: configManagerV2.generateId(),
        platform: 'webhook' as const,
        name: '测试Webhook',
        url: 'https://example.com/webhook',
        enabled: true
      }],
      active: true
    }

    const group = await configManagerV2.addGroupAsync(groupData)
    addLog(`添加群组成功: ${group.name}`, 'success')
    await loadData()
  } catch (error) {
    addLog(`添加群组失败: ${error}`, 'error')
    console.error('Failed to add group:', error)
  }
}

// 测试添加用户
async function testAddUser() {
  try {
    const userData = {
      name: `测试用户 ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      feishu_user_id: `feishu_${Date.now()}`,
      wechat_user_id: `wechat_${Date.now()}`,
      role: 'developer',
      active: true
    }

    const user = await configManagerV2.addUserAsync(userData)
    addLog(`添加用户成功: ${user.name}`, 'success')
    await loadData()
  } catch (error) {
    addLog(`添加用户失败: ${error}`, 'error')
    console.error('Failed to add user:', error)
  }
}

// 测试添加规则
async function testAddRule() {
  try {
    // 先确保有群组
    if (groups.value.length === 0) {
      await testAddGroup()
    }

    const groupId = groups.value[0]?.id
    if (!groupId) {
      addLog('没有可用的群组', 'error')
      return
    }

    const ruleData = {
      name: `测试规则 ${Date.now()}`,
      group_id: groupId,
      keywords: ['test', 'error', 'warning'],
      user_ids: [],
      template_color: 'blue' as const,
      priority: 1,
      active: true
    }

    const rule = await configManagerV2.addRuleAsync(ruleData)
    addLog(`添加规则成功: ${rule.name}`, 'success')
    await loadData()
  } catch (error) {
    addLog(`添加规则失败: ${error}`, 'error')
    console.error('Failed to add rule:', error)
  }
}

// 测试添加模板
async function testAddTemplate() {
  try {
    const templateData = {
      name: `测试模板 ${Date.now()}`,
      description: '这是一个测试模板',
      conditions: [{
        field: 'level',
        operator: 'equals' as const,
        value: 'error'
      }],
      style: {
        title_template: '{{title}}',
        template_color: 'red' as const,
        icon_token: 'error',
        tag_text: '告警',
        tag_color: 'red'
      },
      content: {
        left_content: ['{{message}}'],
        right_content: ['{{timestamp}}'],
        button_text: '查看详情'
      }
    }

    const template = await configManagerV2.addTemplateAsync(templateData)
    addLog(`添加模板成功: ${template.name}`, 'success')
    await loadData()
  } catch (error) {
    addLog(`添加模板失败: ${error}`, 'error')
    console.error('Failed to add template:', error)
  }
}

// 导出数据
async function exportData() {
  try {
    const data = await configManagerV2.exportConfigAsync()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `webhook-config-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    addLog('配置导出成功', 'success')
  } catch (error) {
    addLog(`配置导出失败: ${error}`, 'error')
    console.error('Failed to export config:', error)
  }
}

// 清空数据
async function clearData() {
  try {
    if (confirm('确定要清空所有数据吗？此操作不可撤销！')) {
      await configManagerV2.clearAllConfigAsync()
      addLog('所有数据已清空', 'info')
      await loadData()
    }
  } catch (error) {
    addLog(`清空数据失败: ${error}`, 'error')
    console.error('Failed to clear data:', error)
  }
}

// 从 localStorage 迁移
async function migrateFromLocalStorage() {
  try {
    await configManagerV2.migrateFromLocalStorage()
    addLog('数据迁移完成', 'success')
    await loadData()
  } catch (error) {
    addLog(`数据迁移失败: ${error}`, 'error')
    console.error('Failed to migrate from localStorage:', error)
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  await loadData()
  addLog('存储测试页面初始化完成', 'info')
})
</script>

<style scoped>
.storage-test {
  padding: 20px;
}
</style>