<template>
  <div class="templates-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">模板配置管理</h2>
        <p class="page-description">配置飞书卡片消息模板，支持多种预设模板和自定义模板</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建模板
        </el-button>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索模板名称或描述..."
          style="width: 300px"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="statusFilter"
          placeholder="模板类型"
          style="width: 150px"
          clearable
          @change="handleFilter"
        >
          <el-option label="全部" value="" />
          <el-option label="系统预设" value="preset" />
          <el-option label="自定义" value="custom" />
        </el-select>
      </div>

      <div class="filter-right">
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出模板
        </el-button>
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入模板
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-value">{{ templatesStore.templateCount }}</div>
        <div class="stat-label">总模板数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ presetTemplateCount }}</div>
        <div class="stat-label">预设模板</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ customTemplateCount }}</div>
        <div class="stat-label">自定义模板</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ activeTemplateCount }}</div>
        <div class="stat-label">活跃模板</div>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 左侧：模板列表 -->
      <div class="templates-sidebar">
        <div class="sidebar-header">
          <h3>模板列表</h3>
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="list">列表</el-radio-button>
            <el-radio-button label="grid">网格</el-radio-button>
          </el-radio-group>
        </div>

        <div class="templates-list" v-if="viewMode === 'list'">
          <div
            v-for="template in filteredTemplates"
            :key="template.id"
            class="template-item"
            :class="{ active: selectedTemplate?.id === template.id }"
            @click="selectTemplate(template)"
          >
            <div class="template-header">
              <div class="template-info">
                <h4 class="template-name">{{ template.name }}</h4>
                <p class="template-desc">{{ template.description }}</p>
              </div>
              <div class="template-meta">
                <el-tag :type="isPreset(template) ? 'info' : 'success'" size="small">
                  {{ isPreset(template) ? '预设' : '自定义' }}
                </el-tag>
                <div class="color-indicator">
                  <div
                    class="color-dot"
                    :style="{ backgroundColor: getTemplateColor(template) }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="templates-grid" v-else>
          <div
            v-for="template in filteredTemplates"
            :key="template.id"
            class="template-card"
            :class="{ active: selectedTemplate?.id === template.id }"
            @click="selectTemplate(template)"
          >
            <div class="card-header">
              <span class="template-name">{{ template.name }}</span>
              <el-tag :type="isPreset(template) ? 'info' : 'success'" size="small">
                {{ isPreset(template) ? '预设' : '自定义' }}
              </el-tag>
            </div>
            <div class="card-body">
              <div class="template-desc">{{ template.description }}</div>
              <div class="template-preview">
                <div
                  class="preview-dot"
                  :style="{ backgroundColor: getTemplateColor(template) }"
                ></div>
                <span>{{ getStyleName(template) }}主题</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：模板详情和预览 -->
      <div class="template-detail">
        <div v-if="selectedTemplate" class="detail-content">
          <!-- 模板信息 -->
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <span>模板信息</span>
                <div class="header-actions">
                  <el-button size="small" @click="editTemplate">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                  <el-dropdown @command="(cmd) => handleTemplateAction(cmd, selectedTemplate)">
                    <el-button size="small">
                      <el-icon><MoreFilled /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="duplicate">复制模板</el-dropdown-item>
                        <el-dropdown-item command="export">导出模板</el-dropdown-item>
                        <el-dropdown-item divided command="delete" class="danger-item">
                          删除模板
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </template>

            <div class="template-details">
              <div class="detail-item">
                <span class="label">模板名称：</span>
                <span class="value">{{ selectedTemplate.name }}</span>
              </div>
              <div class="detail-item">
                <span class="label">描述：</span>
                <span class="value">{{ selectedTemplate.description }}</span>
              </div>
              <div class="detail-item">
                <span class="label">类型：</span>
                <span class="value">
                  <el-tag :type="isPreset(selectedTemplate) ? 'info' : 'success'">
                    {{ isPreset(selectedTemplate) ? '系统预设' : '自定义模板' }}
                  </el-tag>
                </span>
              </div>
              <div class="detail-item">
                <span class="label">创建时间：</span>
                <span class="value">{{ formatDate(selectedTemplate.created_at) }}</span>
              </div>
            </div>
          </el-card>

          <!-- 匹配条件 -->
          <el-card class="conditions-card">
            <template #header>
              <span>匹配条件</span>
            </template>

            <div v-if="selectedTemplate.conditions && selectedTemplate.conditions.length > 0" class="conditions-list">
              <div
                v-for="(condition, index) in selectedTemplate.conditions"
                :key="index"
                class="condition-item"
              >
                <span class="condition-text">
                  {{ getConditionText(condition) }}
                </span>
                <el-tag size="small" type="info">{{ condition.operator }}</el-tag>
              </div>
            </div>
            <div v-else class="empty-conditions">
              <span>无匹配条件，此模板适用于所有消息</span>
            </div>
          </el-card>

          <!-- 样式配置 -->
          <el-card class="style-card">
            <template #header>
              <span>样式配置</span>
            </template>

            <div class="style-config">
              <div class="style-item">
                <span class="label">标题模板：</span>
                <span class="value">{{ selectedTemplate.style.title_template }}</span>
              </div>
              <div class="style-item">
                <span class="label">模板颜色：</span>
                <div class="color-display">
                  <div
                    class="color-dot"
                    :style="{ backgroundColor: getTemplateColor(selectedTemplate) }"
                  ></div>
                  <span>{{ getStyleName(selectedTemplate) }}</span>
                </div>
              </div>
              <div class="style-item">
                <span class="label">图标：</span>
                <span class="value">{{ selectedTemplate.style.icon_token }}</span>
              </div>
              <div class="style-item">
                <span class="label">标签文本：</span>
                <span class="value">{{ selectedTemplate.style.tag_text }}</span>
              </div>
            </div>
          </el-card>

          <!-- 内容配置 -->
          <el-card class="content-card">
            <template #header>
              <span>内容配置</span>
            </template>

            <div class="content-config">
              <div class="config-section">
                <h5>左侧内容：</h5>
                <div class="content-list">
                  <div
                    v-for="(content, index) in getContentArray('left')"
                    :key="index"
                    class="content-item"
                  >
                    {{ content }}
                  </div>
                </div>
              </div>

              <div class="config-section">
                <h5>右侧内容：</h5>
                <div class="content-list">
                  <div
                    v-for="(content, index) in getContentArray('right')"
                    :key="index"
                    class="content-item"
                  >
                    {{ content }}
                  </div>
                </div>
              </div>

              <div class="config-section">
                <h5>按钮配置：</h5>
                <div class="button-config">
                  <span class="button-label">按钮文字：</span>
                  <span class="button-value">{{ selectedTemplate.content.button_text }}</span>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 实时预览 -->
          <el-card class="preview-card">
            <template #header>
              <span>实时预览</span>
            </template>

            <FeishuCardPreview
              :config="previewConfig"
              ref="previewRef"
            />
          </el-card>
        </div>

        <!-- 无选中模板的空状态 -->
        <div v-else class="empty-state">
          <el-empty description="请选择一个模板进行预览和编辑" :image-size="120">
            <p>从左侧列表中选择一个模板，或创建新模板</p>
          </el-empty>
        </div>
      </div>
    </div>

    <!-- 模板对话框 -->
    <TemplateDialog
      v-model="showCreateDialog"
      :template="editingTemplate"
      @confirm="handleDialogConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 导入Element Plus图标
