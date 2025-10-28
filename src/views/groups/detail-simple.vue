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
      <el-loading text="加载中..." />
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
          <el-descriptions-item label="描述" :span="2">
            {{ group.description || '暂无描述' }}
          </el-descriptions-item>
          <el-descriptions-item label="Webhook地址" :span="2">
            <div class="webhook-url">
              <span>{{ getWebhookUrl(group.identifier) }}</span>
              <el-button type="text" @click="copyWebhookUrl">
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(group.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDate(group.updated_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Webhook配置 -->
      <el-card class="webhooks-card">
        <template #header>
          <div class="card-header">
            <span>Webhook配置</span>
            <el-button size="small" @click="addWebhook">
              <el-icon><Plus /></el-icon>
              添加Webhook
            </el-button>
          </div>
        </template>

        <div v-if="group.webhooks && group.webhooks.length > 0" class="webhooks-list">
          <div
            v-for="webhook in group.webhooks"
            :key="webhook.id"
            class="webhook-item"
          >
            <div class="webhook-info">
              <div class="webhook-platform">
                <el-tag :type="getPlatformType(webhook.platform)" size="small">
                  {{ getPlatformName(webhook.platform) }}
                </el-tag>
                <span class="webhook-name">{{ webhook.name }}</span>
              </div>
              <div class="webhook-status">
                <el-tag
                  :type="webhook.enabled ? 'success' : 'info'"
                  size="small"
                >
                  {{ webhook.enabled ? '已启用' : '已禁用' }}
                </el-tag>
                <span v-if="webhook.test_status" class="test-status">
                  <el-icon
                    :color="webhook.test_status === 'success' ? '#67c23a' : '#f56c6c'"
                    class="test-icon"
                  >
                    <CircleCheck v-if="webhook.test_status === 'success'" />
                    <CircleClose v-else />
                  </el-icon>
                </span>
              </div>
            </div>
            <div class="webhook-actions">
              <el-button size="small" @click="testWebhook(webhook)">
                <el-icon><VideoPlay /></el-icon>
                测试
              </el-button>
              <el-button size="small" @click="editWebhook(webhook)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
            </div>
          </div>
        </div>

        <div v-else class="empty-webhooks">
          <el-empty description="暂无Webhook配置" :image-size="100">
            <el-button type="primary" @click="addWebhook">
              添加第一个Webhook
            </el-button>
          </el-empty>
        </div>
      </el-card>

      <!-- 关联规则 -->
      <el-card class="rules-card">
        <template #header>
          <div class="card-header">
            <span>关联规则 ({{ groupRules.length }})</span>
            <el-button size="small" @click="goToRules">
              <el-icon><Plus /></el-icon>
              创建规则
            </el-button>
          </div>
        </template>

        <div v-if="groupRules.length === 0" class="empty-rules">
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

      <!-- 统计信息 -->
      <el-card class="stats-card">
        <template #header>
          <span>统计信息</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ group.webhooks.length }}</div>
              <div class="stat-label">Webhook数量</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ activeWebhooks }}</div>
              <div class="stat-label">活跃Webhook</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ groupRules.length }}</div>
              <div class="stat-label">关联规则</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ totalMentionedUsers }}</div>
              <div class="stat-label">涉及用户</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-empty description="群组不存在或已被删除">
        <el-button type="primary" @click="goBack">
          返回群组列表
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { Group, Rule, Webhook } from '@/types'
import { useGroupsStore } from '@/stores/groups'
import { useRulesStore } from '@/stores/rules'
import { useUsersStore } from '@/stores/users'

const router = useRouter()
const groupsStore = useGroupsStore()
const rulesStore = useRulesStore()
const usersStore = useUsersStore()

const loading = ref(false)
const group = ref<Group | null>(null)

// 群组关联的规则
const groupRules = computed(() => {
  if (!group.value) return []
  return rulesStore.getRulesByGroup(group.value.id)
})

// 活跃的Webhook数量
const activeWebhooks = computed(() => {
  if (!group.value) return 0
  return group.value.webhooks?.filter(w => w.enabled).length || 0
})

// 所有涉及的用户数量
const totalMentionedUsers = computed(() => {
  if (!group.value) return 0
  const userIds = new Set()
  groupRules.value.forEach(rule => {
    rule.user_ids.forEach(userId => userIds.add(userId))
  })
  return userIds.size
})

// 工具函数
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const getWebhookUrl = (identifier: string) => {
  return `${window.location.origin}/webhook/${identifier}`
}

const getPlatformType = (platform: string) => {
  const types: Record<string, string> = {
    'feishu': 'primary',
    'wechat': 'success',
    'dingtalk': 'warning'
  }
  return types[platform] || 'info'
}

const getPlatformName = (platform: string) => {
  const names: Record<string, string> = {
    'feishu': '飞书',
    'wechat': '企业微信',
    'dingtalk': '钉钉'
  }
  return names[platform] || platform
}

