import type { GlobalConfig, Group, User, Rule, Template } from '@/types'
import { sqliteManager } from './sqlite-manager'

const CONFIG_VERSION = '1.0.0'

export class SQLiteConfigManager {
  private isInitialized = false

  constructor() {
    this.init()
  }

  /**
   * 初始化配置管理器
   */
  async init(): Promise<void> {
    if (this.isInitialized) return

    try {
      await sqliteManager.init()

      // 初始化默认配置（如果不存在）
      const hasConfig = await sqliteManager.has('webhook_config')
      if (!hasConfig) {
        await this.saveConfig(this.getDefaultConfig())
      }

      this.isInitialized = true
      console.log('SQLite Config Manager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize SQLite Config Manager:', error)
      // 降级到 localStorage
      console.warn('Falling back to localStorage')
    }
  }

  /**
   * 确保已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init()
    }
  }

  // 获取所有配置
  async getAllConfig(): Promise<GlobalConfig> {
    await this.ensureInitialized()

    try {
      const config = await sqliteManager.get('webhook_config')
      if (config) {
        // 版本兼容性检查
        if (!config.settings || config.settings.version !== CONFIG_VERSION) {
          return this.migrateConfig(config)
        }
        return config
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }
    return this.getDefaultConfig()
  }

  // 保存配置
  async saveConfig(config: GlobalConfig): Promise<void> {
    await this.ensureInitialized()

    try {
      config.settings.updated_at = new Date().toISOString()
      await sqliteManager.set('webhook_config', config)
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
  private async migrateConfig(oldConfig: any): Promise<GlobalConfig> {
    const defaultConfig = this.getDefaultConfig()
    // 迁移逻辑可以在这里实现
    const migratedConfig = { ...defaultConfig, ...oldConfig }
    await this.saveConfig(migratedConfig)
    return migratedConfig
  }

  // 生成唯一ID
  generateId(): string {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // === 群组管理 ===
  async getGroups(): Promise<Group[]> {
    const config = await this.getAllConfig()
    return config.groups
  }

  async addGroup(groupData: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Promise<Group> {
    const config = await this.getAllConfig()
    const newGroup: Group = {
      id: this.generateId(),
      ...groupData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    config.groups.push(newGroup)
    await this.saveConfig(config)
    return newGroup
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<Group | null> {
    const config = await this.getAllConfig()
    const index = config.groups.findIndex(g => g.id === id)
    if (index !== -1) {
      config.groups[index] = {
        ...config.groups[index],
        ...updates,
        updated_at: new Date().toISOString()
      }
      await this.saveConfig(config)
      return config.groups[index]
    }
    return null
  }

  async deleteGroup(id: string): Promise<boolean> {
    const config = await this.getAllConfig()
    const index = config.groups.findIndex(g => g.id === id)
    if (index !== -1) {
      config.groups.splice(index, 1)
      // 同时删除相关的规则
      config.rules = config.rules.filter(r => r.group_id !== id)
      await this.saveConfig(config)
      return true
    }
    return false
  }

  // === 用户管理 ===
  async getUsers(): Promise<User[]> {
    const config = await this.getAllConfig()
    return config.users
  }

  async addUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const config = await this.getAllConfig()
    const newUser: User = {
      id: this.generateId(),
      ...userData,
      created_at: new Date().toISOString()
    }
    config.users.push(newUser)
    await this.saveConfig(config)
    return newUser
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const config = await this.getAllConfig()
    const index = config.users.findIndex(u => u.id === id)
    if (index !== -1) {
      config.users[index] = { ...config.users[index], ...updates }
      await this.saveConfig(config)
      return config.users[index]
    }
    return null
  }

  async deleteUser(id: string): Promise<boolean> {
    const config = await this.getAllConfig()
    const index = config.users.findIndex(u => u.id === id)
    if (index !== -1) {
      config.users.splice(index, 1)
      // 从规则中移除该用户
      config.rules.forEach(rule => {
        rule.user_ids = rule.user_ids.filter(userId => userId !== id)
      })
      await this.saveConfig(config)
      return true
    }
    return false
  }

  // === 规则管理 ===
  async getRules(): Promise<Rule[]> {
    const config = await this.getAllConfig()
    return config.rules
  }

  async getRulesByGroup(groupId: string): Promise<Rule[]> {
    const config = await this.getAllConfig()
    return config.rules.filter(r => r.group_id === groupId)
  }

  async addRule(ruleData: Omit<Rule, 'id' | 'created_at'>): Promise<Rule> {
    const config = await this.getAllConfig()
    const newRule: Rule = {
      id: this.generateId(),
      ...ruleData,
      created_at: new Date().toISOString()
    }
    config.rules.push(newRule)
    await this.saveConfig(config)
    return newRule
  }

  async updateRule(id: string, updates: Partial<Rule>): Promise<Rule | null> {
    const config = await this.getAllConfig()
    const index = config.rules.findIndex(r => r.id === id)
    if (index !== -1) {
      config.rules[index] = { ...config.rules[index], ...updates }
      await this.saveConfig(config)
      return config.rules[index]
    }
    return null
  }

  async deleteRule(id: string): Promise<boolean> {
    const config = await this.getAllConfig()
    const index = config.rules.findIndex(r => r.id === id)
    if (index !== -1) {
      config.rules.splice(index, 1)
      await this.saveConfig(config)
      return true
    }
    return false
  }

  // === 模板管理 ===
  async getTemplates(): Promise<Template[]> {
    const config = await this.getAllConfig()
    return config.templates
  }

  async addTemplate(templateData: Omit<Template, 'id' | 'created_at' | 'updated_at'>): Promise<Template> {
    const config = await this.getAllConfig()
    const newTemplate: Template = {
      id: this.generateId(),
      ...templateData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    config.templates.push(newTemplate)
    await this.saveConfig(config)
    return newTemplate
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template | null> {
    const config = await this.getAllConfig()
    const index = config.templates.findIndex(t => t.id === id)
    if (index !== -1) {
      config.templates[index] = {
        ...config.templates[index],
        ...updates,
        updated_at: new Date().toISOString()
      }
      await this.saveConfig(config)
      return config.templates[index]
    }
    return null
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const config = await this.getAllConfig()
    const index = config.templates.findIndex(t => t.id === id)
    if (index !== -1) {
      config.templates.splice(index, 1)
      await this.saveConfig(config)
      return true
    }
    return false
  }

  // === 配置导入导出 ===
  async exportConfig(): Promise<GlobalConfig> {
    return this.getAllConfig()
  }

  async importConfig(config: GlobalConfig, merge: boolean = true): Promise<void> {
    if (merge) {
      const currentConfig = await this.getAllConfig()
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
      await this.saveConfig(mergedConfig)
    } else {
      config.settings = {
        version: CONFIG_VERSION,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      await this.saveConfig(config)
    }
  }

  // 清空所有配置
  async clearAllConfig(): Promise<void> {
    await sqliteManager.delete('webhook_config')
  }

  // 备份配置
  async backupConfig(): Promise<void> {
    const config = await this.getAllConfig()
    const backupKey = `webhook_config_backup_${Date.now()}`
    await sqliteManager.set(backupKey, config)
  }

  // 获取备份列表
  async getBackupList(): Promise<string[]> {
    const keys = await sqliteManager.keys()
    return keys
      .filter(key => key.startsWith('webhook_config_backup_'))
      .sort()
      .reverse()
  }

  // 恢复备份
  async restoreBackup(backupKey: string): Promise<void> {
    const backup = await sqliteManager.get(backupKey)
    if (backup) {
      await sqliteManager.set('webhook_config', backup)
    }
  }

  // === SQLite 特有功能 ===

  /**
   * 获取数据库统计信息
   */
  async getStats(): Promise<any> {
    return sqliteManager.getStats()
  }

