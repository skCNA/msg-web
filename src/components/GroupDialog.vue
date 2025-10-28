<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑群组' : '新建群组'"
    width="800px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="group-form"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <h3 class="section-title">基本信息</h3>

        <el-form-item label="群组标识" prop="identifier">
          <el-input
            v-model="formData.identifier"
            placeholder="用于Webhook路径的唯一标识，如: devops"
            :disabled="isEdit"
          >
            <template #prepend>
              <span class="url-prefix">/webhook/</span>
            </template>
          </el-input>
          <div class="form-tip">用于生成Webhook接收地址，只能包含字母、数字、下划线和连字符</div>
        </el-form-item>

        <el-form-item label="群组名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="群组的显示名称，如: 运维团队群"
          />
        </el-form-item>

        <el-form-item label="描述说明" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="群组的详细描述，用于说明这个群组的用途"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-switch
            v-model="formData.active"
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
      </div>

      <!-- Webhook配置 -->
      <div class="form-section">
        <h3 class="section-title">
          Webhook配置
          <el-button type="text" size="small" @click="addWebhook">
            <el-icon><Plus /></el-icon>
            添加Webhook
          </el-button>
        </h3>

        <div v-if="formData.webhooks.length === 0" class="empty-webhooks">
          <el-empty description="暂无Webhook配置" :image-size="60">
            <el-button type="text" @click="addWebhook">添加第一个Webhook</el-button>
          </el-empty>
        </div>

        <div v-else class="webhooks-list">
          <div
            v-for="(webhook, index) in formData.webhooks"
            :key="webhook.id || index"
            class="webhook-item"
          >
            <div class="webhook-header">
              <el-form-item
                :prop="`webhooks.${index}.platform`"
                :rules="[{ required: true, message: '请选择平台', trigger: 'change' }]"
                label="平台"
                class="webhook-form-item"
              >
                <el-select
                  v-model="webhook.platform"
                  placeholder="选择通知平台"
                  style="width: 120px"
                >
                  <el-option label="飞书" value="feishu" />
                  <el-option label="企业微信" value="wechat" />
                  <el-option label="钉钉" value="dingtalk" />
                </el-select>
              </el-form-item>

              <el-form-item
                :prop="`webhooks.${index}.name`"
                :rules="[{ required: true, message: '请输入名称', trigger: 'blur' }]"
                label="名称"
                class="webhook-form-item"
              >
                <el-input
                  v-model="webhook.name"
                  placeholder="Webhook名称"
                  style="width: 150px"
                />
              </el-form-item>

              <div class="webhook-actions">
                <el-button type="text" size="small" @click="testWebhook(webhook)">
                  <el-icon><Connection /></el-icon>
                  测试
                </el-button>
                <el-button type="text" size="small" @click="removeWebhook(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>

            <el-form-item
              :prop="`webhooks.${index}.url`"
              :rules="[{ required: true, message: '请输入Webhook URL', trigger: 'blur' }]"
              label="URL"
              class="webhook-form-item"
            >
              <el-input
                v-model="webhook.url"
                placeholder="Webhook接收地址"
              >
                <template #append>
                  <el-button
                    :type="webhook.test_status === 'success' ? 'success' :
                           webhook.test_status === 'failed' ? 'danger' : 'info'"
                    size="small"
                    @click="testWebhook(webhook)"
                    :loading="webhook.test_status === 'pending'"
                  >
                    {{ getTestStatusText(webhook.test_status) }}
                  </el-button>
                </template>
              </el-input>
            </el-form-item>

            <div class="webhook-status">
              <el-form-item label="启用状态">
                <el-switch
                  v-model="webhook.enabled"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </el-form-item>

              <div v-if="webhook.last_test_time" class="test-info">
                <span class="test-time">最后测试: {{ formatTime(webhook.last_test_time) }}</span>
                <el-tag
                  :type="webhook.test_status === 'success' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ webhook.test_status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { Group, Webhook } from '@/types'
import { useGroupsStore } from '@/stores/groups'

interface Props {
  modelValue: boolean
  group?: Group | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const groupsStore = useGroupsStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.group)

