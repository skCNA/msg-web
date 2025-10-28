<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="800px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <!-- 导入配置 -->
    <div v-if="type === 'import'" class="import-section">
      <div class="upload-area">
        <el-upload
          ref="uploadRef"
          class="upload-dragger"
          drag
          accept=".json"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将配置文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只能上传 JSON 格式的配置文件，且不超过 10MB
            </div>
          </template>
        </el-upload>

        <div v-if="selectedFile" class="file-info">
          <el-icon><Document /></el-icon>
          <span class="file-name">{{ selectedFile.name }}</span>
          <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
          <el-button type="text" @click="clearFile">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="import-options">
        <h4>导入选项</h4>
        <el-radio-group v-model="importMode">
          <el-radio label="merge">合并配置（保留现有配置，添加新配置）</el-radio>
          <el-radio label="replace">完全替换（清空现有配置，使用导入配置）</el-radio>
        </el-radio-group>

        <div class="checkbox-group">
          <el-checkbox v-model="backupBeforeImport">
            导入前自动备份现有配置
          </el-checkbox>
          <el-checkbox v-model="validateConfig">
            导入前验证配置格式
          </el-checkbox>
        </div>
      </div>

      <div v-if="previewData" class="preview-section">
        <h4>配置预览</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="群组数量">
            {{ previewData.groups?.length || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="用户数量">
            {{ previewData.users?.length || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="规则数量">
            {{ previewData.rules?.length || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="模板数量">
            {{ previewData.templates?.length || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="配置版本">
            {{ previewData.settings?.version || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ previewData.settings?.created_at ? formatDate(previewData.settings.created_at) : '未知' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <!-- 导出配置 -->
    <div v-else class="export-section">
      <div class="export-options">
        <h4>导出内容</h4>
        <el-checkbox-group v-model="exportItems">
          <el-checkbox label="groups">群组配置</el-checkbox>
          <el-checkbox label="users">用户配置</el-checkbox>
          <el-checkbox label="rules">规则配置</el-checkbox>
          <el-checkbox label="templates">模板配置</el-checkbox>
        </el-checkbox-group>
      </div>

      <div class="export-format">
        <h4>导出格式</h4>
        <el-radio-group v-model="exportFormat">
          <el-radio label="json">JSON 格式</el-radio>
          <el-radio label="csv">CSV 格式（仅支持部分数据）</el-radio>
        </el-radio-group>
      </div>

      <div class="export-options-advanced">
        <h4>高级选项</h4>
        <el-checkbox v-model="includeSensitive">
          包含敏感信息（Webhook URL 等）
        </el-checkbox>
        <el-checkbox v-model="includeHistory">
          包含历史日志和统计信息
        </el-checkbox>
        <el-checkbox v-model="compressFile">
          压缩导出文件
        </el-checkbox>
      </div>

      <div class="export-filename">
        <h4>文件名</h4>
        <el-input
          v-model="filename"
          placeholder="导出文件名"
        >
          <template #append>
            .{{ exportFormat }}
          </template>
        </el-input>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          v-if="type === 'import'"
          type="primary"
          @click="handleImport"
          :loading="loading"
          :disabled="!selectedFile"
        >
          开始导入
        </el-button>
        <el-button
          v-else
          type="primary"
          @click="handleExport"
          :loading="loading"
          :disabled="exportItems.length === 0"
        >
          开始导出
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { configManager } from '@/utils/config-manager'
import type { GlobalConfig } from '@/types'

interface Props {
  modelValue: boolean
  type: 'import' | 'export'
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const uploadRef = ref()
const loading = ref(false)
const selectedFile = ref<File | null>(null)
const previewData = ref<GlobalConfig | null>(null)

// 导入相关
const importMode = ref('merge')
const backupBeforeImport = ref(true)
const validateConfig = ref(true)

// 导出相关
const exportItems = ref(['groups', 'users', 'rules', 'templates'])
const exportFormat = ref('json')
const includeSensitive = ref(false)
const includeHistory = ref(false)
const compressFile = ref(false)
const filename = ref('')

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const dialogTitle = computed(() => {
  return props.type === 'import' ? '导入配置' : '导出配置'
})

// 监听类型变化，重置状态
watch(() => props.type, () => {
  resetState()
})

// 监听导出项目变化，生成默认文件名
watch(exportItems, () => {
  if (!filename.value) {
    generateFilename()
  }
})

const resetState = () => {
  selectedFile.value = null
  previewData.value = null
  importMode.value = 'merge'
  backupBeforeImport.value = true
  validateConfig.value = true
  exportItems.value = ['groups', 'users', 'rules', 'templates']
  exportFormat.value = 'json'
  includeSensitive.value = false
  includeHistory.value = false
  compressFile.value = false
  generateFilename()
}

const generateFilename = () => {
  const timestamp = new Date().toISOString().slice(0, 10)
  const items = exportItems.value.length === 4 ? 'full' : exportItems.value.join('-')
  filename.value = `webhook-config-${items}-${timestamp}`
}

// 处理文件选择
const handleFileChange = (file: UploadFile) => {
  if (file.raw) {
    selectedFile.value = file.raw
    readFilePreview(file.raw)
  }
}

// 读取文件预览
const readFilePreview = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const data = JSON.parse(content) as GlobalConfig
      previewData.value = data
    } catch (error) {
      ElMessage.error('文件格式错误，请上传有效的 JSON 配置文件')
      clearFile()
    }
  }
  reader.readAsText(file)
}

// 清除文件
const clearFile = () => {
  selectedFile.value = null
  previewData.value = null
  uploadRef.value?.clearFiles()
}

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 处理导入
const handleImport = async () => {
  if (!selectedFile.value || !previewData.value) return

  loading.value = true
  try {
    // 验证配置
    if (validateConfig.value) {
      if (!previewData.value.settings) {
        throw new Error('配置文件格式不正确')
      }
    }

    // 备份现有配置
    if (backupBeforeImport.value) {
      configManager.backupConfig()
      ElMessage.success('现有配置已备份')
    }

    // 导入配置
    configManager.importConfig(previewData.value, importMode.value === 'merge')

    ElMessage.success('配置导入成功')
    emit('success')
  } catch (error) {
    console.error('Import failed:', error)
    ElMessage.error('配置导入失败：' + (error as Error).message)
  } finally {
    loading.value = false
  }
}

// 处理导出
const handleExport = async () => {
  loading.value = true
  try {
    const config = configManager.exportConfig()

    // 过滤导出内容
    const exportData: Partial<GlobalConfig> = {
      settings: config.settings
    }

    if (exportItems.value.includes('groups')) {
      exportData.groups = config.groups
    }
    if (exportItems.value.includes('users')) {
      exportData.users = config.users
    }
    if (exportItems.value.includes('rules')) {
      exportData.rules = config.rules
    }
    if (exportItems.value.includes('templates')) {
      exportData.templates = config.templates
    }

    // 处理敏感信息
    if (!includeSensitive.value) {
      exportData.groups = exportData.groups?.map(group => ({
        ...group,
        webhooks: group.webhooks.map(webhook => ({
          ...webhook,
          url: webhook.url ? '[HIDDEN]' : ''
        }))
      }))
    }

    let content: string
    let mimeType: string

    if (exportFormat.value === 'json') {
      content = JSON.stringify(exportData, null, 2)
      mimeType = 'application/json'
    } else {
      // CSV 导出（简化版）
      content = convertToCSV(exportData)
      mimeType = 'text/csv'
    }

    // 下载文件
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename.value}.${exportFormat.value}`
    link.click()
    URL.revokeObjectURL(link.href)

    ElMessage.success('配置导出成功')
  } catch (error) {
    console.error('Export failed:', error)
    ElMessage.error('配置导出失败')
  } finally {
    loading.value = false
  }
}

// 转换为CSV格式（简化版）
const convertToCSV = (data: Partial<GlobalConfig>) => {
  const lines = []

  // 群组数据
  if (data.groups) {
    lines.push('群组配置')
    lines.push('ID,名称,标识符,描述,状态,创建时间')
    data.groups.forEach(group => {
      lines.push(`${group.id},${group.name},${group.identifier},${group.description},${group.active ? '启用' : '停用'},${group.created_at}`)
    })
    lines.push('')
  }

  // 用户数据
  if (data.users) {
    lines.push('用户配置')
    lines.push('ID,姓名,邮箱,手机号,部门,角色,飞书ID,企业微信ID,状态,创建时间')
    data.users.forEach(user => {
      lines.push(`${user.id},${user.name},${user.email},${user.phone},${user.department},${user.role},${user.feishu_user_id},${user.wechat_user_id},${user.active ? '启用' : '停用'},${user.created_at}`)
    })
  }

  return lines.join('\n')
}

const handleClosed = () => {
  resetState()
}
</script>

<style scoped lang="scss">
.import-section,
.export-section {
  .upload-area {
    margin-bottom: $spacing-xl;

    .upload-dragger {
      width: 100%;
    }

    .file-info {
      margin-top: $spacing-md;
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      padding: $spacing-sm;
      background: #f0f9ff;
      border: 1px solid #bfdbfe;
      border-radius: $border-radius-base;

      .file-name {
        font-weight: 500;
      }

      .file-size {
        color: $text-color-secondary;
        font-size: $font-size-small;
      }
    }
  }

  .import-options,
  .export-options,
  .export-format,
  .export-options-advanced,
  .export-filename {
    margin-bottom: $spacing-lg;

    h4 {
      margin: 0 0 $spacing-md 0;
      font-size: $font-size-medium;
      color: $text-color-primary;
    }
  }

  .checkbox-group {
    margin-top: $spacing-md;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  .preview-section {
    margin-top: $spacing-xl;
    padding: $spacing-lg;
    background: #fafafa;
    border-radius: $border-radius-base;
    border: 1px solid $border-color-lighter;

    h4 {
      margin: 0 0 $spacing-md 0;
      font-size: $font-size-medium;
      color: $text-color-primary;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
}
</style>