import {
  Plus,
  Search,
  Download,
  Upload,
  Edit,
  Delete,
  View,
  Refresh,
  Star,
  MoreFilled
} from '@element-plus/icons-vue'
import type { Template } from '@/types'
import { useTemplatesStore } from '@/stores/templates'
import { useGroupsStore } from '@/stores/groups'
import { useUsersStore } from '@/stores/users'
import FeishuCardPreview from '@/components/FeishuCardPreview.vue'
import TemplateDialog from '@/components/TemplateDialog.vue'

const templatesStore = useTemplatesStore()
const groupsStore = useGroupsStore()
const usersStore = useUsersStore()

const searchKeyword = ref('')
const statusFilter = ref('')
const viewMode = ref('list')
const selectedTemplate = ref<Template | null>(null)
const showCreateDialog = ref(false)
const editingTemplate = ref<Template | null>(null)
const previewRef = ref()

const previewConfig = ref({
  title: '【P0紧急】muse-ability-production 服务异常',
  type: '腾讯云CLS告警',
  service: 'muse-ability-production',
  description: '文本安全校验不通过，检测到违规内容。错误信息：文本安全校验结果不通过，建议立即处理。',
  mentions: '张三,李四',
  color: 'red',
  buttonText: '查看详情'
})

// 计算属性
const filteredTemplates = computed(() => {
  let templates = templatesStore.allTemplates

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    templates = templates.filter(template =>
      template.name.toLowerCase().includes(keyword) ||
      template.description.toLowerCase().includes(keyword)
    )
  }

  // 类型过滤
  if (statusFilter.value) {
    const isPreset = statusFilter.value === 'preset'
    templates = templates.filter(template => {
      return isPreset ? ('isPreset' in template) : !('isPreset' in template)
    })
  }

  return templates
})