  /**
   * 导出完整数据库
   */
  async exportDatabase(): Promise<any> {
    return sqliteManager.export()
  }

  /**
   * 导入数据库
   */
  async importDatabase(data: any): Promise<void> {
    await sqliteManager.import(data)
  }

  /**
   * 执行自定义查询
   */
  async query(sql: string, params: any[] = []): Promise<any[]> {
    return sqliteManager.query(sql, params)
  }

  /**
   * 批量操作
   */
  async batch(operations: Array<{
    type: 'set' | 'delete'
    key?: string
    data?: any
  }>): Promise<void> {
    await sqliteManager.batch(operations)
  }

  /**
   * 从 localStorage 迁移数据
   */
  async migrateFromLocalStorage(): Promise<void> {
    try {
      // 检查是否已有数据
      const hasConfig = await sqliteManager.has('webhook_config')
      if (hasConfig) {
        console.log('SQLite already has data, skipping migration')
        return
      }

      // 从 localStorage 读取数据
      const localStorageData = localStorage.getItem('webhook_config_data')
      if (localStorageData) {
        const config = JSON.parse(localStorageData)
        await this.saveConfig(config)
        console.log('Successfully migrated data from localStorage to SQLite')

        // 询问是否删除 localStorage 数据
        if (confirm('数据迁移成功！是否删除旧的 localStorage 数据？')) {
          localStorage.removeItem('webhook_config_data')
        }
      } else {
        console.log('No data found in localStorage to migrate')
      }
    } catch (error) {
      console.error('Failed to migrate from localStorage:', error)
      throw error
    }
  }
}

// 创建全局实例
export const sqliteConfigManager = new SQLiteConfigManager()