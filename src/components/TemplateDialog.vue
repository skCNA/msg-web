<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="handleClose"
    :title="dialogTitle"
    width="800px"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      size="default"
    >
      <el-form-item label="模板名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入模板名称"
          clearable
        />
      </el-form-item>

      <el-form-item label="模板描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入模板描述"
        />
      </el-form-item>

      <el-form-item label="消息类型" prop="message_type">
        <el-select
          v-model="formData.message_type"
          placeholder="请选择消息类型"
          style="width: 100%"
        >
          <el-option label="文本消息" value="text" />
          <el-option label="富文本消息" value="rich_text" />
          <el-option label="卡片消息" value="card" />
          <el-option label="文件消息" value="file" />
          <el-option label="图片消息" value="image" />
          <el-option label="语音消息" value="voice" />
          <el-option label="视频消息" value="video" />
        </el-select>
      </el-form-item>

      <el-form-item label="目标平台" prop="platform">
        <el-checkbox-group v-model="formData.platform">
          <el-checkbox label="feishu">飞书</el-checkbox>
          <el-checkbox label="wechat">企业微信</el-checkbox>
          <el-checkbox label="dingtalk">钉钉</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="优先级" prop="priority">
        <el-rate
          v-model="formData.priority"
          :max="5"
          :texts="['P4', 'P3', 'P2', 'P1', 'P0']"
          show-text
        />
      </el-form-item>

      <el-form-item label="模板颜色" prop="template_color">
        <el-radio-group v-model="formData.template_color">
          <el-radio-button label="red">红色</el-radio-button>
          <el-radio-button label="yellow">黄色</el-radio-button>
          <el-radio-button label="green">绿色</el-radio-button>
          <el-radio-button label="blue">蓝色</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 卡片消息配置 -->
      <template v-if="formData.message_type === 'card'">
        <el-divider content-position="left">卡片消息配置</el-divider>

        <el-form-item label="卡片标题" prop="card_config.title">
          <el-input
            v-model="formData.card_config.title"
            placeholder="请输入卡片标题"
          />
        </el-form-item>

        <el-form-item label="卡片副标题" prop="card_config.subtitle">
          <el-input
            v-model="formData.card_config.subtitle"
            placeholder="请输入卡片副标题"
          />
        </el-form-item>

        <el-form-item label="卡片内容" prop="card_config.content">
          <el-input
            v-model="formData.card_config.content"
            type="textarea"
            :rows="4"
            placeholder="请输入卡片内容"
          />
        </el-form-item>

        <el-form-item label="按钮文字" prop="card_config.button_text">
          <el-input
            v-model="formData.card_config.button_text"
            placeholder="如：查看详情"
          />
        </el-form-item>

        <el-form-item label="按钮链接" prop="card_config.button_url">
          <el-input
            v-model="formData.card_config.button_url"
            placeholder="请输入按钮链接"
          />
        </el-form-item>
      </template>

      <!-- 文本消息配置 -->
      <template v-if="formData.message_type === 'text'">
        <el-divider content-position="left">文本消息配置</el-divider>

        <el-form-item label="消息内容" prop="text_config.content">
          <el-input
            v-model="formData.text_config.content"
            type="textarea"
            :rows="5"
            placeholder="请输入消息内容，支持变量替换如：{title}, {content}, {time}"
          />
        </el-form-item>
      </template>

      <!-- 富文本消息配置 -->
      <template v-if="formData.message_type === 'rich_text'">
        <el-divider content-position="left">富文本消息配置</el-divider>

        <el-form-item label="富文本内容" prop="rich_text_config.content">
          <el-input
            v-model="formData.rich_text_config.content"
            type="textarea"
            :rows="5"
            placeholder="请输入富文本内容（支持Markdown格式）"
          />
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="loading">
          确认
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Template } from '@/types'

interface Props {
  modelValue: boolean
  template?: Template | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', template: Template): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

// 默认表单数据
const getDefaultFormData = (): Template => ({
  id: '',
  name: '',
  description: '',
  message_type: 'card',
  platform: ['feishu'],
  priority: 3,
  template_color: 'blue',
  template_config: {
    card_config: {
      title: '',
      subtitle: '',
      content: '',
      button_text: '查看详情',
      button_url: ''
    },
    text_config: {
      content: ''
    },
    rich_text_config: {
      content: ''
    }
  },
  variables: [],
  active: true,
  created_at: '',
  updated_at: ''
})

const formData = ref<Template>(getDefaultFormData())

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { min: 2, max: 50, message: '模板名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入模板描述', trigger: 'blur' }
  ],
  message_type: [
    { required: true, message: '请选择消息类型', trigger: 'change' }
  ],
  platform: [
    { required: true, message: '请选择至少一个目标平台', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  template_color: [
    { required: true, message: '请选择模板颜色', trigger: 'change' }
  ]
}

// 对话框标题
const dialogTitle = computed(() => {
  return props.template ? '编辑模板' : '新建模板'
})

// 监听外部传入的模板数据
watch(() => props.template, (template) => {
  if (template) {
    formData.value = JSON.parse(JSON.stringify(template))
  } else {
    formData.value = getDefaultFormData()
  }
}, { immediate: true })

// 监听消息类型变化，重置配置
watch(() => formData.value.message_type, () => {
  // 重置配置为默认值
  formData.value.template_config = getDefaultFormData().template_config
})

// 处理关闭
const handleClose = () => {
  emit('update:modelValue', false)
  formRef.value?.resetFields()
}

// 处理确认
const handleConfirm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    // 生成ID（新建时）
    if (!formData.value.id) {
      formData.value.id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // 设置时间戳
    const now = new Date().toISOString()
    if (!formData.value.created_at) {
      formData.value.created_at = now
    }
    formData.value.updated_at = now

    emit('confirm', formData.value)
    handleClose()
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
}

.el-divider {
  margin: $spacing-lg 0 $spacing-md 0;
}

.el-form-item {
  margin-bottom: $spacing-lg;
}

// 优先级选择器样式
.el-rate {
  height: 32px;
}

// 复选框组样式
.el-checkbox-group {
  display: flex;
  gap: $spacing-lg;
}

// 单选按钮组样式
.el-radio-group {
  display: flex;
  gap: $spacing-sm;
}

// 文本域样式
.el-textarea {
  :deep(.el-textarea__inner) {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
  }
}
</style>