<template>
  <div class="rules-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">规则配置</h2>
        <p class="page-description">配置消息匹配规则和自动分发策略</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建规则
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-value">{{ rules.length }}</div>
        <div class="stat-label">总规则数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ activeRules }}</div>
        <div class="stat-label">活跃规则</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ groups.length }}</div>
        <div class="stat-label">群组数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ users.length }}</div>
        <div class="stat-label">用户数</div>
      </div>
    </div>

    <!-- 规则列表 -->
    <div class="rules-content">
      <div v-if="loading" class="loading">
        <el-loading text="加载中..." />
      </div>

      <div v-else-if="rules.length === 0" class="empty-state">
        <el-empty description="暂无规则数据">
          <el-button type="primary" @click="initDemoData">
            初始化演示数据
          </el-button>
        </el-empty>
      </div>

      <div v-else class="rules-list">
        <div
          v-for="rule in rules"
          :key="rule.id"
          class="rule-card"
          :class="{ inactive: !rule.active }"
        >
          <div class="rule-header">
            <div class="rule-title">
              <h3>{{ rule.name }}</h3>
              <el-tag :type="getPriorityType(rule.priority)" size="small">
                {{ getPriorityText(rule.priority) }}
              </el-tag>
            </div>
            <div class="rule-actions">
              <div class="action-buttons">
                <el-button size="small" @click="editRule(rule)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button size="small" type="danger" @click="deleteRule(rule)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
              <el-switch
                v-model="rule.active"
                @change="toggleRule(rule)"
                size="small"
              />
            </div>
          </div>

          <div class="rule-content">
            <div class="rule-section">
              <strong>匹配关键字:</strong>
              <div class="keywords">
                <el-tag
                  v-for="keyword in rule.keywords"
                  :key="keyword"
                  size="small"
                  class="keyword-tag"
                >
                  {{ keyword }}
                </el-tag>
              </div>
            </div>

            <div class="rule-section">
              <strong>目标群组:</strong>
              <span class="group-name">{{ getGroupName(rule.group_id) }}</span>
            </div>

            <div class="rule-section">
              <strong>提及用户:</strong>
              <div class="users">
                <span
                  v-for="userId in rule.user_ids"
                  :key="userId"
                  class="user-tag"
                >
                  {{ getUserName(userId) }}
                </span>
              </div>
            </div>

            <div class="rule-section">
              <strong>卡片样式:</strong>
              <el-tag
                :color="getColorTagColor(rule.template_color)"
                size="small"
                effect="plain"
              >
                {{ getColorName(rule.template_color) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 规则编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingRule ? '编辑规则' : '新建规则'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="规则名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入规则名称"
          />
        </el-form-item>

        <el-form-item label="所属群组" prop="group_id">
          <el-select
            v-model="formData.group_id"
            placeholder="选择群组"
            style="width: 100%"
          >
            <el-option
              v-for="group in groups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="匹配关键字" prop="keywords">
          <div class="keywords-input">
            <div v-for="(keyword, index) in formData.keywords" :key="index" class="keyword-item">
              <el-input
                v-model="formData.keywords[index]"
                placeholder="输入关键字"
                style="margin-bottom: 8px"
              >
                <template #append>
                  <el-button @click="removeKeyword(index)" type="danger" size="small">
                    删除
                  </el-button>
                </template>
              </el-input>
            </div>
            <el-button @click="addKeyword" type="primary" size="small">
              添加关键字
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="提及用户" prop="user_ids">
          <el-select
            v-model="formData.user_ids"
            multiple
            placeholder="选择用户"
            style="width: 100%"
          >
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="卡片样式" prop="template_color">
          <el-radio-group v-model="formData.template_color">
            <el-radio-button label="red">红色</el-radio-button>
            <el-radio-button label="yellow">黄色</el-radio-button>
            <el-radio-button label="green">绿色</el-radio-button>
            <el-radio-button label="blue">蓝色</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="formData.priority">
            <el-radio :label="1">低</el-radio>
            <el-radio :label="5">中</el-radio>
            <el-radio :label="10">高</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="状态">
          <el-switch
            v-model="formData.active"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelDialog">取消</el-button>
          <el-button type="primary" @click="saveRule" :loading="saving">
            {{ editingRule ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 导入Element Plus图标
import {
  Plus,
  Refresh,
  Edit,
  Delete,
  VideoPlay
} from '@element-plus/icons-vue'
import { useRulesStore } from '@/stores/rules'
import { useGroupsStore } from '@/stores/groups'
import { useUsersStore } from '@/stores/users'
import { initDemoData } from '@/utils/init-demo-data'
import type { Rule } from '@/types'

const rulesStore = useRulesStore()
const groupsStore = useGroupsStore()
const usersStore = useUsersStore()

const loading = ref(false)
const rules = ref<Rule[]>([])
const groups = ref([])
const users = ref([])

// 对话框相关
const showCreateDialog = ref(false)
const editingRule = ref<Rule | null>(null)
const saving = ref(false)

// 表单数据
const formData = reactive({
  name: '',
  group_id: '',
  keywords: [''],
  user_ids: [],
  template_color: 'blue',
  priority: 5,
  active: true
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' }
  ],
  group_id: [
    { required: true, message: '请选择群组', trigger: 'change' }
  ],
  keywords: [
    { required: true, message: '请至少添加一个关键字', trigger: 'change' }
  ]
}

// 计算属性
const activeRules = computed(() => {
  return rules.value.filter(rule => rule.active).length
})

// 工具函数
const getPriorityType = (priority: number) => {
  if (priority >= 8) return 'danger'
  if (priority >= 5) return 'warning'
  return 'info'
}

const getPriorityText = (priority: number) => {
  if (priority >= 8) return '高'
  if (priority >= 5) return '中'
  return '低'
}

const getGroupName = (groupId: string) => {
  const group = groups.value.find((g: any) => g.id === groupId)
  return group?.name || '未知群组'
}

const getUserName = (userId: string) => {
  const user = users.value.find((u: any) => u.id === userId)
  return user?.name || '未知用户'
}

const getColorName = (color: string) => {
  const names: Record<string, string> = {
    'red': '红色',
    'yellow': '黄色',
    'green': '绿色',
    'blue': '蓝色'
  }
  return names[color] || '蓝色'
}

const getColorTagColor = (color: string) => {
  const colors: Record<string, string> = {
    'red': '#F56C6C',
    'yellow': '#E6A23C',
    'green': '#67C23A',
    'blue': '#409EFF'
  }
  return colors[color] || '#409EFF'
}

// 事件处理
const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      rulesStore.loadRules(),
      groupsStore.loadGroups(),
      usersStore.loadUsers()
    ])

    rules.value = [...rulesStore.rules]
    groups.value = [...groupsStore.groups]
    users.value = [...usersStore.users]

    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('数据加载失败:', error)
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

const initDemoData = async () => {
  try {
    loading.value = true

    // 清除现有数据
    localStorage.clear()

    // 初始化演示数据
    initDemoData()

    // 重新加载数据
    await refreshData()

    ElMessage.success('演示数据初始化成功')
  } catch (error) {
    console.error('初始化失败:', error)
    ElMessage.error('初始化失败')
  } finally {
    loading.value = false
  }
}

const toggleRule = async (rule: Rule) => {
  try {
    await rulesStore.updateRule(rule.id, { active: rule.active })
    ElMessage.success(`规则已${rule.active ? '启用' : '禁用'}`)
  } catch (error) {
    ElMessage.error('状态更新失败')
    rule.active = !rule.active // 回滚状态
  }
}

// 关键字操作
const addKeyword = () => {
  formData.keywords.push('')
}

const removeKeyword = (index: number) => {
  if (formData.keywords.length > 1) {
    formData.keywords.splice(index, 1)
  }
}

// 编辑规则
const editRule = (rule: Rule) => {
  editingRule.value = rule
  Object.assign(formData, {
    name: rule.name,
    group_id: rule.group_id,
    keywords: [...rule.keywords],
    user_ids: [...rule.user_ids],
    template_color: rule.template_color,
    priority: rule.priority,
    active: rule.active
  })
  showCreateDialog.value = true
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
    rules.value = rules.value.filter(r => r.id !== rule.id)
    ElMessage.success('规则删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('规则删除失败')
    }
  }
}

// 取消对话框
const cancelDialog = () => {
  showCreateDialog.value = false
  editingRule.value = null
  resetFormData()
}

// 重置表单数据
const resetFormData = () => {
  Object.assign(formData, {
    name: '',
    group_id: '',
    keywords: [''],
    user_ids: [],
    template_color: 'blue',
    priority: 5,
    active: true
  })
}

// 保存规则
const saveRule = async () => {
  // 简单验证
  if (!formData.name.trim()) {
    ElMessage.error('请输入规则名称')
    return
  }
  if (!formData.group_id) {
    ElMessage.error('请选择群组')
    return
  }
  if (!formData.keywords.some(k => k.trim())) {
    ElMessage.error('请至少添加一个关键字')
    return
  }

  try {
    saving.value = true

    // 过滤空的关键字
    const validKeywords = formData.keywords.filter(k => k.trim())

    const ruleData = {
      name: formData.name,
      group_id: formData.group_id,
      keywords: validKeywords,
      user_ids: formData.user_ids,
      template_color: formData.template_color,
      priority: formData.priority,
      active: formData.active
    }

    if (editingRule.value) {
      // 更新现有规则
      await rulesStore.updateRule(editingRule.value.id, ruleData)
      ElMessage.success('规则更新成功')

      // 更新本地数据
      const index = rules.value.findIndex(r => r.id === editingRule.value!.id)
      if (index !== -1) {
        rules.value[index] = { ...editingRule.value, ...ruleData }
      }
    } else {
      // 创建新规则
      const newRule = await rulesStore.addRule(ruleData)
      rules.value.push(newRule)
      ElMessage.success('规则创建成功')
    }

    cancelDialog()
  } catch (error) {
    console.error('保存规则失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 页面加载
onMounted(async () => {
  await refreshData()
})
</script>

<style scoped lang="scss">
.rules-container {
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

.rules-content {
  .loading {
    text-align: center;
    padding: $spacing-xl;
  }

  .empty-state {
    text-align: center;
    padding: $spacing-xl;
  }

  .rules-list {
    display: grid;
    gap: $spacing-lg;
  }
}

.rule-card {
  background: white;
  border: 1px solid $border-color-lighter;
  border-radius: $border-radius-base;
  padding: $spacing-lg;
  transition: $transition-base;

  &:hover {
    box-shadow: $box-shadow-base;
  }

  &.inactive {
    opacity: 0.6;
    background: #f8f9fa;
  }

  .rule-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $spacing-md;

    .rule-title {
      h3 {
        margin: 0 0 $spacing-xs 0;
        font-size: $font-size-large;
        color: $text-color-primary;
      }
    }
  }

  .rule-content {
    .rule-section {
      margin-bottom: $spacing-md;

      &:last-child {
        margin-bottom: 0;
      }

      strong {
        color: $text-color-primary;
        margin-right: $spacing-sm;
        display: inline-block;
        min-width: 80px;
      }

      .keywords {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-xs;
        margin-top: $spacing-xs;

        .keyword-tag {
          margin-right: $spacing-xs;
        }
      }

      .users {
        .user-tag {
          display: inline-block;
          margin: $spacing-xs $spacing-xs 0 0;
          padding: 2px 8px;
          background: #e1f3d8;
          color: #67c23a;
          border-radius: $border-radius-small;
          font-size: $font-size-small;
        }
      }

      .group-name {
        color: $primary-color;
        font-weight: 500;
      }
    }
  }
}

.rule-actions {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .action-buttons {
    display: flex;
    gap: $spacing-xs;
  }
}

.keywords-input {
  .keyword-item {
    margin-bottom: 8px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
}
</style>