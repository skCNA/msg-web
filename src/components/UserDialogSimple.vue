<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑用户' : '添加用户'"
    width="600px"
    @closed="handleClosed"
  >
    <el-form :model="formData" label-width="100px">
      <el-form-item label="姓名">
        <el-input v-model="formData.name" placeholder="请输入用户姓名" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="formData.email" placeholder="请输入邮箱地址" />
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="formData.phone" placeholder="请输入手机号码" />
      </el-form-item>
      <el-form-item label="部门">
        <el-input v-model="formData.department" placeholder="请输入所属部门" />
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="formData.role" placeholder="请选择用户角色" style="width: 100%">
          <el-option label="系统管理员" value="系统管理员" />
          <el-option label="运维工程师" value="运维工程师" />
          <el-option label="开发工程师" value="开发工程师" />
          <el-option label="测试工程师" value="测试工程师" />
        </el-select>
      </el-form-item>
      <el-form-item label="飞书用户ID">
        <el-input v-model="formData.feishu_user_id" placeholder="飞书用户ID" />
      </el-form-item>
      <el-form-item label="企业微信ID">
        <el-input v-model="formData.wechat_user_id" placeholder="企业微信用户ID" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
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

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.user)

const formData = ref({
  name: '',
  email: '',
  phone: '',
  department: '',
  role: '',
  feishu_user_id: '',
  wechat_user_id: ''
})

watch(() => props.user, (user) => {
  if (user) {
    formData.value = {
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      department: user.department || '',
      role: user.role,
      feishu_user_id: user.feishu_user_id || '',
      wechat_user_id: user.wechat_user_id || ''
    }
  } else {
    formData.value = {
      name: '',
      email: '',
      phone: '',
      department: '',
      role: '',
      feishu_user_id: '',
      wechat_user_id: ''
    }
  }
}, { immediate: true })

const handleSubmit = async () => {
  try {
    if (isEdit.value && props.user) {
      await usersStore.updateUser(props.user.id, {
        ...formData.value,
        active: true
      })
      ElMessage.success('用户信息更新成功')
    } else {
      await usersStore.addUser({
        ...formData.value,
        active: true
      })
      ElMessage.success('用户添加成功')
    }
    emit('success')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleClosed = () => {
  formData.value = {
    name: '',
    email: '',
    phone: '',
    department: '',
    role: '',
    feishu_user_id: '',
    wechat_user_id: ''
  }
}
</script>