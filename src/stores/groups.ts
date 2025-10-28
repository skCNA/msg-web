import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Group } from '@/types'
import { configManager } from '@/utils/config-manager'

export const useGroupsStore = defineStore('groups', () => {
  // 状态
  const groups = ref<Group[]>([])
  const loading = ref(false)
  const currentGroup = ref<Group | null>(null)

  // 计算属性
  const activeGroups = computed(() => groups.value.filter(g => g.active))
  const groupCount = computed(() => groups.value.length)
  const activeGroupCount = computed(() => activeGroups.value.length)

  // 获取群组详情
  const getGroupById = (id: string) => {
    return groups.value.find(g => g.id === id)
  }

  const getGroupByIdentifier = (identifier: string) => {
    return groups.value.find(g => g.identifier === identifier)
  }

  // 加载群组列表
  const loadGroups = async () => {
    loading.value = true
    try {
      groups.value = configManager.getGroups()
    } catch (error) {
      console.error('Failed to load groups:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 添加群组
  const addGroup = async (groupData: Omit<Group, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // 检查标识符是否已存在
      if (getGroupByIdentifier(groupData.identifier)) {
        throw new Error(`群组标识符 "${groupData.identifier}" 已存在`)
      }

      const newGroup = configManager.addGroup(groupData)
      groups.value.push(newGroup)
      return newGroup
    } catch (error) {
      console.error('Failed to add group:', error)
      throw error
    }
  }

  // 更新群组
  const updateGroup = async (id: string, updates: Partial<Group>) => {
    try {
      // 如果更新标识符，检查是否与其他群组冲突
      if (updates.identifier) {
        const existingGroup = getGroupByIdentifier(updates.identifier)
        if (existingGroup && existingGroup.id !== id) {
          throw new Error(`群组标识符 "${updates.identifier}" 已存在`)
        }
      }

      const updatedGroup = configManager.updateGroup(id, updates)
      if (updatedGroup) {
        const index = groups.value.findIndex(g => g.id === id)
        if (index !== -1) {
          groups.value[index] = updatedGroup
        }
        if (currentGroup.value?.id === id) {
          currentGroup.value = updatedGroup
        }
      }
      return updatedGroup
    } catch (error) {
      console.error('Failed to update group:', error)
      throw error
    }
  }

  // 删除群组
  const deleteGroup = async (id: string) => {
    try {
      const success = configManager.deleteGroup(id)
      if (success) {
        groups.value = groups.value.filter(g => g.id !== id)
        if (currentGroup.value?.id === id) {
          currentGroup.value = null
        }
      }
      return success
    } catch (error) {
      console.error('Failed to delete group:', error)
      throw error
    }
  }

  // 设置当前群组
  const setCurrentGroup = (group: Group | null) => {
    currentGroup.value = group
  }

  // 切换群组状态
  const toggleGroupStatus = async (id: string) => {
    const group = getGroupById(id)
    if (group) {
      return await updateGroup(id, { active: !group.active })
    }
  }

  return {
    // 状态
    groups,
    loading,
    currentGroup,

    // 计算属性
    activeGroups,
    groupCount,
    activeGroupCount,

    // 方法
    getGroupById,
    getGroupByIdentifier,
    loadGroups,
    addGroup,
    updateGroup,
    deleteGroup,
    setCurrentGroup,
    toggleGroupStatus
  }
})