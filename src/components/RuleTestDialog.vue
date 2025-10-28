<template>
  <el-dialog
    v-model="dialogVisible"
    title="规则测试"
    width="600px"
    @closed="handleClosed"
  >
    <div v-if="rule" class="rule-test">
      <div class="rule-info">
        <h4>当前规则</h4>
        <div class="rule-details">
          <div class="detail-item">
            <span class="label">规则名称:</span>
            <span class="value">{{ rule.name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">匹配关键字:</span>
            <span class="value">
              <el-tag
                v-for="keyword in rule.keywords"
                :key="keyword"
                size="small"
                class="keyword-tag"
              >
                {{ keyword }}
              </el-tag>
            </span>
          </div>
        </div>
      </div>

      <div class="test-section">
        <h4>测试消息</h4>
        <el-input
          v-model="testMessage"
          type="textarea"
          :rows="4"
          placeholder="输入测试消息内容，系统会检测是否匹配当前规则的关键字"
        />

        <div class="sample-messages">
          <h5>示例消息（点击使用）</h5>
          <div class="sample-list">
            <el-button
              v-for="sample in sampleMessages"
              :key="sample.title"
              size="small"
              @click="testMessage = sample.content"
              class="sample-btn"
            >
              {{ sample.title }}
            </el-button>
          </div>
        </div>

        <div class="test-actions">
          <el-button type="primary" @click="testMatching" :loading="testing">
            测试匹配
          </el-button>
          <el-button @click="clearResult">清除结果</el-button>
        </div>

        <div v-if="testResult" class="test-result">
          <div class="result-header">
            <span class="result-title">匹配结果</span>
            <el-tag :type="testResult.matched ? 'success' : 'danger'" size="small">
              {{ testResult.matched ? '匹配成功' : '匹配失败' }}
            </el-tag>
          </div>

          <div v-if="testResult.matched" class="matched-result">
            <div class="result-info">
              <div class="info-item">
                <span class="label">匹配关键字:</span>
                <span class="value">
                  <el-tag
                    v-for="keyword in testResult.matchedKeywords"
                    :key="keyword"
                    type="success"
                    size="small"
                    class="matched-keyword"
                  >
                    {{ keyword }}
                  </el-tag>
                </span>
              </div>
              <div class="info-item">
                <span class="label">提及用户:</span>
                <span class="value">
                  <span
                    v-for="userId in testResult.mentionedUsers"
                    :key="userId"
                    class="mentioned-user"
                  >
                    @{{ getUserName(userId) }}
                  </span>
                  <span v-if="testResult.mentionedUsers.length === 0" class="empty">
                    未配置用户
                  </span>
                </span>
              </div>
              <div class="info-item">
                <span class="label">卡片样式:</span>
                <span class="value">
                  <div
                    class="style-preview"
                    :style="{ backgroundColor: getRuleColor(rule.template_color) }"
                  >
                    {{ getStyleName(rule.template_color) }}卡片
                  </div>
                </span>
              </div>
            </div>

            <div class="preview-section">
              <h5>消息预览</h5>
              <div class="message-preview">
                <div class="preview-header">
                  <div
                    class="preview-title"
                    :style="{ backgroundColor: getRuleColor(rule.template_color) }"
                  >
                    {{ generateMessageTitle() }}
                  </div>
                </div>
                <div class="preview-content">
                  <div class="preview-item">
                    <span class="label">时间:</span>
                    <span class="value">{{ new Date().toLocaleString() }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="label">来源:</span>
                    <span class="value">测试消息</span>
                  </div>
                  <div class="preview-item">
                    <span class="label">内容:</span>
                    <span class="value">{{ testMessage }}</span>
                  </div>
                  <div v-if="testResult.mentionedUsers.length > 0" class="preview-item">
                    <span class="label">@用户:</span>
                    <span class="value mentioned-list">
                      <span
                        v-for="userId in testResult.mentionedUsers"
                        :key="userId"
                      >
                        @{{ getUserName(userId) }}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="unmatched-result">
            <div class="result-info">
              <p class="no-match">消息中未找到匹配的关键字</p>
              <p class="suggestion">
                请尝试在消息中包含以下关键字：
                <el-tag
                  v-for="keyword in rule.keywords"
                  :key="keyword"
                  size="small"
                  class="suggestion-keyword"
                >
                  {{ keyword }}
                </el-tag>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { Rule } from '@/types'
import { useUsersStore } from '@/stores/users'

interface Props {
  modelValue: boolean
  rule?: Rule | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const usersStore = useUsersStore()

const testMessage = ref('')
const testing = ref(false)
const testResult = ref<any>(null)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 示例消息
const sampleMessages = [
  {
    title: 'P0紧急告警',
    content: '【P0紧急】muse-ability-production 服务发生严重错误，需要立即处理'
  },
  {
    title: '数据库告警',
    content: 'MySQL连接池耗尽，当前活跃连接数: 100/100'
  },
  {
    title: 'API响应慢',
    content: 'API接口响应时间超过5秒，影响用户体验'
  },
  {
    title: '文本安全告警',
    content: '文本安全校验不通过，检测到违规内容'
  },
  {
    title: 'CI/CD部署',
    content: '【P1警告】king-club-core-api 部署失败，请检查部署配置'
  }
]

// 测试匹配
const testMatching = async () => {
  if (!testMessage.value.trim()) {
    ElMessage.warning('请输入测试消息')
    return
  }

  if (!props.rule) return

  testing.value = true

  try {
    // 模拟测试延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    const message = testMessage.value.toLowerCase()
    const matchedKeywords: string[] = []

    // 检查关键字匹配
    for (const keyword of props.rule.keywords) {
      if (message.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword)
      }
    }

    const matched = matchedKeywords.length > 0

    testResult.value = {
      matched,
      matchedKeywords,
      mentionedUsers: matched ? props.rule.user_ids : [],
      timestamp: new Date()
    }

    ElMessage.success(matched ? '规则匹配成功' : '规则未匹配')
  } catch (error) {
    ElMessage.error('测试失败')
  } finally {
    testing.value = false
  }
}

// 清除结果
const clearResult = () => {
  testResult.value = null
}

// 获取用户名
const getUserName = (userId: string) => {
  const user = usersStore.getUserById(userId)
  return user?.name || '未知用户'
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

// 生成消息标题
const generateMessageTitle = () => {
  if (!props.rule) return '测试消息'

  const colorMap = {
    red: '【P0紧急】',
    yellow: '【P1警告】',
    green: '【信息】',
    blue: '【通知】'
  }

  return colorMap[props.rule.template_color as keyof typeof colorMap] + '测试消息'
}

// 对话框关闭
const handleClosed = () => {
  testMessage.value = ''
  testResult.value = null
  testing.value = false
}
</script>

<style scoped lang="scss">
.rule-test {
  .rule-info {
    margin-bottom: $spacing-xl;
    padding: $spacing-md;
    background: #f8f9fa;
    border-radius: $border-radius-base;

    h4 {
      margin: 0 0 $spacing-sm 0;
      color: $text-color-primary;
    }

    .rule-details {
      .detail-item {
        display: flex;
        align-items: center;
        margin-bottom: $spacing-xs;

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

          .keyword-tag {
            margin-right: $spacing-xs;
          }
        }
      }
    }
  }

  .test-section {
    h4 {
      margin: 0 0 $spacing-md 0;
      color: $text-color-primary;
    }

    .sample-messages {
      margin: $spacing-lg 0;

      h5 {
        margin: 0 0 $spacing-sm 0;
        font-size: $font-size-medium;
        color: $text-color-regular;
      }

      .sample-list {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-sm;

        .sample-btn {
          font-size: $font-size-small;
        }
      }
    }

    .test-actions {
      margin: $spacing-lg 0;
      display: flex;
      gap: $spacing-sm;
    }

    .test-result {
      margin-top: $spacing-lg;
      padding: $spacing-md;
      border: 1px solid $border-color-lighter;
      border-radius: $border-radius-base;
      background: white;

      .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: $spacing-md;
        padding-bottom: $spacing-sm;
        border-bottom: 1px solid $border-color-lighter;

        .result-title {
          font-weight: 600;
          color: $text-color-primary;
        }
      }

      .matched-result {
        .result-info {
          .info-item {
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

              .matched-keyword {
                margin-right: $spacing-xs;
              }

              .mentioned-user {
                display: inline-block;
                margin-right: $spacing-sm;
                padding: 2px 8px;
                background: #e1f3d8;
                color: #67c23a;
                border-radius: $border-radius-small;
                font-size: $font-size-small;
              }

              .empty {
                color: $text-color-secondary;
                font-style: italic;
              }

              .style-preview {
                display: inline-block;
                padding: 4px 12px;
                color: white;
                border-radius: $border-radius-small;
                font-size: $font-size-small;
                font-weight: 500;
              }
            }
          }

          .preview-section {
            margin-top: $spacing-lg;
            padding-top: $spacing-lg;
            border-top: 1px solid $border-color-lighter;

            h5 {
              margin: 0 0 $spacing-md 0;
              color: $text-color-primary;
            }

            .message-preview {
              border: 1px solid $border-color-lighter;
              border-radius: $border-radius-base;
              overflow: hidden;

              .preview-header {
                padding: $spacing-sm $spacing-md;
                background: #f8f9fa;

                .preview-title {
                  color: white;
                  padding: $spacing-xs $spacing-sm;
                  border-radius: $border-radius-small;
                  font-weight: 500;
                  font-size: $font-size-small;
                }
              }

              .preview-content {
                padding: $spacing-md;
                background: white;

                .preview-item {
                  display: flex;
                  margin-bottom: $spacing-xs;

                  &:last-child {
                    margin-bottom: 0;
                  }

                  .label {
                    width: 60px;
                    font-weight: 500;
                    color: $text-color-regular;
                    font-size: $font-size-small;
                  }

                  .value {
                    flex: 1;
                    font-size: $font-size-small;

                    &.mentioned-list {
                      color: #67c23a;
                    }
                  }
                }
              }
            }
          }
        }
      }

      .unmatched-result {
        .result-info {
          text-align: center;
          padding: $spacing-lg 0;

          .no-match {
            color: $danger-color;
            font-weight: 500;
            margin-bottom: $spacing-md;
          }

          .suggestion {
            color: $text-color-regular;
            line-height: 1.5;

            .suggestion-keyword {
              margin: 0 $spacing-xs;
            }
          }
        }
      }
    }
  }
}
</style>