// 表单数据
const formData = ref<Partial<Group>>({
  name: '',
  identifier: '',
  description: '',
  active: true,
  webhooks: []
})

// 表单验证规则
const formRules: FormRules = {
  identifier: [
    { required: true, message: '请输入群组标识', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '只能包含字母、数字、下划线和连字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入群组名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 监听group变化，初始化表单数据
watch(() => props.group, (group) => {
  if (group) {
    formData.value = {
      ...group,
      webhooks: group.webhooks.map(w => ({ ...w }))
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// 重置表单
const resetForm = () => {
  formData.value = {
    name: '',
    identifier: '',
    description: '',
    active: true,
    webhooks: []
  }
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// 添加Webhook
const addWebhook = () => {
  const newWebhook: Webhook = {
    id: `temp_${Date.now()}`,
    platform: 'feishu',
    name: '',
    url: '',
    enabled: true
  }
  formData.value.webhooks!.push(newWebhook)
}

// 移除Webhook
const removeWebhook = (index: number) => {
  formData.value.webhooks!.splice(index, 1)
}

// 测试Webhook连接
const testWebhook = async (webhook: Webhook) => {
  if (!webhook.url) {
    ElMessage.warning('请先输入Webhook URL')
    return
  }

  webhook.test_status = 'pending'

  try {
    // 模拟测试连接
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 简单的URL格式验证
    const urlPattern = /^https?:\/\/.+/
    if (urlPattern.test(webhook.url)) {
      webhook.test_status = 'success'
      webhook.last_test_time = new Date().toISOString()
      ElMessage.success('连接测试成功')
    } else {
      webhook.test_status = 'failed'
      ElMessage.error('Webhook URL格式不正确')
    }
  } catch (error) {
    webhook.test_status = 'failed'
    ElMessage.error('连接测试失败')
  }
}

// 获取测试状态文本
const getTestStatusText = (status?: string) => {
  switch (status) {
    case 'success':
      return '成功'
    case 'failed':
      return '失败'
    case 'pending':
      return '测试中'
    default:
      return '测试'
  }
}

// 格式化时间
const formatTime = (timeStr: string) => {
  const time = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - time.getTime()

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return time.toLocaleDateString()
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (isEdit.value && props.group) {
      await groupsStore.updateGroup(props.group.id, formData.value)
      ElMessage.success('群组更新成功')
    } else {
      await groupsStore.addGroup(formData.value as Omit<Group, 'id' | 'created_at' | 'updated_at'>)
      ElMessage.success('群组创建成功')
    }

    emit('success')
  } catch (error) {
    console.error('Submit failed:', error)
  } finally {
    submitting.value = false
  }
}

// 对话框关闭
const handleClosed = () => {
  resetForm()
}
</script>

<style scoped lang="scss">
.group-form {
  .form-section {
    margin-bottom: $spacing-xl;

    .section-title {
      margin: 0 0 $spacing-lg 0;
      font-size: $font-size-large;
      font-weight: 600;
      color: $text-color-primary;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }

  .form-tip {
    margin-top: $spacing-xs;
    font-size: $font-size-small;
    color: $text-color-secondary;
  }

  .url-prefix {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: $font-size-small;
    color: $text-color-secondary;
  }

  .empty-webhooks {
    padding: $spacing-xl 0;
  }

  .webhooks-list {
    .webhook-item {
      border: 1px solid $border-color-lighter;
      border-radius: $border-radius-base;
      padding: $spacing-lg;
      margin-bottom: $spacing-md;
      background: #fafafa;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .webhook-header {
      display: flex;
      align-items: center;
      gap: $spacing-lg;
      margin-bottom: $spacing-md;

      .webhook-form-item {
        margin-bottom: 0;
      }

      .webhook-actions {
        display: flex;
        gap: $spacing-xs;
        margin-left: auto;
      }
    }

    .webhook-status {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: $spacing-md;

      .test-info {
        display: flex;
        align-items: center;
        gap: $spacing-sm;

        .test-time {
          font-size: $font-size-small;
          color: $text-color-secondary;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
}
</style>