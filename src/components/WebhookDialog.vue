<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑Webhook' : '添加Webhook'"
    width="600px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="平台" prop="platform">
        <el-select
          v-model="formData.platform"
          placeholder="选择通知平台"
          style="width: 100%"
        >
          <el-option label="飞书" value="feishu" />
          <el-option label="企业微信" value="wechat" />
          <el-option label="钉钉" value="dingtalk" />
        </el-select>
      </el-form-item>

      <el-form-item label="名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="Webhook名称，如：运维飞书群"
        />
      </el-form-item>

      <el-form-item label="URL" prop="url">
        <el-input
          v-model="formData.url"
          placeholder="Webhook接收地址"
        />
      </el-form-item>

      <el-form-item label="状态">
        <el-switch
          v-model="formData.enabled"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        {{ isEdit ? '保存' : '添加' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { Webhook } from '@/types'

interface Props {
  modelValue: boolean
  webhook?: Webhook | null
  groupId?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.webhook)

const formData = ref<Partial<Webhook>>({
  platform: 'feishu',
  name: '',
  url: '',
  enabled: true
})

const formRules: FormRules = {
  platform: [
    { required: true, message: '请选择平台', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入URL', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL', trigger: 'blur' }
  ]
}

watch(() => props.webhook, (webhook) => {
  if (webhook) {
    formData.value = { ...webhook }
  } else {
    resetForm()
  }
}, { immediate: true })

const resetForm = () => {
  formData.value = {
    platform: 'feishu',
    name: '',
    url: '',
    enabled: true
  }
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    // 这里需要调用父组件的方法来更新群组
    emit('success')
  } catch (error) {
    console.error('Submit failed:', error)
  } finally {
    submitting.value = false
  }
}

const handleClosed = () => {
  resetForm()
}
</script>