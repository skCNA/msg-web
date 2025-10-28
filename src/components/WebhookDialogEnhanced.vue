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
      <el-form-item label="平台类型" prop="platform">
        <el-select
          v-model="formData.platform"
          placeholder="请选择平台类型"
          style="width: 100%"
          @change="handlePlatformChange"
        >
          <el-option-group label="主流平台">
            <el-option label="飞书" value="feishu">
              <div class="platform-option">
                <el-icon><OfficeBuilding /></el-icon>
                <span>飞书</span>
              </div>
            </el-option>
            <el-option label="企业微信" value="wechat">
              <div class="platform-option">
                <el-icon><ChatDotRound /></el-icon>
                <span>企业微信</span>
              </div>
            </el-option>
            <el-option label="钉钉" value="dingtalk">
              <div class="platform-option">
                <el-icon><Bell /></el-icon>
                <span>钉钉</span>
              </div>
            </el-option>
          </el-option-group>

          <el-option-group label="国际平台">
            <el-option label="Slack" value="slack">
              <div class="platform-option">
                <el-icon><ChatSquare /></el-icon>
                <span>Slack</span>
              </div>
            </el-option>
            <el-option label="Discord" value="discord">
              <div class="platform-option">
                <el-icon><Headset /></el-icon>
                <span>Discord</span>
              </div>
            </el-option>
            <el-option label="Microsoft Teams" value="teams">
              <div class="platform-option">
                <el-icon><Monitor /></el-icon>
                <span>Microsoft Teams</span>
              </div>
            </el-option>
          </el-option-group>

          <el-option-group label="自定义">
            <el-option label="自定义Webhook" value="webhook">
              <div class="platform-option">
                <el-icon><Link /></el-icon>
                <span>自定义Webhook</span>
              </div>
            </el-option>
          </el-option-group>
        </el-select>
      </el-form-item>

      <el-form-item label="Webhook名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入Webhook名称"
          clearable
        />
      </el-form-item>

      <el-form-item label="Webhook URL" prop="url">
        <el-input
          v-model="formData.url"
          placeholder="请输入Webhook URL"
          clearable
        >
          <template #append>
            <el-button @click="testWebhook" :loading="testing">
              测试
            </el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="状态">
        <el-switch
          v-model="formData.enabled"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>

      <!-- 平台特定配置 -->
      <template v-if="formData.platform !== 'webhook'">
        <el-divider content-position="left">平台配置</el-divider>

        <!-- Slack配置 -->
        <template v-if="formData.platform === 'slack'">
          <el-form-item label="频道">
            <el-input
              v-model="slackConfig.channel"
              placeholder="#general"
            />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input
              v-model="slackConfig.username"
              placeholder="Webhook Bot"
            />
          </el-form-item>
          <el-form-item label="图标">
            <el-input
              v-model="slackConfig.icon_emoji"
              placeholder=":robot_face:"
            />
          </el-form-item>
        </template>

        <!-- Discord配置 -->
        <template v-if="formData.platform === 'discord'">
          <el-form-item label="用户名">
            <el-input
              v-model="discordConfig.username"
              placeholder="Webhook Bot"
            />
          </el-form-item>
          <el-form-item label="头像URL">
            <el-input
              v-model="discordConfig.avatar_url"
              placeholder="https://example.com/avatar.png"
            />
          </el-form-item>
        </template>

        <!-- Teams配置 -->
        <template v-if="formData.platform === 'teams'">
          <el-form-item label="标题">
            <el-input
              v-model="teamsConfig.title"
              placeholder="消息标题"
            />
          </el-form-item>
          <el-form-item label="摘要">
            <el-input
              v-model="teamsConfig.summary"
              placeholder="消息摘要"
            />
          </el-form-item>
          <el-form-item label="主题颜色">
            <el-input
              v-model="teamsConfig.theme_color"
              placeholder="#FF0000"
            />
          </el-form-item>
        </template>
      </template>

      <!-- 自定义Webhook配置 -->
      <template v-if="formData.platform === 'webhook'">
        <el-divider content-position="left">自定义配置</el-divider>

        <el-form-item label="请求方法">
          <el-select v-model="customConfig.method" style="width: 200px">
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="PATCH" value="PATCH" />
          </el-select>
        </el-form-item>

        <el-form-item label="Content-Type">
          <el-select v-model="customConfig.content_type" style="width: 300px">
            <el-option label="application/json" value="application/json" />
            <el-option label="application/x-www-form-urlencoded" value="application/x-www-form-urlencoded" />
            <el-option label="text/plain" value="text/plain" />
          </el-select>
        </el-form-item>

        <el-form-item label="消息模板">
          <el-input
            v-model="customConfig.template"
            type="textarea"
            :rows="6"
            placeholder="输入消息模板，支持变量：{title}, {content}, {time}, {level}"
          />
        </el-form-item>
      </template>

      <!-- 通用配置 -->
      <el-divider content-position="left">高级配置</el-divider>

      <el-form-item label="请求头">
        <div class="headers-config">
          <div
            v-for="(header, index) in headers"
            :key="index"
            class="header-item"
          >
            <el-input
              v-model="header.key"
              placeholder="Header名称"
              style="width: 200px; margin-right: 8px"
            />
            <el-input
              v-model="header.value"
              placeholder="Header值"
              style="flex: 1; margin-right: 8px"
            />
            <el-button
              type="danger"
              size="small"
              @click="removeHeader(index)"
            >
              删除
            </el-button>
          </div>
          <el-button
            type="primary"
            size="small"
            @click="addHeader"
          >
            添加Header
          </el-button>
        </div>
      </el-form-item>

      <el-form-item label="超时时间">
        <el-input-number
          v-model="timeoutConfig"
          :min="1000"
          :max="60000"
          :step="1000"
        />
        <span style="margin-left: 8px">毫秒</span>
      </el-form-item>

      <el-form-item label="重试次数">
        <el-input-number
          v-model="retryConfig"
          :min="0"
          :max="5"
        />
        <span style="margin-left: 8px">次</span>
      </el-form-item>
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
import type { Webhook, WebhookConfig } from '@/types'

