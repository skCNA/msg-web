<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑用户' : '添加用户'"
    width="600px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="user-form"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <h3 class="section-title">基本信息</h3>

        <el-form-item label="姓名" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入用户姓名"
          />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="formData.email"
            type="email"
            placeholder="请输入邮箱地址"
          />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="formData.phone"
            placeholder="请输入手机号码"
          />
        </el-form-item>

        <el-form-item label="部门" prop="department">
          <el-input
            v-model="formData.department"
            placeholder="请输入所属部门"
          />
        </el-form-item>

        <el-form-item label="角色" prop="role">
          <el-select
            v-model="formData.role"
            placeholder="请选择用户角色"
            style="width: 100%"
          >
            <el-option label="系统管理员" value="系统管理员" />
            <el-option label="运维工程师" value="运维工程师" />
            <el-option label="开发工程师" value="开发工程师" />
            <el-option label="测试工程师" value="测试工程师" />
            <el-option label="产品经理" value="产品经理" />
            <el-option label="UI设计师" value="UI设计师" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-switch
            v-model="formData.active"
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
      </div>

      <!-- 通知配置 -->
      <div class="form-section">
        <h3 class="section-title">通知配置</h3>

        <el-form-item label="飞书用户ID">
          <el-input
            v-model="formData.feishu_user_id"
            placeholder="飞书用户的唯一标识，如: ou_xxx"
          >
            <template #append>
              <el-button @click="testFeishuConnection">测试</el-button>
            </template>
          </el-input>
          <div class="form-tip">
            在飞书中获取用户ID：打开飞书 -> 设置 -> 我的账户 -> 用户ID
          </div>
        </el-form-item>

        <el-form-item label="企业微信ID">
          <el-input
            v-model="formData.wechat_user_id"
            placeholder="企业微信用户的唯一标识，如: user_xxx"
          >
            <template #append>
              <el-button @click="testWechatConnection">测试</el-button>
            </template>
          </el-input>
          <div class="form-tip">
            在企业微信中获取用户ID：通过企业微信API或联系管理员获取
          </div>
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '保存' : '添加' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { User } from '@/types'
import { useUsersStore } from '@/stores/users'

interface Props {
  modelValue: boolean
  user?: User | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const usersStore = useUsersStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.user)

const formData = ref<Partial<User>>({
  name: '',
  email: '',
  phone: '',
  department: '',
  role: '',
  feishu_user_id: '',
  wechat_user_id: '',
  active: true
})

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入用户姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择用户角色', trigger: 'change' }
  ]
}

watch(() => props.user, (user) => {
  if (user) {
    formData.value = { ...user }
  } else {
    resetForm()
  }
}, { immediate: true })

const resetForm = () => {
  formData.value = {
    name: '',
    email: '',
    phone: '',
    department: '',
    role: '',
    feishu_user_id: '',
    wechat_user_id: '',
    active: true
  }
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const testFeishuConnection = async () => {
  if (!formData.value.feishu_user_id) {
    ElMessage.warning('请先输入飞书用户ID')
    return
  }

  ElMessage.info('测试飞书连接功能开发中...')
  // 这里可以实现真实的飞书连接测试
}

const testWechatConnection = async () => {
  if (!formData.value.wechat_user_id) {
    ElMessage.warning('请先输入企业微信用户ID')
    return
  }

  ElMessage.info('测试企业微信连接功能开发中...')
  // 这里可以实现真实的企业微信连接测试
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (isEdit.value && props.user) {
      await usersStore.updateUser(props.user.id, formData.value)
      ElMessage.success('用户信息更新成功')
    } else {
      await usersStore.addUser(formData.value as Omit<User, 'id' | 'created_at'>)
      ElMessage.success('用户添加成功')
    }

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

<style scoped lang="scss">
.user-form {
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
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
}
</style>