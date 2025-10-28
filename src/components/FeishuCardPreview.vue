<template>
  <div class="feishu-card-preview">
    <div class="card-container">
      <!-- 卡片头部 -->
      <div class="card-header" :style="{ background: getHeaderBgColor() }">
        <div class="header-content">
          <div class="title-row">
            <h3 class="card-title">{{ cardTitle }}</h3>
            <el-tag
              :color="getTagColor()"
              size="small"
              class="header-tag"
            >
              {{ getTagText() }}
            </el-tag>
          </div>
          <div class="subtitle" v-if="cardSubtitle">
            {{ cardSubtitle }}
          </div>
        </div>
        <div class="header-icon">
          <el-icon :size="24" color="white">
            <component :is="getIcon()" />
          </el-icon>
        </div>
      </div>

      <!-- 卡片主体 -->
      <div class="card-body">
        <!-- 主要内容区 -->
        <div class="content-section">
          <div class="main-content">
            <div class="info-column">
              <div class="info-item">
                <span class="label">报警时间：</span>
                <span class="value">{{ alertTime }}</span>
              </div>
              <div class="info-item">
                <span class="label">报警类型：</span>
                <span class="value">{{ alertType }}</span>
              </div>
              <div class="info-item">
                <span class="label">服务名称：</span>
                <span class="value">{{ serviceName }}</span>
              </div>
              <div class="info-item description">
                <span class="label">故障描述：</span>
                <span class="value">{{ description }}</span>
              </div>
            </div>

            <div class="action-column">
              <div class="mentions-section">
                <div class="mention-label">相关处理人：</div>
                <div class="mention-list">
                  <span
                    v-for="(mention, index) in mentions"
                    :key="index"
                    class="mention-item"
                  >
                    @{{ mention }}
                  </span>
                </div>
                <div class="action-tip">
                  请及时处理此问题
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮区 -->
        <div class="action-section">
          <div class="action-row">
            <div class="empty-col"></div>
            <div class="action-col">
              <el-button
                type="primary"
                size="small"
                class="action-button"
                @click="handleAction"
              >
                <el-icon><Link /></el-icon>
                {{ buttonText }}
              </el-button>
            </div>
            <div class="empty-col"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 卡片预览配置 -->
    <div class="preview-config">
      <h4>卡片预览配置</h4>
      <el-form :model="previewConfig" label-width="100px" size="small">
        <el-form-item label="消息标题">
          <el-input v-model="previewConfig.title" placeholder="输入消息标题" />
        </el-form-item>
        <el-form-item label="消息类型">
          <el-input v-model="previewConfig.type" placeholder="如：腾讯云CLS告警" />
        </el-form-item>
        <el-form-item label="服务名称">
          <el-input v-model="previewConfig.service" placeholder="如：muse-ability-production" />
        </el-form-item>
        <el-form-item label="故障描述">
          <el-input
            v-model="previewConfig.description"
            type="textarea"
            :rows="3"
            placeholder="输入详细描述信息"
          />
        </el-form-item>
        <el-form-item label="提及用户">
          <el-input
            v-model="previewConfig.mentions"
            placeholder="输入要@的用户，用逗号分隔"
          />
        </el-form-item>
        <el-form-item label="卡片颜色">
          <el-radio-group v-model="previewConfig.color">
            <el-radio-button label="red">红色</el-radio-button>
            <el-radio-button label="yellow">黄色</el-radio-button>
            <el-radio-button label="green">绿色</el-radio-button>
            <el-radio-button label="blue">蓝色</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="按钮文字">
          <el-input v-model="previewConfig.buttonText" placeholder="查看详情" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface PreviewConfig {
  title: string
  type: string
  service: string
  description: string
  mentions: string
  color: 'red' | 'yellow' | 'green' | 'blue'
  buttonText: string
}

interface Props {
  config?: Partial<PreviewConfig>
}

const props = defineProps<Props>()

const previewConfig = ref<PreviewConfig>({
  title: '【P0紧急】muse-ability-production 服务异常',
  type: '腾讯云CLS告警',
  service: 'muse-ability-production',
  description: '文本安全校验不通过，检测到违规内容。错误信息：文本安全校验结果不通过，建议立即处理。',
  mentions: '张三,李四',
  color: 'red',
  buttonText: '查看详情'
})

// 监听外部配置变化
watch(() => props.config, (config) => {
  if (config) {
    Object.assign(previewConfig.value, config)
  }
}, { deep: true })

// 计算属性
const cardTitle = computed(() => previewConfig.value.title || '消息标题')
const cardSubtitle = computed(() => previewConfig.value.type || '消息类型')
const alertTime = computed(() => new Date().toLocaleString('zh-CN'))
const alertType = computed(() => previewConfig.value.type || '系统通知')
const serviceName = computed(() => previewConfig.value.service || '未知服务')
const description = computed(() => previewConfig.value.description || '暂无描述')
const mentions = computed(() => {
  const mentionsStr = previewConfig.value.mentions || ''
  return mentionsStr.split(',').map(m => m.trim()).filter(m => m)
})
const buttonText = computed(() => previewConfig.value.buttonText || '查看详情')

