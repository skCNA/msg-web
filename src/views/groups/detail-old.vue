<template>
  <div class="group-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button type="text" @click="goBack" class="back-button">
          <el-icon><ArrowLeft /></el-icon>
          返回群组列表
        </el-button>
        <h2 v-if="group" class="page-title">{{ group.name }}</h2>
      </div>
      <div class="header-right">
        <el-button @click="editGroup">
          <el-icon><Edit /></el-icon>
          编辑群组
        </el-button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="group" class="group-content">
      <!-- 基本信息 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
            <el-tag :type="group.active ? 'success' : 'danger'">
              {{ group.active ? '活跃' : '停用' }}
            </el-tag>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="群组标识">
            <el-tag type="info">{{ group.identifier }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="群组名称">
            {{ group.name }}
          </el-descriptions-item>
          <el-descriptions-item label="Webhook地址" :span="2">
            <div class="webhook-url">
              <span>{{ getWebhookUrl(group.identifier) }}</span>
              <el-button type="text" @click="copyWebhookUrl">
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ group.description || '暂无描述' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(group.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDateTime(group.updated_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Webhook配置 -->
      <el-card class="webhook-card">
        <template #header>
          <div class="card-header">
            <span>Webhook配置</span>
            <el-button type="text" @click="showWebhookDialog = true">
              <el-icon><Plus /></el-icon>
              添加Webhook
            </el-button>
          </div>
        </template>

        <div v-if="group.webhooks.length === 0" class="empty-state">
          <el-empty description="暂无Webhook配置" :image-size="80">
            <el-button type="primary" @click="showWebhookDialog = true">
              添加第一个Webhook
            </el-button>
          </el-empty>
        </div>

        <div v-else class="webhooks-grid">
          <div
            v-for="webhook in group.webhooks"
            :key="webhook.id"
            class="webhook-card-item"
          >
            <div class="webhook-platform">
              <el-icon>
                <ChatDotRound v-if="webhook.platform === 'feishu'" />
                <Message v-else-if="webhook.platform === 'wechat'" />
                <Bell v-else />
              </el-icon>
              <span>{{ getPlatformName(webhook.platform) }}</span>
            </div>

            <div class="webhook-info">
              <h4>{{ webhook.name }}</h4>
              <p class="webhook-url-text">{{ truncateUrl(webhook.url) }}</p>
              <div class="webhook-status">
                <el-tag
                  :type="webhook.enabled ? 'success' : 'info'"
                  size="small"
                >
                  {{ webhook.enabled ? '启用' : '禁用' }}
                </el-tag>
                <el-tag
                  v-if="webhook.test_status"
                  :type="webhook.test_status === 'success' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ webhook.test_status === 'success' ? '连接正常' : '连接异常' }}
                </el-tag>
              </div>
            </div>

            <div class="webhook-actions">
              <el-button type="text" size="small" @click="testWebhook(webhook)">
                <el-icon><Connection /></el-icon>
              </el-button>
              <el-dropdown @command="(cmd) => handleWebhookAction(cmd, webhook)">
                <el-button type="text" size="small">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="toggle">
                      {{ webhook.enabled ? '禁用' : '启用' }}
                    </el-dropdown-item>
                    <el-dropdown-item divided command="delete">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 关联规则 -->
      <el-card class="rules-card">
        <template #header>
          <div class="card-header">
            <span>关联规则 ({{ groupRules.length }})</span>
            <el-button type="text" @click="goToRules">
              <el-icon><Setting /></el-icon>
              管理规则
            </el-button>
          </div>
        </template>

        <div v-if="groupRules.length === 0" class="empty-state">
          <el-empty description="暂无关联规则" :image-size="80">
            <el-button type="primary" @click="goToRules">
              创建第一个规则
            </el-button>
          </el-empty>
        </div>

        <div v-else class="rules-list">
          <div
            v-for="rule in groupRules"
            :key="rule.id"
            class="rule-item"
          >
            <div class="rule-info">
              <h4>{{ rule.name }}</h4>
              <div class="rule-keywords">
                <el-tag
                  v-for="keyword in rule.keywords.slice(0, 3)"
                  :key="keyword"
                  size="small"
                  class="keyword-tag"
                >
                  {{ keyword }}
                </el-tag>
                <span v-if="rule.keywords.length > 3" class="more-keywords">
                  +{{ rule.keywords.length - 3 }}
                </span>
              </div>
              <div class="rule-meta">
                <span class="rule-users">{{ rule.user_ids.length }} 个用户</span>
                <el-tag
                  :color="getRuleColor(rule.template_color)"
                  size="small"
                  effect="light"
                >
                  {{ getRuleColorName(rule.template_color) }}
                </el-tag>
              </div>
            </div>

            <div class="rule-actions">
              <el-button type="text" size="small" @click="editRule(rule)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button type="text" size="small" @click="deleteRule(rule)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 使用统计 -->
      <el-card class="stats-card">
        <template #header>
          <span>使用统计</span>
        </template>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ group.webhooks.length }}</div>
            <div class="stat-label">Webhook配置</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ groupRules.length }}</div>
            <div class="stat-label">匹配规则</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ getTotalUsers() }}</div>
            <div class="stat-label">关联用户</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">0</div>
            <div class="stat-label">今日消息</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Webhook编辑对话框 -->
    <WebhookDialog
      v-model="showWebhookDialog"
      :webhook="editingWebhook"
      :group-id="group?.id"
      @success="handleWebhookSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Group, Rule, Webhook } from '@/types'
