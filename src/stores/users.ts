import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { configManager } from '@/utils/config-manager'

export const useUsersStore = defineStore('users', () => {
  // 状态
  const users = ref<User[]>([])
  const loading = ref(false)

  // 计算属性
  const activeUsers = computed(() => users.value.filter(u => u.active))
  const userCount = computed(() => users.value.length)
  const activeUserCount = computed(() => activeUsers.value.length)

  // 获取用户详情
  const getUserById = (id: string) => {
    return users.value.find(u => u.id === id)
  }

  const getUserByFeishuId = (feishuId: string) => {
    return users.value.find(u => u.feishu_user_id === feishuId)
  }

  const getUserByWechatId = (wechatId: string) => {
    return users.value.find(u => u.wechat_user_id === wechatId)
  }

  // 加载用户列表
  const loadUsers = async () => {
    loading.value = true
    try {
      users.value = configManager.getUsers()
    } catch (error) {
      console.error('Failed to load users:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 添加用户
  const addUser = async (userData: Omit<User, 'id' | 'created_at'>) => {
    try {
      // 检查飞书ID是否已存在
      if (userData.feishu_user_id && getUserByFeishuId(userData.feishu_user_id)) {
        throw new Error(`飞书用户ID "${userData.feishu_user_id}" 已存在`)
      }

      // 检查企业微信ID是否已存在
      if (userData.wechat_user_id && getUserByWechatId(userData.wechat_user_id)) {
        throw new Error(`企业微信用户ID "${userData.wechat_user_id}" 已存在`)
      }

      const newUser = configManager.addUser(userData)
      users.value.push(newUser)
      return newUser
    } catch (error) {
      console.error('Failed to add user:', error)
      throw error
    }
  }

  // 更新用户
  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      // 如果更新飞书ID，检查是否与其他用户冲突
      if (updates.feishu_user_id) {
        const existingUser = getUserByFeishuId(updates.feishu_user_id)
        if (existingUser && existingUser.id !== id) {
          throw new Error(`飞书用户ID "${updates.feishu_user_id}" 已存在`)
        }
      }

      // 如果更新企业微信ID，检查是否与其他用户冲突
      if (updates.wechat_user_id) {
        const existingUser = getUserByWechatId(updates.wechat_user_id)
        if (existingUser && existingUser.id !== id) {
          throw new Error(`企业微信用户ID "${updates.wechat_user_id}" 已存在`)
        }
      }

      const updatedUser = configManager.updateUser(id, updates)
      if (updatedUser) {
        const index = users.value.findIndex(u => u.id === id)
        if (index !== -1) {
          users.value[index] = updatedUser
        }
      }
      return updatedUser
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    }
  }

  // 删除用户
  const deleteUser = async (id: string) => {
    try {
      const success = configManager.deleteUser(id)
      if (success) {
        users.value = users.value.filter(u => u.id !== id)
      }
      return success
    } catch (error) {
      console.error('Failed to delete user:', error)
      throw error
    }
  }

  // 切换用户状态
  const toggleUserStatus = async (id: string) => {
    const user = getUserById(id)
    if (user) {
      return await updateUser(id, { active: !user.active })
    }
  }

  // 获取用户显示名称
  const getUserDisplayName = (userId: string) => {
    const user = getUserById(userId)
    return user ? user.name : '未知用户'
  }

  // 获取用户飞书ID
  const getUserFeishuId = (userId: string) => {
    const user = getUserById(userId)
    return user?.feishu_user_id
  }

  return {
    // 状态
    users,
    loading,

    // 计算属性
    activeUsers,
    userCount,
    activeUserCount,

    // 方法
    getUserById,
    getUserByFeishuId,
    getUserByWechatId,
    loadUsers,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getUserDisplayName,
    getUserFeishuId
  }
})