interface Props {
  modelValue: boolean
  webhook?: Webhook | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', webhook: Webhook): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)
const testing = ref(false)

// 默认表单数据
const getDefaultFormData = (): Webhook => ({
  id: '',
  platform: 'feishu',
  name: '',
  url: '',
  enabled: true,
  config: {
    headers: {},
    timeout: 10000,
    retry_count: 3
  }
})

const formData = ref<Webhook>(getDefaultFormData())

// 平台特定配置
const slackConfig = ref({
  channel: '#general',
  username: 'Webhook Bot',
  icon_emoji: ':robot_face:'
})

const discordConfig = ref({
  username: 'Webhook Bot',
  avatar_url: ''
})

const teamsConfig = ref({
  title: '',
  summary: '',
  theme_color: '#0084FF'
})

const customConfig = ref({
  method: 'POST' as const,
  content_type: 'application/json',
  template: '{\n  "title": "{title}",\n  "content": "{content}",\n  "time": "{time}",\n  "level": "{level}"\n}'
})

// 通用配置
const headers = ref([{ key: '', value: '' }])
const timeoutConfig = ref(10000)
const retryConfig = ref(3)

// 表单验证规则
const formRules: FormRules = {
  platform: [
    { required: true, message: '请选择平台类型', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入Webhook名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入Webhook URL', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL', trigger: 'blur' }
  ]
}

// 对话框标题
const dialogTitle = computed(() => {
  return props.webhook ? '编辑Webhook' : '新建Webhook'
})

// 监听外部传入的Webhook数据
watch(() => props.webhook, (webhook) => {
  if (webhook) {
    formData.value = JSON.parse(JSON.stringify(webhook))
    loadPlatformConfig(webhook)
  } else {
    formData.value = getDefaultFormData()
    resetPlatformConfig()
  }
}, { immediate: true })

// 平台变化处理
const handlePlatformChange = () => {
  resetPlatformConfig()
}

// 加载平台配置
const loadPlatformConfig = (webhook: Webhook) => {
  const config = webhook.config || {}

  if (webhook.platform === 'slack') {
    slackConfig.value = {
      channel: config.slack_channel || '#general',
      username: config.slack_username || 'Webhook Bot',
      icon_emoji: config.slack_icon_emoji || ':robot_face:'
    }
  } else if (webhook.platform === 'discord') {
    discordConfig.value = {
      username: config.discord_username || 'Webhook Bot',
      avatar_url: config.discord_avatar_url || ''
    }
  } else if (webhook.platform === 'teams') {
    teamsConfig.value = {
      title: config.teams_title || '',
      summary: config.teams_summary || '',
      theme_color: config.teams_theme_color || '#0084FF'
    }
  } else if (webhook.platform === 'webhook') {
    customConfig.value = {
      method: config.custom_method || 'POST',
      content_type: config.custom_content_type || 'application/json',
      template: config.custom_template || '{\n  "title": "{title}",\n  "content": "{content}"\n}'
    }
  }

  // 加载通用配置
  if (config.headers) {
    headers.value = Object.entries(config.headers).map(([key, value]) => ({ key, value }))
  }
  timeoutConfig.value = config.timeout || 10000
  retryConfig.value = config.retry_count || 3
}

// 重置平台配置
const resetPlatformConfig = () => {
  slackConfig.value = {
    channel: '#general',
    username: 'Webhook Bot',
    icon_emoji: ':robot_face:'
  }
  discordConfig.value = {
    username: 'Webhook Bot',
    avatar_url: ''
  }
  teamsConfig.value = {
    title: '',
    summary: '',
    theme_color: '#0084FF'
  }
  customConfig.value = {
    method: 'POST',
    content_type: 'application/json',
    template: '{\n  "title": "{title}",\n  "content": "{content}",\n  "time": "{time}",\n  "level": "{level}"\n}'
  }
  headers.value = [{ key: '', value: '' }]
  timeoutConfig.value = 10000
  retryConfig.value = 3
}

// Header操作
const addHeader = () => {
  headers.value.push({ key: '', value: '' })
}

const removeHeader = (index: number) => {
  headers.value.splice(index, 1)
}

// 测试Webhook
const testWebhook = async () => {
  if (!formData.value.url) {
    ElMessage.error('请先输入Webhook URL')
    return
  }

  testing.value = true
  try {
    // 构建测试消息
    const testMessage = {
      title: 'Webhook测试消息',
      content: '这是一条测试消息，用于验证Webhook配置是否正确。',
      time: new Date().toISOString(),
      level: 'info'
    }

    // 根据平台格式化消息
    const formattedMessage = formatMessage(testMessage, formData.value.platform)

    // 发送测试请求
    const response = await fetch(formData.value.url, {
      method: formData.value.platform === 'webhook' ? customConfig.value.method : 'POST',
      headers: {
        'Content-Type': formData.value.platform === 'webhook' ? customConfig.value.content_type : 'application/json',
        ...buildHeaders()
      },
      body: JSON.stringify(formattedMessage)
    })

    if (response.ok) {
      ElMessage.success('Webhook测试成功')
      formData.value.test_status = 'success'
      formData.value.last_test_time = new Date().toISOString()
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    ElMessage.error(`Webhook测试失败: ${error instanceof Error ? error.message : '未知错误'}`)
    formData.value.test_status = 'failed'
  } finally {
    testing.value = false
  }
}

// 格式化消息
const formatMessage = (message: any, platform: string) => {
  switch (platform) {
    case 'slack':
      return {
        text: message.title,
        channel: slackConfig.value.channel,
        username: slackConfig.value.username,
        icon_emoji: slackConfig.value.icon_emoji,
        attachments: [{
          color: 'good',
          text: message.content,
          ts: Math.floor(Date.now() / 1000)
        }]
      }

    case 'discord':
      return {
        username: discordConfig.value.username,
        avatar_url: discordConfig.value.avatar_url,
        embeds: [{
          title: message.title,
          description: message.content,
          color: 0x00ff00,
          timestamp: message.time
        }]
      }

    case 'teams':
      return {
        title: teamsConfig.value.title || message.title,
        summary: teamsConfig.value.summary || message.content,
        themeColor: teamsConfig.value.theme_color,
        sections: [{
          activityTitle: message.title,
          activitySubtitle: message.content,
          activityImage: null,
          facts: [{
            name: '时间',
            value: new Date(message.time).toLocaleString('zh-CN')
          }],
          markdown: true
        }]
      }

    case 'webhook':
      return applyTemplate(customConfig.value.template, message)

    default:
      // 飞书、企业微信、钉钉等使用标准格式
      return {
        msgtype: 'text',
        text: {
          content: `${message.title}\n\n${message.content}`
        }
      }
  }
}

// 应用模板
const applyTemplate = (template: string, data: any) => {
  let result = template
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
  })
  return result
}

