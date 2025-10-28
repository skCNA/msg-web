<template>
  <div class="rules-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">规则配置管理</h2>
        <p class="page-description">配置消息匹配规则和用户提及策略</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建规则
        </el-button>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-select
          v-model="selectedGroupId"
          placeholder="选择群组"
          style="width: 200px"
          clearable
          @change="handleFilter"
        >
          <el-option label="全部群组" value="" />
          <el-option
            v-for="group in groupsStore.groups"
            :key="group.id"
            :label="group.name"
            :value="group.id"
          />
        </el-select>

        <el-select
          v-model="statusFilter"
          placeholder="规则状态"
          style="width: 120px"
          clearable
          @change="handleFilter"
        >
          <el-option label="全部" value="" />
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>

        <el-input
          v-model="searchKeyword"
          placeholder="搜索规则名称或关键字..."
          style="width: 300px"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="filter-right">
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出规则
        </el-button>
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入规则
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-value">{{ rulesStore.ruleCount }}</div>
        <div class="stat-label">总规则数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ rulesStore.activeRuleCount }}</div>
        <div class="stat-label">启用规则</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ uniqueGroupsCount }}</div>
        <div class="stat-label">关联群组</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ totalKeywords }}</div>
        <div class="stat-label">关键字总数</div>
      </div>
    </div>

    <!-- 规则列表 -->
    <div class="rules-table">
      <el-table
        v-loading="rulesStore.loading"
        :data="paginatedRules"
        style="width: 100%"
        stripe
        @selection-change="handleSelectionChange"
        empty-text="暂无规则配置"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column label="规则信息" min-width="250">
          <template #default="{ row }">
            <div class="rule-info">
              <h4 class="rule-name">{{ row.name }}</h4>
              <div class="rule-keywords">
                <el-tag
                  v-for="keyword in row.keywords.slice(0, 3)"
                  :key="keyword"
                  size="small"
                  :type="getKeywordType(keyword)"
                  class="keyword-tag"
                >
                  {{ keyword }}
                </el-tag>
                <span v-if="row.keywords.length > 3" class="more-keywords">
                  +{{ row.keywords.length - 3 }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="所属群组" width="150">
          <template #default="{ row }">
            <div class="group-info">
              <el-tag size="small" type="info">
                {{ getGroupName(row.group_id) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="提及用户" width="200">
          <template #default="{ row }">
            <div class="users-info">
              <div v-if="row.user_ids.length > 0" class="user-avatars">
                <el-avatar
                  v-for="userId in row.user_ids.slice(0, 4)"
                  :key="userId"
                  :size="24"
                  class="user-avatar"
                >
                  {{ getUserInitial(userId) }}
                </el-avatar>
                <span v-if="row.user_ids.length > 4" class="more-users">
                  +{{ row.user_ids.length - 4 }}
                </span>
              </div>
              <span v-else class="no-users">未配置用户</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="卡片样式" width="100">
          <template #default="{ row }">
            <div class="style-indicator">
              <div
                class="color-dot"
                :style="{ backgroundColor: getRuleColor(row.template_color) }"
              ></div>
              <span class="style-name">{{ getStyleName(row.template_color) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">
              {{ getPriorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.active"
              @change="toggleRuleStatus(row)"
              :loading="loading"
            />
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="text" size="small" @click="testRule(row)">
                <el-icon><ChatDotRound /></el-icon>
                测试
              </el-button>
              <el-button type="text" size="small" @click="editRule(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-dropdown @command="(cmd) => handleRuleAction(cmd, row)">
                <el-button type="text" size="small">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="duplicate">复制规则</el-dropdown-item>
                    <el-dropdown-item command="export">导出规则</el-dropdown-item>
                    <el-dropdown-item divided command="delete" class="danger-item">
                      删除规则
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredRules.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 规则对话框 -->
    <RuleDialog
      v-model="showCreateDialog"
      :rule="editingRule"
      @success="handleDialogSuccess"
    />

    <!-- 规则测试对话框 -->
    <RuleTestDialog
      v-model="showTestDialog"
      :rule="testingRule"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Rule } from '@/types'
import { useRulesStore } from '@/stores/rules'
import { useGroupsStore } from '@/stores/groups'
import { useUsersStore } from '@/stores/users'
import RuleDialog from '@/components/RuleDialog.vue'
import RuleTestDialog from '@/components/RuleTestDialog.vue'

const rulesStore = useRulesStore()
const groupsStore = useGroupsStore()
const usersStore = useUsersStore()

const selectedGroupId = ref('')
const statusFilter = ref('')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const selectedRules = ref<Rule[]>([])
const loading = ref(false)

const showCreateDialog = ref(false)
const showTestDialog = ref(false)
const editingRule = ref<Rule | null>(null)
const testingRule = ref<Rule | null>(null)

// 计算属性
const filteredRules = computed(() => {
  let rules = rulesStore.rules

  // 群组筛选
  if (selectedGroupId.value) {
    rules = rules.filter(rule => rule.group_id === selectedGroupId.value)
  }

  // 状态筛选
  if (statusFilter.value) {
    const isActive = statusFilter.value === 'active'
    rules = rules.filter(rule => rule.active === isActive)
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    rules = rules.filter(rule =>
      rule.name.toLowerCase().includes(keyword) ||
      rule.keywords.some(k => k.toLowerCase().includes(keyword))
    )
  }

  return rules
})

// 分页后的规则列表
const paginatedRules = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRules.value.slice(start, end)
})

const uniqueGroupsCount = computed(() => {
  const groupIds = new Set(rulesStore.rules.map(rule => rule.group_id))
  return groupIds.size
})

const totalKeywords = computed(() => {
  return rulesStore.rules.reduce((total, rule) => total + rule.keywords.length, 0)
})

// 获取群组名称
const getGroupName = (groupId: string) => {
  const group = groupsStore.getGroupById(groupId)
  return group?.name || '未知群组'
}

// 获取用户首字母
const getUserInitial = (userId: string) => {
  const user = usersStore.getUserById(userId)
  return user?.name.charAt(0) || '?'
}

// 获取关键字类型
const getKeywordType = (keyword: string) => {
  if (keyword.includes('P0') || keyword.includes('紧急')) return 'danger'
  if (keyword.includes('P1') || keyword.includes('警告')) return 'warning'
  if (keyword.includes('成功') || keyword.includes('完成')) return 'success'
  return 'info'
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

// 获取样式名称
const getStyleName = (color: string) => {
  const names = {
    red: '红色',
    yellow: '黄色',
    green: '绿色',
    blue: '蓝色'
  }
  return names[color as keyof typeof names] || '默认'
}

// 获取优先级类型
const getPriorityType = (priority: number) => {
  if (priority >= 8) return 'danger'
  if (priority >= 5) return 'warning'
  return 'info'
}

// 获取优先级文本
const getPriorityText = (priority: number) => {
  if (priority >= 8) return '高'
  if (priority >= 5) return '中'
  return '低'
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
}

// 筛选处理
const handleFilter = () => {
  currentPage.value = 1
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 选择处理
const handleSelectionChange = (selection: Rule[]) => {
  selectedRules.value = selection
}

// 切换规则状态
const toggleRuleStatus = async (rule: Rule) => {
  loading.value = true
  try {
    await rulesStore.toggleRuleStatus(rule.id)
    ElMessage.success(`规则已${rule.active ? '启用' : '禁用'}`)
  } catch (error) {
    ElMessage.error('操作失败')
    // 恢复状态
    rule.active = !rule.active
  } finally {
    loading.value = false
  }
}

// 测试规则
const testRule = (rule: Rule) => {
  testingRule.value = rule
  showTestDialog.value = true
}

// 编辑规则
const editRule = (rule: Rule) => {
  editingRule.value = rule
  showCreateDialog.value = true
}

// 处理规则操作
const handleRuleAction = async (command: string, rule: Rule) => {
  switch (command) {
    case 'duplicate':
      await duplicateRule(rule)
      break
    case 'export':
      await exportRule(rule)
      break
    case 'delete':
      await deleteRule(rule)
      break
  }
}

// 复制规则
const duplicateRule = async (rule: Rule) => {
  try {
    const newRuleData = {
      ...rule,
      name: `${rule.name} (副本)`
    }
    delete (newRuleData as any).id
    delete (newRuleData as any).created_at

    await rulesStore.addRule(newRuleData as Omit<Rule, 'id' | 'created_at'>)
    ElMessage.success('规则复制成功')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 导出规则
const exportRule = async (rule: Rule) => {
  const data = JSON.stringify(rule, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `rule-${rule.name}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('规则导出成功')
}

// 删除规则
const deleteRule = async (rule: Rule) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除规则 "${rule.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await rulesStore.deleteRule(rule.id)
    ElMessage.success('规则删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 批量导出
const handleExport = () => {
  const rules = selectedRules.value.length > 0 ? selectedRules.value : rulesStore.rules
  const data = JSON.stringify(rules, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'rules.json'
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('规则导出成功')
}

// 批量导入
const handleImport = () => {
  ElMessage.info('导入功能开发中...')
}

// 对话框成功回调
const handleDialogSuccess = () => {
  showCreateDialog.value = false
  editingRule.value = null
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

// 页面加载
onMounted(async () => {
  await Promise.all([
    rulesStore.loadRules(),
    groupsStore.loadGroups(),
    usersStore.loadUsers()
  ])
})
</script>

<style scoped lang="scss">
.rules-container {
  max-width: 1400px;
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

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $bg-color-page;
  border-radius: $border-radius-base;
  border: 1px solid $border-color-lighter;

  .filter-left {
    display: flex;
    gap: $spacing-md;
  }

  .filter-right {
    display: flex;
    gap: $spacing-sm;
  }
}

.stats-row {
  display: flex;
  gap: $spacing-lg;
  margin-bottom: $spacing-lg;

  .stat-item {
    flex: 1;
    background: $bg-color-page;
    border-radius: $border-radius-base;
    border: 1px solid $border-color-lighter;
    padding: $spacing-lg;
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

.rules-table {
  background: $bg-color-page;
  border-radius: $border-radius-base;
  border: 1px solid $border-color-lighter;
  overflow: hidden;

  .rule-info {
    .rule-name {
      margin: 0 0 $spacing-xs 0;
      font-size: $font-size-medium;
      font-weight: 600;
      color: $text-color-primary;
    }

    .rule-keywords {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      flex-wrap: wrap;

      .keyword-tag {
        font-size: $font-size-extra-small;
      }

      .more-keywords {
        font-size: $font-size-small;
        color: $text-color-secondary;
      }
    }
  }

  .group-info {
    // 群组信息样式
  }

  .users-info {
    .user-avatars {
      display: flex;
      align-items: center;
      gap: $spacing-xs;

      .user-avatar {
        font-size: $font-size-extra-small;
        background: $primary-color;
        color: white;
        font-weight: 600;
      }

      .more-users {
        font-size: $font-size-small;
        color: $text-color-secondary;
        margin-left: $spacing-xs;
      }
    }

    .no-users {
      font-size: $font-size-small;
      color: $text-color-secondary;
    }
  }

  .style-indicator {
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .style-name {
      font-size: $font-size-small;
    }
  }

  .action-buttons {
    display: flex;
    gap: $spacing-xs;
  }

  .danger-item {
    color: $danger-color;
  }
}

.pagination-wrapper {
  padding: $spacing-lg;
  display: flex;
  justify-content: center;
  border-top: 1px solid $border-color-lighter;
}
</style>