import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Template, TemplateCondition } from '@/types'
import { configManager } from '@/utils/config-manager'

export const useTemplatesStore = defineStore('templates', () => {
  // 状态
  const templates = ref<Template[]>([])
  const loading = ref(false)

  // 计算属性
  const templateCount = computed(() => templates.value.length)

  // 预设模板
  const presetTemplates = computed(() => {
    return [
      {
        id: 'preset_p0',
        name: 'P0紧急告警模板',
        description: '用于P0级别紧急告警',
        isPreset: true,
        conditions: [
          { field: 'level', operator: 'equals', value: 'P0' },
          { field: 'level', operator: 'equals', value: 'critical' }
        ] as TemplateCondition[],
        style: {
          title_template: '【P0紧急】{service}',
          template_color: 'red' as const,
          icon_token: 'alert-circle_outlined',
          tag_text: 'P0紧急',
          tag_color: 'red'
        },
        content: {
          left_content: [
            '报警时间: {timestamp}',
            '报警类型: {source}',
            '服务名称: {service}',
            '故障描述: {description}'
          ],
          right_content: [
            '@相关用户: {mentions}',
            '请立即处理'
          ],
          button_text: '查看详情'
        }
      },
      {
        id: 'preset_p1',
        name: 'P1警告告警模板',
        description: '用于P1级别警告告警',
        isPreset: true,
        conditions: [
          { field: 'level', operator: 'equals', value: 'P1' },
          { field: 'level', operator: 'equals', value: 'warning' }
        ] as TemplateCondition[],
        style: {
          title_template: '【P1警告】{service}',
          template_color: 'yellow' as const,
          icon_token: 'warning_outlined',
          tag_text: 'P1警告',
          tag_color: 'yellow'
        },
        content: {
          left_content: [
            '报警时间: {timestamp}',
            '报警类型: {source}',
            '服务名称: {service}',
            '故障描述: {description}'
          ],
          right_content: [
            '@相关用户: {mentions}',
            '请及时处理'
          ],
          button_text: '查看详情'
        }
      },
      {
        id: 'preset_cicd_success',
        name: 'CI/CD成功模板',
        description: '用于CI/CD部署成功通知',
        isPreset: true,
        conditions: [
          { field: 'type', operator: 'equals', value: 'coding_cicd' },
          { field: 'description', operator: 'contains', value: '已完成' }
        ] as TemplateCondition[],
        style: {
          title_template: '🚀 部署成功',
          template_color: 'green' as const,
          icon_token: 'check-circle_outlined',
          tag_text: '部署成功',
          tag_color: 'green'
        },
        content: {
          left_content: [
            '触发时间: {timestamp}',
            '项目名称: {service}',
            '触发类型: {source}',
            '部署状态: 成功'
          ],
          right_content: [
            '恭喜！部署成功',
            '查看部署详情'
          ],
          button_text: '查看详情'
        }
      }
    ]
  })

  // 所有模板（包含预设模板）
  const allTemplates = computed(() => {
    return [...templates.value, ...presetTemplates.value]
  })

  // 获取模板详情
  const getTemplateById = (id: string) => {
    return allTemplates.value.find(t => t.id === id)
  }

  // 加载模板列表
  const loadTemplates = async () => {
    loading.value = true
    try {
      templates.value = configManager.getTemplates()
    } catch (error) {
      console.error('Failed to load templates:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 添加模板
  const addTemplate = async (templateData: Omit<Template, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTemplate = configManager.addTemplate(templateData)
      templates.value.push(newTemplate)
      return newTemplate
    } catch (error) {
      console.error('Failed to add template:', error)
      throw error
    }
  }

  // 更新模板
  const updateTemplate = async (id: string, updates: Partial<Template>) => {
    try {
      const updatedTemplate = configManager.updateTemplate(id, updates)
      if (updatedTemplate) {
        const index = templates.value.findIndex(t => t.id === id)
        if (index !== -1) {
          templates.value[index] = updatedTemplate
        }
      }
      return updatedTemplate
    } catch (error) {
      console.error('Failed to update template:', error)
      throw error
    }
  }

  // 删除模板
  const deleteTemplate = async (id: string) => {
    try {
      const success = configManager.deleteTemplate(id)
      if (success) {
        templates.value = templates.value.filter(t => t.id !== id)
      }
      return success
    } catch (error) {
      console.error('Failed to delete template:', error)
      throw error
    }
  }

  // 复制模板
  const duplicateTemplate = async (templateId: string) => {
    const template = getTemplateById(templateId)
    if (template && !('isPreset' in template)) {
      const newTemplate = {
        ...template,
        name: `${template.name} (副本)`
      }
      // 移除ID和时间戳，让系统重新生成
      const { id, created_at, updated_at, ...templateData } = newTemplate
      return await addTemplate(templateData as Omit<Template, 'id' | 'created_at' | 'updated_at'>)
    }
  }

  // 测试模板匹配
  const testTemplateMatch = (template: Template, messageData: any): boolean => {
    if (!template.conditions || template.conditions.length === 0) {
      return true
    }

    return template.conditions.every(condition => {
      const fieldValue = messageData[condition.field]
      if (fieldValue === undefined) return false

      const value = String(fieldValue).toLowerCase()
      const conditionValue = String(condition.value).toLowerCase()

      switch (condition.operator) {
        case 'equals':
          return value === conditionValue
        case 'contains':
          return value.includes(conditionValue)
        case 'regex':
          try {
            const regex = new RegExp(condition.value, 'i')
            return regex.test(value)
          } catch {
            return false
          }
        default:
          return false
      }
    })
  }

  // 获取匹配的模板
  const getMatchingTemplate = (messageData: any) => {
    const matchingTemplates = allTemplates.value
      .filter(template => testTemplateMatch(template, messageData))
      .sort((a, b) => {
        // 如果是自定义模板，优先级高于预设模板
        const aIsPreset = 'isPreset' in a
        const bIsPreset = 'isPreset' in b
        if (aIsPreset !== bIsPreset) {
          return aIsPreset ? 1 : -1
        }
        return 0
      })

    return matchingTemplates[0] || presetTemplates.value[0] // 默认返回第一个预设模板
  }

  return {
    // 状态
    templates,
    loading,

    // 计算属性
    templateCount,
    presetTemplates,
    allTemplates,

    // 方法
    getTemplateById,
    loadTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    testTemplateMatch,
    getMatchingTemplate
  }
})