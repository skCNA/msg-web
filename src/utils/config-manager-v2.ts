import type { GlobalConfig, Group, User, Rule, Template } from '@/types'
import { sqliteConfigManager } from './sqlite-config-manager'
import { configManager } from './config-manager'

/**
 * 配置管理器 V2 - 智能切换 localStorage 和 SQLite
 * 优先使用 SQLite，降级到 localStorage
 */
export class ConfigManagerV2 {
  private useSQLite = true
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
      // 尝试初始化 SQLite
      await sqliteConfigManager.init()
      this.useSQLite = true
      console.log('Using SQLite for configuration storage')
    } catch (error) {
      console.warn('SQLite initialization failed, falling back to localStorage:', error)
      this.useSQLite = false
      console.log('Using localStorage for configuration storage')
    }

    this.isInitialized = true
  }

  /**
   * 确保已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init()
    }
  }

  /**
   * 检查是否使用 SQLite
   */
  isUsingSQLite(): boolean {
    return this.useSQLite
  }

  /**
   * 获取存储后端
   */
  getStorageBackend(): 'sqlite' | 'localStorage' {
    return this.useSQLite ? 'sqlite' : 'localStorage'
  }

  // 获取所有配置
  getAllConfig(): GlobalConfig {
    if (this.useSQLite) {
      // SQLite 版本是异步的，这里需要特殊处理
      console.warn('SQLite requires async operations, use getAllConfigAsync() instead')
      return configManager.getAllConfig() // 降级到同步版本
    }
    return configManager.getAllConfig()
  }

  // 异步版本的获取所有配置
  async getAllConfigAsync(): Promise<GlobalConfig> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.getAllConfig()
    }
    return Promise.resolve(configManager.getAllConfig())
  }

  // 保存配置
  saveConfig(config: GlobalConfig): void {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use saveConfigAsync() instead')
      configManager.saveConfig(config) // 降级到同步版本
      return
    }
    configManager.saveConfig(config)
  }

  // 异步版本的保存配置
  async saveConfigAsync(config: GlobalConfig): Promise<void> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.saveConfig(config)
    }
    configManager.saveConfig(config)
    return Promise.resolve()
  }

  // 获取默认配置
  getDefaultConfig(): GlobalConfig {
    return configManager.getDefaultConfig()
  }

  // 生成唯一ID
  generateId(): string {
    return configManager.generateId()
  }

  // === 群组管理 ===
  getGroups(): Group[] {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use getGroupsAsync() instead')
      return configManager.getGroups()
    }
    return configManager.getGroups()
  }

  async getGroupsAsync(): Promise<Group[]> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.getGroups()
    }
    return Promise.resolve(configManager.getGroups())
  }

  addGroup(groupData: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Group {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use addGroupAsync() instead')
      return configManager.addGroup(groupData)
    }
    return configManager.addGroup(groupData)
  }

  async addGroupAsync(groupData: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Promise<Group> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.addGroup(groupData)
    }
    return Promise.resolve(configManager.addGroup(groupData))
  }

  updateGroup(id: string, updates: Partial<Group>): Group | null {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use updateGroupAsync() instead')
      return configManager.updateGroup(id, updates)
    }
    return configManager.updateGroup(id, updates)
  }

  async updateGroupAsync(id: string, updates: Partial<Group>): Promise<Group | null> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.updateGroup(id, updates)
    }
    return Promise.resolve(configManager.updateGroup(id, updates))
  }

  deleteGroup(id: string): boolean {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use deleteGroupAsync() instead')
      return configManager.deleteGroup(id)
    }
    return configManager.deleteGroup(id)
  }

  async deleteGroupAsync(id: string): Promise<boolean> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.deleteGroup(id)
    }
    return Promise.resolve(configManager.deleteGroup(id))
  }

  // === 用户管理 ===
  getUsers(): User[] {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use getUsersAsync() instead')
      return configManager.getUsers()
    }
    return configManager.getUsers()
  }

  async getUsersAsync(): Promise<User[]> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.getUsers()
    }
    return Promise.resolve(configManager.getUsers())
  }

  addUser(userData: Omit<User, 'id' | 'created_at'>): User {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use addUserAsync() instead')
      return configManager.addUser(userData)
    }
    return configManager.addUser(userData)
  }

  async addUserAsync(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.addUser(userData)
    }
    return Promise.resolve(configManager.addUser(userData))
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use updateUserAsync() instead')
      return configManager.updateUser(id, updates)
    }
    return configManager.updateUser(id, updates)
  }

  async updateUserAsync(id: string, updates: Partial<User>): Promise<User | null> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.updateUser(id, updates)
    }
    return Promise.resolve(configManager.updateUser(id, updates))
  }

  deleteUser(id: string): boolean {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use deleteUserAsync() instead')
      return configManager.deleteUser(id)
    }
    return configManager.deleteUser(id)
  }

  async deleteUserAsync(id: string): Promise<boolean> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.deleteUser(id)
    }
    return Promise.resolve(configManager.deleteUser(id))
  }

  // === 规则管理 ===
  getRules(): Rule[] {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use getRulesAsync() instead')
      return configManager.getRules()
    }
    return configManager.getRules()
  }

  async getRulesAsync(): Promise<Rule[]> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.getRules()
    }
    return Promise.resolve(configManager.getRules())
  }

  getRulesByGroup(groupId: string): Rule[] {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use getRulesByGroupAsync() instead')
      return configManager.getRulesByGroup(groupId)
    }
    return configManager.getRulesByGroup(groupId)
  }

  async getRulesByGroupAsync(groupId: string): Promise<Rule[]> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.getRulesByGroup(groupId)
    }
    return Promise.resolve(configManager.getRulesByGroup(groupId))
  }

  addRule(ruleData: Omit<Rule, 'id' | 'created_at'>): Rule {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use addRuleAsync() instead')
      return configManager.addRule(ruleData)
    }
    return configManager.addRule(ruleData)
  }

  async addRuleAsync(ruleData: Omit<Rule, 'id' | 'created_at'>): Promise<Rule> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.addRule(ruleData)
    }
    return Promise.resolve(configManager.addRule(ruleData))
  }

  updateRule(id: string, updates: Partial<Rule>): Rule | null {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use updateRuleAsync() instead')
      return configManager.updateRule(id, updates)
    }
    return configManager.updateRule(id, updates)
  }

  async updateRuleAsync(id: string, updates: Partial<Rule>): Promise<Rule | null> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.updateRule(id, updates)
    }
    return Promise.resolve(configManager.updateRule(id, updates))
  }

  deleteRule(id: string): boolean {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use deleteRuleAsync() instead')
      return configManager.deleteRule(id)
    }
    return configManager.deleteRule(id)
  }

  async deleteRuleAsync(id: string): Promise<boolean> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.deleteRule(id)
    }
    return Promise.resolve(configManager.deleteRule(id))
  }

  // === 模板管理 ===
  getTemplates(): Template[] {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use getTemplatesAsync() instead')
      return configManager.getTemplates()
    }
    return configManager.getTemplates()
  }

  async getTemplatesAsync(): Promise<Template[]> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.getTemplates()
    }
    return Promise.resolve(configManager.getTemplates())
  }

  addTemplate(templateData: Omit<Template, 'id' | 'created_at' | 'updated_at'>): Template {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use addTemplateAsync() instead')
      return configManager.addTemplate(templateData)
    }
    return configManager.addTemplate(templateData)
  }

  async addTemplateAsync(templateData: Omit<Template, 'id' | 'created_at' | 'updated_at'>): Promise<Template> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.addTemplate(templateData)
    }
    return Promise.resolve(configManager.addTemplate(templateData))
  }

  updateTemplate(id: string, updates: Partial<Template>): Template | null {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use updateTemplateAsync() instead')
      return configManager.updateTemplate(id, updates)
    }
    return configManager.updateTemplate(id, updates)
  }

  async updateTemplateAsync(id: string, updates: Partial<Template>): Promise<Template | null> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.updateTemplate(id, updates)
    }
    return Promise.resolve(configManager.updateTemplate(id, updates))
  }

  deleteTemplate(id: string): boolean {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use deleteTemplateAsync() instead')
      return configManager.deleteTemplate(id)
    }
    return configManager.deleteTemplate(id)
  }

  async deleteTemplateAsync(id: string): Promise<boolean> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.deleteTemplate(id)
    }
    return Promise.resolve(configManager.deleteTemplate(id))
  }

  // === 配置导入导出 ===
  exportConfig(): GlobalConfig {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use exportConfigAsync() instead')
      return configManager.exportConfig()
    }
    return configManager.exportConfig()
  }

  async exportConfigAsync(): Promise<GlobalConfig> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.exportConfig()
    }
    return Promise.resolve(configManager.exportConfig())
  }

  importConfig(config: GlobalConfig, merge: boolean = true): void {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use importConfigAsync() instead')
      configManager.importConfig(config, merge)
      return
    }
    configManager.importConfig(config, merge)
  }

  async importConfigAsync(config: GlobalConfig, merge: boolean = true): Promise<void> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.importConfig(config, merge)
    }
    configManager.importConfig(config, merge)
    return Promise.resolve()
  }

  // 清空所有配置
  clearAllConfig(): void {
    if (this.useSQLite) {
      console.warn('SQLite requires async operations, use clearAllConfigAsync() instead')
      configManager.clearAllConfig()
      return
    }
    configManager.clearAllConfig()
  }

  async clearAllConfigAsync(): Promise<void> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.clearAllConfig()
    }
    configManager.clearAllConfig()
    return Promise.resolve()
  }

  // === SQLite 特有功能 ===

  /**
   * 获取数据库统计信息（仅 SQLite）
   */
  async getStats(): Promise<any> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.getStats()
    }
    return { storage: 'localStorage', message: 'Stats not available for localStorage' }
  }

  /**
   * 迁移 localStorage 数据到 SQLite
   */
  async migrateFromLocalStorage(): Promise<void> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.migrateFromLocalStorage()
    }
    console.log('Already using localStorage, no migration needed')
  }

  /**
   * 导出完整数据库（仅 SQLite）
   */
  async exportDatabase(): Promise<any> {
    await this.ensureInitialized()

    if (this.useSQLite) {
      return sqliteConfigManager.exportDatabase()
    }
    return { storage: 'localStorage', message: 'Database export not available for localStorage' }
  }
}

// 创建全局实例
export const configManagerV2 = new ConfigManagerV2()