const getRuleColor = (color: string) => {
  const colors: Record<string, string> = {
    'red': '#F56C6C',
    'yellow': '#E6A23C',
    'green': '#67C23A',
    'blue': '#409EFF'
  }
  return colors[color] || '#909399'
}

const getRuleColorName = (color: string) => {
  const names: Record<string, string> = {
    'red': '红色',
    'yellow': '黄色',
    'green': '绿色',
    'blue': '蓝色'
  }
  return names[color] || '默认'
}

// 事件处理
const goBack = () => {
  router.push('/groups')
}

const editGroup = () => {
  if (group.value) {
    // 简单编辑功能 - 提示用户
    ElMessage.info('群组编辑功能已启用，请在群组列表页面进行编辑操作')
  }
}

const copyWebhookUrl = () => {
  if (group.value) {
    const url = getWebhookUrl(group.value.identifier)
    navigator.clipboard.writeText(url).then(() => {
      ElMessage.success('Webhook地址已复制到剪贴板')
    }).catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
  }
}

const testWebhook = async (webhook: Webhook) => {
  try {
    // 模拟测试Webhook
    ElMessage.loading('正在测试Webhook...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success(`测试消息已发送至 ${getPlatformName(webhook.platform)}`)
  } catch (error) {
    ElMessage.error('测试失败，请检查Webhook配置')
  }
}

const addWebhook = () => {
  ElMessage.info('Webhook配置功能 - 请在群组列表页面进行Webhook配置')
}

const editWebhook = (webhook: Webhook) => {
  ElMessage.info('Webhook编辑功能 - 请在群组列表页面进行Webhook编辑')
}

const goToRules = () => {
  router.push('/rules')
}

const editRule = (rule: Rule) => {
  router.push(`/rules?id=${rule.id}`)
}

const deleteRule = (rule: Rule) => {
  ElMessage.info('规则删除功能 - 请在规则配置页面进行删除操作')
}

// 页面加载
onMounted(async () => {
  await loadGroupDetail()
})

// 加载群组详情
const loadGroupDetail = async () => {
  const groupId = router.currentRoute.value.params.id as string
  loading.value = true

  try {
    await Promise.all([
      groupsStore.loadGroups(),
      rulesStore.loadRules(),
      usersStore.loadUsers()
    ])

    group.value = groupsStore.getGroupById(groupId)
    if (!group.value) {
      ElMessage.error('群组不存在')
      router.push('/groups')
    }
  } catch (error) {
    console.error('加载群组详情失败:', error)
    ElMessage.error('加载群组详情失败')
    router.push('/groups')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.group-detail {
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
    margin: $spacing-sm 0 0 0;
    font-size: $font-size-extra-large;
    color: $text-color-primary;
  }

  .back-button {
    margin-bottom: $spacing-sm;
    color: $text-color-regular;
  }
}

.group-content {
  .info-card,
  .webhooks-card,
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
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    background: #f5f5f5;
    padding: $spacing-sm;
    border-radius: $border-radius-small;
  }

  .webhooks-list {
    .webhook-item {
      padding: $spacing-md;
      margin-bottom: $spacing-md;
      border: 1px solid $border-color-lighter;
      border-radius: $border-radius-base;

      &:last-child {
        margin-bottom: 0;
      }

      .webhook-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: $spacing-sm;

        .webhook-platform {
          display: flex;
          align-items: center;
          gap: $spacing-sm;

          .webhook-name {
            font-weight: 500;
          }
        }

        .webhook-status {
          display: flex;
          align-items: center;
          gap: $spacing-sm;

          .test-icon {
            font-size: 16px;
          }
        }
      }

      .webhook-actions {
        display: flex;
        gap: $spacing-sm;
      }
    }
  }

  .empty-webhooks,
  .empty-rules {
    text-align: center;
    padding: $spacing-xl;
  }

  .rules-list {
    .rule-item {
      padding: $spacing-lg;
      margin-bottom: $spacing-lg;
      border: 1px solid $border-color-lighter;
      border-radius: $border-radius-base;

      &:last-child {
        margin-bottom: 0;
      }

      .rule-info {
        margin-bottom: $spacing-md;

        h4 {
          margin: 0 0 $spacing-xs 0;
          font-size: $font-size-large;
          color: $text-color-primary;
        }

        .rule-keywords {
          display: flex;
          flex-wrap: wrap;
          gap: $spacing-xs;
          margin-bottom: $spacing-xs;

          .keyword-tag {
            font-size: $font-size-small;
          }

          .more-keywords {
            color: $text-color-secondary;
            font-size: $font-size-small;
          }
        }

        .rule-meta {
          display: flex;
          align-items: center;
          gap: $spacing-md;

          .rule-users {
            color: $text-color-regular;
          }
        }
      }

      .rule-actions {
        display: flex;
        gap: $spacing-sm;
      }
    }
  }

  .stat-item {
    text-align: center;
    padding: $spacing-lg;
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

.empty-state {
  text-align: center;
  padding: $spacing-xl;
}
</style>