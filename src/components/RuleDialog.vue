<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑规则' : '新建规则'"
    width="700px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="rule-form"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <h3 class="section-title">基本信息</h3>

        <el-form-item label="规则名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入规则名称，如：数据库相关告警"
          />
        </el-form-item>

        <el-form-item label="所属群组" prop="group_id">
          <el-select
            v-model="formData.group_id"
            placeholder="选择群组"
            style="width: 100%"
            :disabled="isEdit"
          >
            <el-option
              v-for="group in groupsStore.groups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级">
          <el-radio-group v-model="formData.priority">
            <el-radio :label="1">低</el-radio>
            <el-radio :label="5">中</el-radio>
            <el-radio :label="10">高</el-radio>
          </el-radio-group>
          <div class="form-tip">优先级越高的规则会优先匹配</div>
        </el-form-item>

        <el-form-item label="状态">
          <el-switch
            v-model="formData.active"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </div>

      <!-- 关键字配置 -->
      <div class="form-section">
        <h3 class="section-title">关键字配置</h3>

        <el-form-item label="匹配关键字">
          <div class="keywords-editor">
            <el-tag
              v-for="keyword in formData.keywords"
              :key="keyword"
              closable
              @close="removeKeyword(keyword)"
              class="keyword-tag"
            >
              {{ keyword }}
            </el-tag>
            <el-input
              v-if="inputVisible"
              ref="inputRef"
              v-model="inputValue"
              size="small"
              class="keyword-input"
              @keyup.enter="addKeyword"
              @blur="addKeyword"
            />
            <el-button v-else size="small" @click="showInput">
              + 添加关键字
            </el-button>
          </div>
          <div class="form-tip">
            添加消息中包含的关键字，系统会根据这些关键字匹配消息
          </div>
        </el-form-item>
      </div>

      <!-- 用户提及配置 -->
      <div class="form-section">
        <h3 class="section-title">用户提及配置</h3>

        <el-form-item label="提及用户">
          <el-select
            v-model="formData.user_ids"
            multiple
            placeholder="选择要@的用户"
            style="width: 100%"
            :disabled="!formData.group_id"
          >
            <el-option
              v-for="user in availableUsers"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            >
              <div class="user-option">
                <span>{{ user.name }}</span>
                <span class="user-info">{{ user.department || '未设置部门' }}</span>
                <span v-if="user.feishu_user_id" class="platform-tag">飞书</span>
                <span v-if="user.wechat_user_id" class="platform-tag">企业微信</span>
              </div>
            </el-option>
          </el-select>
          <div class="form-tip">
            选择匹配到此规则时要@的用户，支持多选
          </div>
        </el-form-item>
      </div>

      <!-- 样式配置 -->
      <div class="form-section">
        <h3 class="section-title">样式配置</h3>

        <el-form-item label="卡片颜色">
          <el-radio-group v-model="formData.template_color">
            <el-radio-button label="red">
              <div class="color-option">
                <div class="color-dot red"></div>
                红色
              </div>
            </el-radio-button>
            <el-radio-button label="yellow">
              <div class="color-option">
                <div class="color-dot yellow"></div>
                黄色
              </div>
            </el-radio-button>
            <el-radio-button label="green">
              <div class="color-option">
                <div class="color-dot green"></div>
                绿色
              </div>
            </el-radio-button>
            <el-radio-button label="blue">
              <div class="color-option">
                <div class="color-dot blue"></div>
                蓝色
              </div>
            </el-radio-button>
          </el-radio-group>
          <div class="form-tip">
            选择消息卡片的主题颜色，用于区分不同类型的告警
          </div>
        </el-form-item>
      </div>

      <!-- 预览区域 -->
      <div class="form-section">
        <h3 class="section-title">规则预览</h3>

        <div class="rule-preview">
          <div class="preview-header">
            <span>规则效果预览</span>
            <el-button type="text" size="small" @click="testRule">
              <el-icon><ChatDotRound /></el-icon>
              测试匹配
            </el-button>
          </div>

          <div class="preview-content">
            <div class="preview-info">
              <div class="info-item">
                <span class="label">规则名称:</span>
                <span class="value">{{ formData.name || '未设置' }}</span>
              </div>
              <div class="info-item">
                <span class="label">匹配关键字:</span>
                <span class="value">
                  <el-tag
                    v-for="keyword in formData.keywords"
                    :key="keyword"
                    size="small"
                    :type="getKeywordType(keyword)"
                    class="preview-keyword"
                  >
                    {{ keyword }}
                  </el-tag>
                  <span v-if="formData.keywords.length === 0" class="empty">未设置关键字</span>
                </span>
              </div>
              <div class="info-item">
                <span class="label">提及用户:</span>
                <span class="value">
                  <span
                    v-for="userId in formData.user_ids"
                    :key="userId"
                    class="mentioned-user"
                  >
                    @{{ getUserName(userId) }}
                  </span>
                  <span v-if="formData.user_ids.length === 0" class="empty">未选择用户</span>
                </span>
              </div>
              <div class="info-item">
                <span class="label">卡片样式:</span>
                <span class="value">
                  <div
                    class="style-preview"
                    :style="{ backgroundColor: getRuleColor(formData.template_color) }"
                  >
                    {{ getStyleName(formData.template_color) }}卡片
                  </div>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button @click="testRule">测试规则</el-button>
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
import type { Rule } from '@/types'
import { useRulesStore } from '@/stores/rules'
import { useGroupsStore } from '@/stores/groups'
import { useUsersStore } from '@/stores/users'