import { useGroupsStore } from '@/stores/groups'
import { useRulesStore } from '@/stores/rules'
import WebhookDialog from '@/components/WebhookDialog.vue'

const route = useRoute()
const router = useRouter()
const groupsStore = useGroupsStore()
const rulesStore = useRulesStore()

const loading = ref(false)
const group = ref<Group | null>(null)
const showWebhookDialog = ref(false)
const editingWebhook = ref<Webhook | null>(null)

// 群组关联的规则
const groupRules = computed(() => {
  if (!group.value) return []
  return rulesStore.getRulesByGroup(group.value.id)
})

// 页面加载
onMounted(async () => {
  await loadGroupDetail()
})

// 加载群组详情
const loadGroupDetail = async () => {
  const groupId = route.params.id as string
  loading.value = true

  try {
    await Promise.all([
      groupsStore.loadGroups(),
      rulesStore.loadRules()
    ])

    group.value = groupsStore.getGroupById(groupId)
    if (!group.value) {
      ElMessage.error('群组不存在')
      router.push('/groups')
    }
  } catch (error) {
    ElMessage.error('加载群组详情失败')
    router.push('/groups')
  } finally {
    loading.value = false
  }
}

// 返回群组列表
const goBack = () => {
  router.push('/groups')
}

// 编辑群组
const editGroup = () => {
  if (group.value) {
    router.push(`/groups/${group.value.id}/edit`)
  }
}