// 构建请求头
const buildHeaders = () => {
  const headers: Record<string, string> = {}
  headers.value.forEach(header => {
    if (header.key && header.value) {
      headers[header.key] = header.value
    }
  })
  return headers
}

// 构建配置对象
const buildConfig = (): WebhookConfig => {
  const config: WebhookConfig = {
    headers: buildHeaders(),
    timeout: timeoutConfig.value,
    retry_count: retryConfig.value
  }

  // 平台特定配置
  if (formData.value.platform === 'slack') {
    config.slack_channel = slackConfig.value.channel
    config.slack_username = slackConfig.value.username
    config.slack_icon_emoji = slackConfig.value.icon_emoji
  } else if (formData.value.platform === 'discord') {
    config.discord_username = discordConfig.value.username
    config.discord_avatar_url = discordConfig.value.avatar_url
  } else if (formData.value.platform === 'teams') {
    config.teams_title = teamsConfig.value.title
    config.teams_summary = teamsConfig.value.summary
    config.teams_theme_color = teamsConfig.value.theme_color
  } else if (formData.value.platform === 'webhook') {
    config.custom_method = customConfig.value.method
    config.custom_content_type = customConfig.value.content_type
    config.custom_template = customConfig.value.template
  }

  return config
}

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
      formData.value.id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // 设置配置
    formData.value.config = buildConfig()

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

.platform-option {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.headers-config {
  .header-item {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-sm;
  }
}

.el-divider {
  margin: $spacing-lg 0 $spacing-md 0;
}
</style>