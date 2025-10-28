import type { GlobalConfig, Group, User, Rule, Template } from '@/types'

const CONFIG_KEY = 'webhook_config_data'
const CONFIG_VERSION = '1.0.0'

export class ConfigManager {
  private storage: Storage
  private configKey: string

  constructor(storage: Storage = localStorage) {
    this.storage = storage
    this.configKey = CONFIG_KEY
  }

  // 获取所有配置
  getAllConfig(): GlobalConfig {
    try {
      const config = this.storage.getItem(this.configKey)
      if (config) {
        const parsed = JSON.parse(config)
        // 版本兼容性检查
        if (!parsed.settings || parsed.settings.version !== CONFIG_VERSION) {
          return this.migrateConfig(parsed)
        }
        return parsed
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }
    return this.getDefaultConfig()
  }

  // 保存配置
  saveConfig(config: GlobalConfig): void {
    try {
      config.settings.updated_at = new Date().toISOString()
      this.storage.setItem(this.configKey, JSON.stringify(config))
    } catch (error) {
      console.error('Failed to save config:', error)
      throw new Error('配置保存失败')
    }
  }

  // 获取默认配置
  getDefaultConfig(): GlobalConfig {
    return {
      groups: [],
      users: [],
      rules: [],
      templates: [],
      settings: {
        version: CONFIG_VERSION,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  }

  // 配置迁移（用于版本升级）
  private migrateConfig(oldConfig: any): GlobalConfig {
    const defaultConfig = this.getDefaultConfig()
    // 迁移逻辑可以在这里实现
    return { ...defaultConfig, ...oldConfig }
  }

  // 生成唯一ID
  generateId(): string {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // === 群组管理 ===
  getGroups(): Group[] {
    return this.getAllConfig().groups
  }

  addGroup(groupData: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Group {
    const config = this.getAllConfig()
    const newGroup: Group = {
      id: this.generateId(),
      ...groupData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    config.groups.push(newGroup)
    this.saveConfig(config)
    return newGroup
  }

  updateGroup(id: string, updates: Partial<Group>): Group | null {
    const config = this.getAllConfig()
    const index = config.groups.findIndex(g => g.id === id)
    if (index !== -1) {
      config.groups[index] = {
        ...config.groups[index],
        ...updates,
        updated_at: new Date().toISOString()
      }
      this.saveConfig(config)
      return config.groups[index]
    }
    return null
  }

  deleteGroup(id: string): boolean {
    const config = this.getAllConfig()
    const index = config.groups.findIndex(g => g.id === id)
    if (index !== -1) {
      config.groups.splice(index, 1)
      // 同时删除相关的规则
      config.rules = config.rules.filter(r => r.group_id !== id)
      this.saveConfig(config)
      return true
    }
    return false
  }

  // === 用户管理 ===
  getUsers(): User[] {
    return this.getAllConfig().users
  }

  addUser(userData: Omit<User, 'id' | 'created_at'>): User {
    const config = this.getAllConfig()
    const newUser: User = {
      id: this.generateId(),
      ...userData,
      created_at: new Date().toISOString()
    }
    config.users.push(newUser)
    this.saveConfig(config)
    return newUser
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const config = this.getAllConfig()
    const index = config.users.findIndex(u => u.id === id)
    if (index !== -1) {
      config.users[index] = { ...config.users[index], ...updates }
      this.saveConfig(config)
      return config.users[index]
    }
    return null
  }

  deleteUser(id: string): boolean {
    const config = this.getAllConfig()
    const index = config.users.findIndex(u => u.id === id)
    if (index !== -1) {
      config.users.splice(index, 1)
      // 从规则中移除该用户
      config.rules.forEach(rule => {
        rule.user_ids = rule.user_ids.filter(userId => userId !== id)
      })
      this.saveConfig(config)
      return true
    }
    return false
  }

  // === 规则管理 ===
  getRules(): Rule[] {
    return this.getAllConfig().rules
  }

  getRulesByGroup(groupId: string): Rule[] {
    return this.getAllConfig().rules.filter(r => r.group_id === groupId)
  }

  addRule(ruleData: Omit<Rule, 'id' | 'created_at'>): Rule {
    const config = this.getAllConfig()
    const newRule: Rule = {
      id: this.generateId(),
      ...ruleData,
      created_at: new Date().toISOString()
    }
    config.rules.push(newRule)
    this.saveConfig(config)
    return newRule
  }

  updateRule(id: string, updates: Partial<Rule>): Rule | null {
    const config = this.getAllConfig()
    const index = config.rules.findIndex(r => r.id === id)
    if (index !== -1) {
      config.rules[index] = { ...config.rules[index], ...updates }
      this.saveConfig(config)
      return config.rules[index]
    }
    return null
  }

  deleteRule(id: string): boolean {
    const config = this.getAllConfig()
    const index = config.rules.findIndex(r => r.id === id)
    if (index !== -1) {
      config.rules.splice(index, 1)
      this.saveConfig(config)
      return true
    }
    return false
  }

  // === 模板管理 ===
  getTemplates(): Template[] {
    return this.getAllConfig().templates
  }

  addTemplate(templateData: Omit<Template, 'id' | 'created_at' | 'updated_at'>): Template {
    const config = this.getAllConfig()
    const newTemplate: Template = {
      id: this.generateId(),
      ...templateData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    config.templates.push(newTemplate)
    this.saveConfig(config)
    return newTemplate
  }

  updateTemplate(id: string, updates: Partial<Template>): Template | null {
    const config = this.getAllConfig()
    const index = config.templates.findIndex(t => t.id === id)
    if (index !== -1) {
      config.templates[index] = {
        ...config.templates[index],
        ...updates,
        updated_at: new Date().toISOString()
      }
      this.saveConfig(config)
      return config.templates[index]
    }
    return null
  }

  deleteTemplate(id: string): boolean {
    const config = this.getAllConfig()
    const index = config.templates.findIndex(t => t.id === id)
    if (index !== -1) {
      config.templates.splice(index, 1)
      this.saveConfig(config)
      return true
    }
    return false
  }

  // === 配置导入导出 ===
  exportConfig(): GlobalConfig {
    return this.getAllConfig()
  }

  importConfig(config: GlobalConfig, merge: boolean = true): void {
    if (merge) {
      const currentConfig = this.getAllConfig()
      const mergedConfig = {
        groups: [...currentConfig.groups, ...config.groups],
        users: [...currentConfig.users, ...config.users],
        rules: [...currentConfig.rules, ...config.rules],
        templates: [...currentConfig.templates, ...config.templates],
        settings: {
          version: CONFIG_VERSION,
          created_at: currentConfig.settings.created_at,
          updated_at: new Date().toISOString()
        }
      }
      this.saveConfig(mergedConfig)
    } else {
      config.settings = {
        version: CONFIG_VERSION,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      this.saveConfig(config)
    }
  }

  // 清空所有配置
  clearAllConfig(): void {
    this.storage.removeItem(this.configKey)
  }

  // 备份配置
  backupConfig(): void {
    const config = this.getAllConfig()
    const backupKey = `${this.configKey}_backup_${Date.now()}`
    this.storage.setItem(backupKey, JSON.stringify(config))
  }

  // 获取备份列表
  getBackupList(): string[] {
    const keys = Object.keys(this.storage)
    return keys
      .filter(key => key.startsWith(`${this.configKey}_backup_`))
      .sort()
      .reverse()
  }

  // 恢复备份
  restoreBackup(backupKey: string): void {
    const backup = this.storage.getItem(backupKey)
    if (backup) {
      this.storage.setItem(this.configKey, backup)
    }
  }
}

// 创建全局实例
export const configManager = new ConfigManager()