// 复制Webhook URL
const copyWebhookUrl = async () => {
  if (!group.value) return

  const url = getWebhookUrl(group.value.identifier)
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('Webhook地址已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 获取Webhook URL
const getWebhookUrl = (identifier: string) => {
  const baseUrl = window.location.origin
  return `${baseUrl}/webhook/${identifier}`
}

// 获取平台名称
const getPlatformName = (platform: string) => {
  const names = {
    feishu: '飞书',
    wechat: '企业微信',
    dingtalk: '钉钉'
  }
  return names[platform as keyof typeof names] || platform
}

// 截断URL显示
const truncateUrl = (url: string) => {
  if (url.length > 50) {
    return url.substring(0, 50) + '...'
  }
  return url
}

// 测试Webhook
const testWebhook = async (webhook: Webhook) => {
  ElMessage.info('测试功能开发中...')
}

// 处理Webhook操作
const handleWebhookAction = async (command: string, webhook: Webhook) => {
  switch (command) {
    case 'edit':
      editingWebhook.value = webhook
      showWebhookDialog.value = true
      break
    case 'toggle':
      await toggleWebhook(webhook)
      break
    case 'delete':
      await deleteWebhook(webhook)
      break
  }
}

// 切换Webhook状态
const toggleWebhook = async (webhook: Webhook) => {
  if (!group.value) return

  const updatedWebhooks = group.value.webhooks.map(w =>
    w.id === webhook.id ? { ...w, enabled: !w.enabled } : w
  )

  await groupsStore.updateGroup(group.value.id, { webhooks: updatedWebhooks })
  await loadGroupDetail()
  ElMessage.success('Webhook状态已更新')
}

// 删除Webhook
const deleteWebhook = async (webhook: Webhook) => {
  if (!group.value) return

  try {
    await ElMessageBox.confirm(
      `确定要删除Webhook "${webhook.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const updatedWebhooks = group.value.webhooks.filter(w => w.id !== webhook.id)
    await groupsStore.updateGroup(group.value.id, { webhooks: updatedWebhooks })
    await loadGroupDetail()
    ElMessage.success('Webhook删除成功')
  } catch (error) {
    // 用户取消操作
  }
}

// 跳转到规则管理
const goToRules = () => {
  router.push({ path: '/rules', query: { groupId: group.value?.id } })
}

// 编辑规则
const editRule = (rule: Rule) => {
  router.push(`/rules/${rule.id}/edit`)
}

// 删除规则
const deleteRule = async (rule: Rule) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除规则 "${rule.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await rulesStore.deleteRule(rule.id)
    ElMessage.success('规则删除成功')
  } catch (error) {
    // 用户取消操作
  }
}

// 获取规则颜色
const getRuleColor = (color: string) => {
  const colors = {
    red: '#F56C6C',
    yellow: '#E6A23C',
    green: '#67C23A',
    blue: '#409EFF'
  }
  return colors[color as keyof typeof colors] || '#909399'
}

// 获取规则颜色名称
const getRuleColorName = (color: string) => {
  const names = {
    red: '红色',
    yellow: '黄色',
    green: '绿色',
    blue: '蓝色'
  }
  return names[color as keyof typeof names] || '默认'
}

// 获取总用户数
const getTotalUsers = () => {
  const userIds = new Set()
  groupRules.value.forEach(rule => {
    rule.user_ids.forEach(userId => userIds.add(userId))
  })
  return userIds.size
}

// Webhook操作成功回调
const handleWebhookSuccess = () => {
  showWebhookDialog.value = false
  editingWebhook.value = null
  loadGroupDetail()
}

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<style scoped lang="scss">
.group-detail {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xl;

  .header-left {
    .back-button {
      margin-bottom: $spacing-sm;
      color: $text-color-secondary;

      &:hover {
        color: $primary-color;
      }
    }

    .page-title {
      margin: 0;
      font-size: $font-size-extra-large;
      color: $text-color-primary;
    }
  }
}

.info-card,
.webhook-card,
.rules-card,
.stats-card {
  margin-bottom: $spacing-lg;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.webhook-url {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: $font-size-small;
  background: #f5f5f5;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-small;
}

.webhooks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $spacing-md;
}

.webhook-card-item {
  border: 1px solid $border-color-lighter;
  border-radius: $border-radius-base;
  padding: $spacing-md;
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
  transition: $transition-base;

  &:hover {
    border-color: $primary-color;
    box-shadow: $box-shadow-base;
  }

  .webhook-platform {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-sm;
    background: #f8f9fa;
    border-radius: $border-radius-small;

    .el-icon {
      font-size: 24px;
      color: $primary-color;
    }

    span {
      font-size: $font-size-small;
      color: $text-color-regular;
    }
  }

  .webhook-info {
    flex: 1;

    h4 {
      margin: 0 0 $spacing-xs 0;
      font-size: $font-size-medium;
      color: $text-color-primary;
    }

    .webhook-url-text {
      margin: 0 0 $spacing-sm 0;
      font-size: $font-size-small;
      color: $text-color-secondary;
      font-family: 'Monaco', 'Menlo', monospace;
    }

    .webhook-status {
      display: flex;
      gap: $spacing-xs;
    }
  }

  .webhook-actions {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }
}

.rules-list {
  .rule-item {
    border: 1px solid $border-color-lighter;
    border-radius: $border-radius-base;
    padding: $spacing-md;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-sm;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      border-color: $primary-color;
      box-shadow: $box-shadow-base;
    }

    .rule-info {
      flex: 1;

      h4 {
        margin: 0 0 $spacing-xs 0;
        font-size: $font-size-medium;
        color: $text-color-primary;
      }

      .rule-keywords {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        margin-bottom: $spacing-sm;

        .keyword-tag {
          font-size: $font-size-extra-small;
        }

        .more-keywords {
          font-size: $font-size-small;
          color: $text-color-secondary;
        }
      }

      .rule-meta {
        display: flex;
        align-items: center;
        gap: $spacing-md;

        .rule-users {
          font-size: $font-size-small;
          color: $text-color-secondary;
        }
      }
    }

    .rule-actions {
      display: flex;
      gap: $spacing-xs;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: $spacing-lg;

  .stat-item {
    text-align: center;

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

.empty-state {
  padding: $spacing-xl 0;
}
</style>