// 获取头部背景色
const getHeaderBgColor = () => {
  const colors = {
    red: 'linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%)',
    yellow: 'linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)',
    green: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
    blue: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)'
  }
  return colors[previewConfig.value.color] || colors.blue
}

// 获取标签颜色
const getTagColor = () => {
  const colors = {
    red: '#ff6b6b',
    yellow: '#f39c12',
    green: '#2ecc71',
    blue: '#3498db'
  }
  return colors[previewConfig.value.color] || colors.blue
}

// 获取标签文本
const getTagText = () => {
  const tags = {
    red: 'P0紧急',
    yellow: 'P1警告',
    green: '成功',
    blue: '通知'
  }
  return tags[previewConfig.value.color] || '通知'
}

// 获取图标
const getIcon = () => {
  const icons = {
    red: 'AlertCircle',
    yellow: 'Warning',
    green: 'CheckCircle',
    blue: 'InfoFilled'
  }
  return icons[previewConfig.value.color] || 'InfoFilled'
}

// 处理操作
const handleAction = () => {
  ElMessage.info('查看详情功能 - 在实际使用中会跳转到详情页面')
}

// 暴露方法供父组件调用
defineExpose({
  updateConfig: (config: Partial<PreviewConfig>) => {
    Object.assign(previewConfig.value, config)
  }
})
</script>

<style scoped lang="scss">
.feishu-card-preview {
  display: flex;
  gap: $spacing-xl;
  padding: $spacing-lg;
  background: #f8f9fa;
  border-radius: $border-radius-base;
  overflow: hidden;
}

.card-container {
  flex: 1;
  background: white;
  border-radius: $border-radius-base;
  box-shadow: $box-shadow-base;
  overflow: hidden;
  transition: $transition-base;

  &:hover {
    box-shadow: $box-shadow-light;
  }
}

.card-header {
  padding: $spacing-lg $spacing-xl;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-content {
    flex: 1;

    .title-row {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      margin-bottom: $spacing-xs;

      .card-title {
        margin: 0;
        font-size: $font-size-large;
        font-weight: 600;
      }

      .header-tag {
        font-weight: 500;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
    }

    .subtitle {
      font-size: $font-size-small;
      opacity: 0.9;
    }
  }

  .header-icon {
    background: rgba(255, 255, 255, 0.2);
    padding: $spacing-sm;
    border-radius: $border-radius-round;
  }
}

.card-body {
  padding: 0;

  .content-section {
    padding: $spacing-lg $spacing-xl;

    .main-content {
      display: flex;
      gap: $spacing-xl;

      .info-column {
        flex: 2;

        .info-item {
          display: flex;
          margin-bottom: $spacing-md;
          line-height: 1.4;

          &:last-child {
            margin-bottom: 0;
          }

          .label {
            min-width: 80px;
            font-weight: 500;
            color: $text-color-regular;
          }

          .value {
            flex: 1;
            color: $text-color-primary;
            word-break: break-all;

            &.description {
              line-height: 1.6;
            }
          }
        }
      }

      .action-column {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;

        .mentions-section {
          text-align: center;

          .mention-label {
            font-weight: 500;
            margin-bottom: $spacing-sm;
            color: $text-color-regular;
          }

          .mention-list {
            margin-bottom: $spacing-sm;

            .mention-item {
              display: inline-block;
              margin: $spacing-xs;
              padding: 4px 8px;
              background: #e1f3d8;
              color: #67c23a;
              border-radius: $border-radius-small;
              font-size: $font-size-small;
              font-weight: 500;
            }
          }

          .action-tip {
            font-size: $font-size-small;
            color: $text-color-secondary;
            font-style: italic;
          }
        }
      }
    }
  }

  .action-section {
    padding: $spacing-md $spacing-xl;
    border-top: 1px solid #f0f0f0;

    .action-row {
      display: flex;
      align-items: center;

      .empty-col {
        flex: 1;
      }

      .action-col {
        flex: 2;

        .action-button {
          width: 100%;
          font-weight: 500;
        }
      }
    }
  }
}

.preview-config {
  width: 350px;
  background: white;
  border-radius: $border-radius-base;
  box-shadow: $box-shadow-base;
  padding: $spacing-lg;

  h4 {
    margin: 0 0 $spacing-lg 0;
    color: $text-color-primary;
    font-weight: 600;
  }

  .el-form-item {
    margin-bottom: $spacing-lg;
  }
}

// 响应式适配
@media (max-width: 1200px) {
  .feishu-card-preview {
    flex-direction: column;
  }

  .preview-config {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column !important;
  }

  .action-column {
    margin-top: $spacing-lg;
  }
}
</style>