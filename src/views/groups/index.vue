<template>
  <div class="groups-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">群组配置管理</h2>
        <p class="page-description">管理Webhook接收群组和相关配置</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建群组
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><OfficeBuilding /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ groupsStore.groupCount }}</div>
          <div class="stat-label">总群组数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon success">
          <el-icon><Check /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ groupsStore.activeGroupCount }}</div>
          <div class="stat-label">活跃群组</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon info">
          <el-icon><Link /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalWebhooks }}</div>
          <div class="stat-label">Webhook总数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon warning">
          <el-icon><Bullhorn /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalRules }}</div>
          <div class="stat-label">规则总数</div>
        </div>
      </div>
    </div>

    <!-- 群组列表 -->
    <div class="groups-list">
      <el-empty v-if="groupsStore.groups.length === 0" description="暂无群组配置">
        <el-button type="primary" @click="showCreateDialog = true">
          创建第一个群组
        </el-button>
      </el-empty>

      <div v-else class="group-cards">
        <div
          v-for="group in groupsStore.groups"
          :key="group.id"
          class="group-card"
          :class="{ 'inactive': !group.active }"
        >
          <div class="card-header">
            <div class="group-info">
              <h3 class="group-name">{{ group.name }}</h3>
              <p class="group-identifier">标识符: {{ group.identifier }}</p>
              <p class="group-description">{{ group.description || '暂无描述' }}</p>
            </div>
            <div class="group-status">
              <el-tag :type="group.active ? 'success' : 'danger'" size="small">
                {{ group.active ? '活跃' : '停用' }}
              </el-tag>
            </div>
          </div>

          <div class="card-content">
            <div class="stats-row">
              <div class="stat-item">
                <el-icon><Link /></el-icon>
                <span>{{ group.webhooks.length }} 个Webhook</span>
              </div>
              <div class="stat-item">
                <el-icon><Bullhorn /></el-icon>
                <span>{{ getGroupRulesCount(group.id) }} 条规则</span>
              </div>
              <div class="stat-item">
                <el-icon><Document /></el-icon>
                <span>{{ getGroupTemplatesCount(group.id) }} 个模板</span>
              </div>
            </div>

            <div class="webhooks-status">
              <div class="webhook-indicator">
                <el-tooltip content="飞书连接状态">
                  <el-icon
                    :color="getFeishuStatus(group)?.color"
                    class="status-icon"
                  >
                    <ChatDotRound v-if="getFeishuStatus(group)?.connected" />
                    <ChatLineRound v-else />
                  </el-icon>
                </el-tooltip>
              </div>
              <div class="webhook-indicator">
                <el-tooltip content="企业微信连接状态">
                  <el-icon
                    :color="getWechatStatus(group)?.color"
                    class="status-icon"
                  >
                    <Message v-if="getWechatStatus(group)?.connected" />
                    <MessageBox v-else />
                  </el-icon>
                </el-tooltip>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <el-button size="small" @click="viewGroupDetail(group)">
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
            <el-button size="small" @click="editGroup(group)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-dropdown @command="(cmd) => handleGroupAction(cmd, group)">
              <el-button size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="test">测试连接</el-dropdown-item>
                  <el-dropdown-item command="toggle">
                    {{ group.active ? '停用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="duplicate">复制群组</el-dropdown-item>
                  <el-dropdown-item divided command="delete" class="danger-item">
                    删除群组
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑群组对话框 -->
    <GroupDialog
      v-model="showCreateDialog"
      :group="editingGroup"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
// 导入Element Plus图标
import {
  Plus,
  Edit,
  Delete,
  View,
  Setting,
  Message,
  MessageBox,
  Refresh,
  VideoPlay,
  CopyDocument,
  Connection
} from '@element-plus/icons-vue'
import type { Group } from '@/types'
import { useGroupsStore } from '@/stores/groups'
import { useRulesStore } from '@/stores/rules'
import { useTemplatesStore } from '@/stores/templates'
import GroupDialog from '@/components/GroupDialogSimple.vue'

const router = useRouter()
const groupsStore = useGroupsStore()
const rulesStore = useRulesStore()
const templatesStore = useTemplatesStore()

const showCreateDialog = ref(false)
const editingGroup = ref<Group | null>(null)

// 计算属性
const totalWebhooks = computed(() => {
  return groupsStore.groups.reduce((total, group) => total + group.webhooks.length, 0)
})

const totalRules = computed(() => {
  return rulesStore.rules.length
})

// 获取群组规则数量
const getGroupRulesCount = (groupId: string) => {
  return rulesStore.getRulesByGroup(groupId).length
}

// 获取群组模板数量（这里简化处理，实际可能需要群组关联模板）
const getGroupTemplatesCount = (groupId: string) => {
  return Math.floor(Math.random() * 5) + 1 // 临时数据
}

// 获取飞书连接状态
const getFeishuStatus = (group: Group) => {
  const feishuWebhook = group.webhooks.find(w => w.platform === 'feishu')
  return {
    connected: feishuWebhook?.enabled && feishuWebhook?.test_status === 'success',
    color: feishuWebhook?.enabled && feishuWebhook?.test_status === 'success' ? '#67C23A' : '#F56C6C'
  }
}

// 获取企业微信连接状态
const getWechatStatus = (group: Group) => {
  const wechatWebhook = group.webhooks.find(w => w.platform === 'wechat')
  return {
    connected: wechatWebhook?.enabled && wechatWebhook?.test_status === 'success',
    color: wechatWebhook?.enabled && wechatWebhook?.test_status === 'success' ? '#67C23A' : '#F56C6C'
  }
}

// 查看群组详情
const viewGroupDetail = (group: Group) => {
  router.push(`/groups/${group.id}`)
}

// 编辑群组
const editGroup = (group: Group) => {
  editingGroup.value = group
  showCreateDialog.value = true
}

// 处理群组操作
const handleGroupAction = async (command: string, group: Group) => {
  switch (command) {
    case 'test':
      await testGroupConnections(group)
      break
    case 'toggle':
      await toggleGroupStatus(group)
      break
    case 'duplicate':
      await duplicateGroup(group)
      break
    case 'delete':
      await deleteGroup(group)
      break
  }
}

// 测试群组连接
const testGroupConnections = async (group: Group) => {
  ElMessage.info('测试连接功能开发中...')
}

// 切换群组状态
const toggleGroupStatus = async (group: Group) => {
  try {
    await groupsStore.toggleGroupStatus(group.id)
    ElMessage.success(`群组已${group.active ? '停用' : '启用'}`)
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 复制群组
const duplicateGroup = async (group: Group) => {
  try {
    const newGroupData = {
      ...group,
      name: `${group.name} (副本)`,
      identifier: `${group.identifier}_copy`
    }
    delete (newGroupData as any).id
    delete (newGroupData as any).created_at
    delete (newGroupData as any).updated_at

    await groupsStore.addGroup(newGroupData)
    ElMessage.success('群组复制成功')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 删除群组
const deleteGroup = async (group: Group) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除群组 "${group.name}" 吗？此操作将同时删除相关的规则配置，且不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await groupsStore.deleteGroup(group.id)
    ElMessage.success('群组删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 对话框成功回调
const handleDialogSuccess = () => {
  showCreateDialog.value = false
  editingGroup.value = null
}

// 页面加载
onMounted(async () => {
  await Promise.all([
    groupsStore.loadGroups(),
    rulesStore.loadRules(),
    templatesStore.loadTemplates()
  ])
})
</script>

<style scoped lang="scss">
.groups-container {
  max-width: 1200px;
  margin: 0 auto;
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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: $spacing-lg;
  background: $bg-color-page;
  border-radius: $border-radius-base;
  border: 1px solid $border-color-lighter;
  box-shadow: $box-shadow-base;

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: $border-radius-base;
    background: rgba(64, 158, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: $spacing-md;

    .el-icon {
      font-size: 24px;
      color: $primary-color;
    }

    &.success {
      background: rgba(103, 194, 58, 0.1);
      .el-icon {
        color: $success-color;
      }
    }

    &.info {
      background: rgba(144, 147, 153, 0.1);
      .el-icon {
        color: $info-color;
      }
    }

    &.warning {
      background: rgba(230, 162, 60, 0.1);
      .el-icon {
        color: $warning-color;
      }
    }
  }

  .stat-content {
    flex: 1;

    .stat-value {
      font-size: $font-size-extra-large;
      font-weight: 600;
      color: $text-color-primary;
      line-height: 1;
      margin-bottom: $spacing-xs;
    }

    .stat-label {
      font-size: $font-size-small;
      color: $text-color-secondary;
    }
  }
}

.groups-list {
  min-height: 400px;
}

.group-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: $spacing-lg;
}

.group-card {
  background: $bg-color-page;
  border-radius: $border-radius-base;
  border: 1px solid $border-color-lighter;
  box-shadow: $box-shadow-base;
  transition: $transition-base;
  overflow: hidden;

  &:hover {
    box-shadow: $box-shadow-light;
    transform: translateY(-2px);
  }

  &.inactive {
    opacity: 0.6;
    background: #f9f9f9;
  }
}

.card-header {
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color-lighter;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  .group-info {
    flex: 1;

    .group-name {
      margin: 0 0 $spacing-xs 0;
      font-size: $font-size-large;
      font-weight: 600;
      color: $text-color-primary;
    }

    .group-identifier {
      margin: 0 0 $spacing-xs 0;
      font-size: $font-size-small;
      color: $text-color-secondary;
      font-family: 'Monaco', 'Menlo', monospace;
    }

    .group-description {
      margin: 0;
      font-size: $font-size-small;
      color: $text-color-regular;
      line-height: 1.4;
    }
  }
}

.card-content {
  padding: $spacing-lg;

  .stats-row {
    display: flex;
    gap: $spacing-lg;
    margin-bottom: $spacing-md;

    .stat-item {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      font-size: $font-size-small;
      color: $text-color-regular;

      .el-icon {
        color: $text-color-secondary;
      }
    }
  }

  .webhooks-status {
    display: flex;
    gap: $spacing-sm;

    .webhook-indicator {
      .status-icon {
        font-size: 18px;
      }
    }
  }
}

.card-actions {
  padding: $spacing-md $spacing-lg;
  background: #fafafa;
  border-top: 1px solid $border-color-lighter;
  display: flex;
  gap: $spacing-sm;
}

.danger-item {
  color: $danger-color;
}
</style>