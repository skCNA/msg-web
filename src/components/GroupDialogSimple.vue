<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑群组' : '新建群组'"
    width="600px"
    @closed="handleClosed"
  >
    <el-form :model="formData" label-width="100px">
      <el-form-item label="群组标识">
        <el-input v-model="formData.identifier" placeholder="如: devops" />
      </el-form-item>
      <el-form-item label="群组名称">
        <el-input v-model="formData.name" placeholder="群组显示名称" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="formData.description" type="textarea" placeholder="群组描述" />
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
import type { Group } from '@/types'
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

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.group)

const formData = ref({
  name: '',
  identifier: '',
  description: ''
})

watch(() => props.group, (group) => {
  if (group) {
    formData.value = {
      name: group.name,
      identifier: group.identifier,
      description: group.description || ''
    }
  } else {
    formData.value = {
      name: '',
      identifier: '',
      description: ''
    }
  }
}, { immediate: true })

const handleSubmit = async () => {
  try {
    if (isEdit.value && props.group) {
      await groupsStore.updateGroup(props.group.id, formData.value)
      ElMessage.success('群组更新成功')
    } else {
      await groupsStore.addGroup({
        ...formData.value,
        active: true,
        webhooks: []
      })
      ElMessage.success('群组创建成功')
    }
    emit('success')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleClosed = () => {
  formData.value = {
    name: '',
    identifier: '',
    description: ''
  }
}
</script>