const presetTemplateCount = computed(() => {
  return templatesStore.allTemplates.filter(t => 'isPreset' in t).length
})

const customTemplateCount = computed(() => {
  return templatesStore.allTemplates.filter(t => !('isPreset' in t)).length
})

const activeTemplateCount = computed(() => {
  return templatesStore.allTemplates.length // 假设所有模板都是活跃的
})

// 工具函数
const isPreset = (template: any) => {
  return 'isPreset' in template
}

const getTemplateColor = (template: Template) => {
  const colors = {
    red: '#F56C6C',
    yellow: '#E6A23C',
    green: '#67C23A',
    blue: '#409EFF'
  }
  return colors[template.style.template_color as keyof typeof colors] || colors.blue
}

const getStyleName = (template: Template) => {
  const names = {
    red: '红色',
    yellow: '黄色',
    green: '绿色',
    blue: '蓝色'
  }
  return names[template.style.template_color as keyof typeof names] || '蓝色'
}

const getConditionText = (condition: any) => {
  return `${condition.field} ${condition.operator} "${condition.value}"`
}

const getContentArray = (side: 'left' | 'right') => {
  if (!selectedTemplate.value) return []

  const content = selectedTemplate.value.content
  return content[`${side}_content`] || []
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 事件处理
const handleSearch = () => {
  // 搜索逻辑
}

const handleFilter = () => {
  // 筛选逻辑
}

const selectTemplate = (template: Template) => {
  selectedTemplate.value = template

  // 更新预览配置
  if (previewRef.value) {
    previewRef.value.updateConfig({
      title: generatePreviewTitle(template),
      type: generatePreviewType(template),
      service: generatePreviewService(template),
      description: generatePreviewDescription(template)
    })
  }
}

const editTemplate = (template: Template) => {
  editingTemplate.value = template
  showCreateDialog.value = true
}

const handleTemplateAction = async (command: string, template: Template) => {
  switch (command) {
    case 'duplicate':
      await duplicateTemplate(template)
      break
    case 'export':
      await exportTemplate(template)
      break
    case 'delete':
      await deleteTemplate(template)
      break
  }
}

const duplicateTemplate = async (template: Template) => {
  try {
    const newTemplateData = {
      ...template,
      name: `${template.name} (副本)`
    }
    delete (newTemplateData as any).id
    delete (newTemplateData as any).created_at
    delete (newTemplateData as any).updated_at

    await templatesStore.addTemplate(newTemplateData as Omit<Template, 'id' | 'created_at' | 'updated_at'>)
    ElMessage.success('模板复制成功')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const exportTemplate = async (template: Template) => {
  const data = JSON.stringify(template, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `template-${template.name}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('模板导出成功')
}

const deleteTemplate = async (template: Template) => {
  if ('isPreset' in template) {
    ElMessage.warning('预设模板不能删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除模板 "${template.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await templatesStore.deleteTemplate(template.id)
    ElMessage.success('模板删除成功')
    if (selectedTemplate.value?.id === template.id) {
      selectedTemplate.value = null
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const generatePreviewTitle = (template: Template) => {
  const colorMap = {
    red: '【P0紧急】',
    yellow: '【P1警告】',
    green: '【成功】',
    blue: '【通知】'
  }
  return colorMap[template.style.template_color as keyof typeof colorMap] + (template.style.title_template || '消息通知')
}

const generatePreviewType = (template: Template) => {
  // 基于条件推断消息类型
  if (template.conditions && template.conditions.length > 0) {
    const condition = template.conditions[0]
    if (condition.field === 'level' && condition.value === 'P0') return 'P0紧急告警'
    if (condition.field === 'level' && condition.value === 'P1') return 'P1警告告警'
    if (condition.field === 'type' && condition.value.includes('cicd')) return 'CI/CD通知'
  }
  return '系统通知'
}

const generatePreviewService = (template: Template) => {
  // 从标题模板中提取服务名
  const titleTemplate = template.style.title_template
  const match = titleTemplate.match(/\{(\w+)\}/)
  return match ? match[1] : '未知服务'
}

const generatePreviewDescription = (template: Template) => {
  // 生成示例描述
  const type = generatePreviewType(template)
  const service = generatePreviewService(template)

  switch (type) {
    case 'P0紧急告警':
      return `${service}服务发生严重异常，需要立即处理`
    case 'P1警告告警':
      return `${service}服务出现警告，请及时关注`
    case 'CI/CD通知':
      return `${service}项目部署通知`
    default:
      return `${service}系统通知`
  }
}

// 对话框确认回调
const handleDialogConfirm = async (template: Template) => {
  try {
    if (editingTemplate.value) {
      // 编辑模式
      await templatesStore.updateTemplate(template.id, template)
      ElMessage.success('模板更新成功')
    } else {
      // 新建模式
      await templatesStore.addTemplate(template as Omit<Template, 'id' | 'created_at' | 'updated_at'>)
      ElMessage.success('模板创建成功')
    }

    showCreateDialog.value = false
    editingTemplate.value = null
  } catch (error) {
    ElMessage.error(editingTemplate.value ? '模板更新失败' : '模板创建失败')
  }
}

// 导入导出
const handleExport = () => {
  const templates = templatesStore.allTemplates
  const data = JSON.stringify(templates, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'templates.json'
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('模板导出成功')
}

const handleImport = () => {
  ElMessage.info('导入功能开发中...')
}

// 页面加载
onMounted(async () => {
  await Promise.all([
    templatesStore.loadTemplates(),
    groupsStore.loadGroups(),
    usersStore.loadUsers()
  ])
})
</script>

<style scoped lang="scss">
.templates-container {
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

.main-content {
  display: flex;
  gap: $spacing-xl;
  min-height: 600px;
}

.templates-sidebar {
  width: 350px;
  background: $bg-color-page;
  border-radius: $border-radius-base;
  border: 1px solid $border-color-lighter;
  padding: $spacing-lg;

  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-lg;

    h3 {
      margin: 0;
      color: $text-color-primary;
    }
  }

  .templates-list {
    max-height: 600px;
    overflow-y: auto;

    .template-item {
      padding: $spacing-md;
      margin-bottom: $spacing-sm;
      border: 1px solid $border-color-lighter;
      border-radius: $border-radius-base;
      cursor: pointer;
      transition: $transition-base;

      &:hover {
        border-color: $primary-color;
        box-shadow: $box-shadow-base;
      }

      &.active {
        border-color: $primary-color;
        background: rgba(64, 158, 255, 0.05);
      }

      &:last-child {
        margin-bottom: 0;
      }

      .template-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;

        .template-info {
          flex: 1;

          .template-name {
            margin: 0 0 $spacing-xs 0;
            font-size: $font-size-medium;
            font-weight: 600;
            color: $text-color-primary;
          }

          .template-desc {
            margin: 0;
            color: $text-color-secondary;
            font-size: $font-size-small;
            line-height: 1.4;
          }
        }

        .template-meta {
          display: flex;
          align-items: center;
          gap: $spacing-sm;

          .color-indicator {
            .color-dot {
              width: 12px;
              height: 12px;
              border-radius: 50%;
            }
          }
        }
      }
    }
  }

  .templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: $spacing-md;
    max-height: 600px;
    overflow-y: auto;

    .template-card {
      border: 1px solid $border-color-lighter;
      border-radius: $border-radius-base;
      padding: $spacing-md;
      cursor: pointer;
      transition: $transition-base;

      &:hover {
        border-color: $primary-color;
        box-shadow: $box-shadow-base;
      }

      &.active {
        border-color: $primary-color;
        background: rgba(64, 158, 255, 0.05);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: $spacing-sm;

        .template-name {
          font-weight: 600;
          color: $text-color-primary;
        }
      }

      .card-body {
        .template-desc {
          color: $text-color-secondary;
          font-size: $font-size-small;
          margin-bottom: $spacing-sm;
        }

        .template-preview {
          display: flex;
          align-items: center;
          gap: $spacing-xs;

          .preview-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }
        }
      }
    }
  }
}

.template-detail {
  flex: 1;
  background: $bg-color-page;
  border-radius: $border-radius-base;
  border: 1px solid $border-color-lighter;
  overflow: hidden;

  .detail-content {
    height: 100%;
    overflow-y: auto;
  }

  .info-card,
  .conditions-card,
  .style-card,
  .content-card,
  .preview-card {
    margin-bottom: $spacing-lg;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    color: $text-color-primary;
  }

  .template-details {
    .detail-item {
      display: flex;
      margin-bottom: $spacing-md;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        width: 100px;
        font-weight: 500;
        color: $text-color-regular;
      }

      .value {
        flex: 1;
        color: $text-color-primary;
      }
    }
  }

  .conditions-list {
    .condition-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $spacing-sm;
      background: #f8f9fa;
      border-radius: $border-radius-small;
      margin-bottom: $spacing-sm;

      &:last-child {
        margin-bottom: 0;
      }

      .condition-text {
        color: $text-color-primary;
      }
    }
  }

  .empty-conditions {
    text-align: center;
    color: $text-color-secondary;
    font-style: italic;
    padding: $spacing-lg;
  }

  .style-config {
    .style-item {
      display: flex;
      align-items: center;
      margin-bottom: $spacing-md;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        width: 100px;
        font-weight: 500;
        color: $text-color-regular;
      }

      .value {
        flex: 1;
        color: $text-color-primary;
      }

      .color-display {
        display: flex;
        align-items: center;
        gap: $spacing-xs;

        .color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
      }
    }
  }

  .content-config {
    .config-section {
      margin-bottom: $spacing-lg;

      h5 {
        margin: 0 0 $spacing-md 0;
        color: $text-color-primary;
        font-weight: 600;
      }

      .content-list,
      .button-config {
        background: #f8f9fa;
        padding: $spacing-md;
        border-radius: $border-radius-small;

        .content-item {
          color: $text-color-primary;
          margin-bottom: $spacing-xs;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .button-config {
        .button-label {
          font-weight: 500;
          color: $text-color-regular;
        }

        .button-value {
          color: $text-color-primary;
        }
      }
    }
  }

  .preview-card {
    .preview-container {
      padding: 0;
      border: none;
      box-shadow: none;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 400px;

  p {
    color: $text-color-secondary;
    margin-top: $spacing-md;
  }
}

.danger-item {
  color: $danger-color;
}
</style>