interface Props {
  modelValue: boolean
  rule?: Rule | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const rulesStore = useRulesStore()
const groupsStore = useGroupsStore()
const usersStore = useUsersStore()

const formRef = ref<FormInstance>()
const inputRef = ref()
const submitting = ref(false)
const inputVisible = ref(false)
const inputValue = ref('')

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.rule)

const formData = ref<Partial<Rule>>({
  name: '',
  group_id: '',
  keywords: [],
  user_ids: [],
  template_color: 'red',
  priority: 5,
  active: true
})

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  group_id: [
    { required: true, message: '请选择所属群组', trigger: 'change' }
  ]
}

// 可用用户列表（根据选中的群组筛选）
const availableUsers = computed(() => {
  if (!formData.value.group_id) return []
  return usersStore.activeUsers
})

// 监听规则变化，初始化表单数据
watch(() => props.rule, (rule) => {
  if (rule) {
    formData.value = { ...rule }
  } else {
    resetForm()
  }
}, { immediate: true })

// 重置表单
const resetForm = () => {
  formData.value = {
    name: '',
    group_id: '',
    keywords: [],
    user_ids: [],
    template_color: 'red',
    priority: 5,
    active: true
  }
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// 显示输入框
const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 添加关键字
const addKeyword = () => {
  const keyword = inputValue.value.trim()
  if (keyword && !formData.value.keywords?.includes(keyword)) {
    formData.value.keywords!.push(keyword)
  }
  inputVisible.value = false
  inputValue.value = ''
}

// 移除关键字
const removeKeyword = (keyword: string) => {
  const index = formData.value.keywords?.indexOf(keyword)
  if (index !== undefined && index > -1) {
    formData.value.keywords!.splice(index, 1)
  }
}

// 获取关键字类型
const getKeywordType = (keyword: string) => {
  if (keyword.includes('P0') || keyword.includes('紧急')) return 'danger'
  if (keyword.includes('P1') || keyword.includes('警告')) return 'warning'
  if (keyword.includes('成功') || keyword.includes('完成')) return 'success'
  return 'info'
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

// 测试规则
const testRule = () => {
  if (!formData.value.name || !formData.value.group_id) {
    ElMessage.warning('请先填写基本信息')
    return
  }
  if (!formData.value.keywords || formData.value.keywords.length === 0) {
    ElMessage.warning('请至少添加一个关键字')
    return
  }

  ElMessage.info('规则测试功能开发中...')
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    if (!formData.value.keywords || formData.value.keywords.length === 0) {
      ElMessage.warning('请至少添加一个关键字')
      return
    }

    submitting.value = true

    if (isEdit.value && props.rule) {
      await rulesStore.updateRule(props.rule.id, formData.value)
      ElMessage.success('规则更新成功')
    } else {
      await rulesStore.addRule(formData.value as Omit<Rule, 'id' | 'created_at'>)
      ElMessage.success('规则创建成功')
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
  inputVisible.value = false
  inputValue.value = ''
}
</script>

<style scoped lang="scss">
.rule-form {
  .form-section {
    margin-bottom: $spacing-xl;

    .section-title {
      margin: 0 0 $spacing-lg 0;
      font-size: $font-size-large;
      font-weight: 600;
      color: $text-color-primary;
      border-bottom: 1px solid $border-color-lighter;
      padding-bottom: $spacing-sm;
    }
  }

  .form-tip {
    margin-top: $spacing-xs;
    font-size: $font-size-small;
    color: $text-color-secondary;
    line-height: 1.4;
  }

  .keywords-editor {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    align-items: center;

    .keyword-tag {
      margin-right: $spacing-xs;
    }

    .keyword-input {
      width: 120px;
    }
  }

  .user-option {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    .user-info {
      font-size: $font-size-small;
      color: $text-color-secondary;
    }

    .platform-tag {
      font-size: $font-size-extra-small;
      padding: 2px 6px;
      background: #f0f0f0;
      border-radius: $border-radius-small;
      color: $text-color-regular;
    }
  }

  .color-option {
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;

      &.red { background-color: #F56C6C; }
      &.yellow { background-color: #E6A23C; }
      &.green { background-color: #67C23A; }
      &.blue { background-color: #409EFF; }
    }
  }

  .rule-preview {
    background: #fafafa;
    border-radius: $border-radius-base;
    border: 1px solid $border-color-lighter;
    overflow: hidden;

    .preview-header {
      padding: $spacing-md $spacing-lg;
      background: white;
      border-bottom: 1px solid $border-color-lighter;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }

    .preview-content {
      padding: $spacing-lg;

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

          .preview-keyword {
            margin-right: $spacing-xs;
          }

          .empty {
            color: $text-color-secondary;
            font-style: italic;
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
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
}
</style>