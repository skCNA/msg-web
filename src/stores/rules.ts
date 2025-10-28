import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Rule } from '@/types'
import { configManager } from '@/utils/config-manager'

export const useRulesStore = defineStore('rules', () => {
  // 状态
  const rules = ref<Rule[]>([])
  const loading = ref(false)

  // 计算属性
  const activeRules = computed(() => rules.value.filter(r => r.active))
  const ruleCount = computed(() => rules.value.length)
  const activeRuleCount = computed(() => activeRules.value.length)

  // 获取规则详情
  const getRuleById = (id: string) => {
    return rules.value.find(r => r.id === id)
  }

  // 根据群组ID获取规则
  const getRulesByGroup = (groupId: string) => {
    return rules.value.filter(r => r.group_id === groupId)
  }

  // 加载规则列表
  const loadRules = async () => {
    loading.value = true
    try {
      rules.value = configManager.getRules()
    } catch (error) {
      console.error('Failed to load rules:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 添加规则
  const addRule = async (ruleData: Omit<Rule, 'id' | 'created_at'>) => {
    try {
      const newRule = configManager.addRule(ruleData)
      rules.value.push(newRule)
      return newRule
    } catch (error) {
      console.error('Failed to add rule:', error)
      throw error
    }
  }

  // 更新规则
  const updateRule = async (id: string, updates: Partial<Rule>) => {
    try {
      const updatedRule = configManager.updateRule(id, updates)
      if (updatedRule) {
        const index = rules.value.findIndex(r => r.id === id)
        if (index !== -1) {
          rules.value[index] = updatedRule
        }
      }
      return updatedRule
    } catch (error) {
      console.error('Failed to update rule:', error)
      throw error
    }
  }

  // 删除规则
  const deleteRule = async (id: string) => {
    try {
      const success = configManager.deleteRule(id)
      if (success) {
        rules.value = rules.value.filter(r => r.id !== id)
      }
      return success
    } catch (error) {
      console.error('Failed to delete rule:', error)
      throw error
    }
  }

  // 切换规则状态
  const toggleRuleStatus = async (id: string) => {
    const rule = getRuleById(id)
    if (rule) {
      return await updateRule(id, { active: !rule.active })
    }
  }

  // 批量更新规则状态
  const batchUpdateRuleStatus = async (ids: string[], active: boolean) => {
    const promises = ids.map(id => updateRule(id, { active }))
    await Promise.all(promises)
  }

  // 测试规则匹配
  const testRuleMatch = (rule: Rule, message: string): boolean => {
    if (!rule.active) return false

    const messageLower = message.toLowerCase()
    return rule.keywords.some(keyword =>
      messageLower.includes(keyword.toLowerCase())
    )
  }

  // 获取匹配的规则
  const getMatchingRules = (groupId: string, message: string) => {
    const groupRules = getRulesByGroup(groupId)
    return groupRules
      .filter(rule => testRuleMatch(rule, message))
      .sort((a, b) => b.priority - a.priority) // 按优先级排序
  }

  return {
    // 状态
    rules,
    loading,

    // 计算属性
    activeRules,
    ruleCount,
    activeRuleCount,

    // 方法
    getRuleById,
    getRulesByGroup,
    loadRules,
    addRule,
    updateRule,
    deleteRule,
    toggleRuleStatus,
    batchUpdateRuleStatus,
    testRuleMatch,
    getMatchingRules
  }
})