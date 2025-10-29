/**
 * SQLite 数据库管理器
 * 使用 wa-sqlite 在浏览器中实现真正的 SQLite 数据库
 */

import { sqlite3 } from 'wa-sqlite'

export class SQLiteManager {
  private db: any = null
  private readonly dbName = 'webhook-config.db'
  private isInitialized = false

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (this.isInitialized) return

    try {
      // 初始化 SQLite
      this.db = await sqlite3.openDatabase(this.dbName)

      // 创建数据表
      await this.createTables()

      this.isInitialized = true
      console.log('SQLite database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error)
      throw error
    }
  }

  /**
   * 创建数据表
   */
  private async createTables(): Promise<void> {
    const tables = [
      `CREATE TABLE IF NOT EXISTS configs (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        group_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
      )`,

      `CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_rules_group_id ON rules(group_id)`,
      `CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(name)`
    ]

    for (const sql of tables) {
      await sqlite3.exec(this.db, sql)
    }
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init()
    }
  }

  /**
   * 通用存储方法
   */
  async set(key: string, data: any): Promise<void> {
    await this.ensureInitialized()

    const sql = `
      INSERT OR REPLACE INTO configs (key, data, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `

    const params = [key, JSON.stringify(data)]
    await sqlite3.exec(this.db, sql, params)
  }

  /**
   * 通用获取方法
   */
  async get(key: string): Promise<any> {
    await this.ensureInitialized()

    const sql = 'SELECT data FROM configs WHERE key = ?'
    const stmt = await sqlite3.prepare(this.db, sql, [key])
    const result = await sqlite3.step(stmt)

    if (result) {
      const data = sqlite3.column(result, 0)
      await sqlite3.finalize(stmt)
      return JSON.parse(data)
    }

    await sqlite3.finalize(stmt)
    return null
  }

  /**
   * 删除数据
   */
  async delete(key: string): Promise<void> {
    await this.ensureInitialized()

    const sql = 'DELETE FROM configs WHERE key = ?'
    await sqlite3.exec(this.db, sql, [key])
  }

  /**
   * 检查键是否存在
   */
  async has(key: string): Promise<boolean> {
    await this.ensureInitialized()

    const sql = 'SELECT COUNT(*) as count FROM configs WHERE key = ?'
    const stmt = await sqlite3.prepare(this.db, sql, [key])
    const result = await sqlite3.step(stmt)
    const count = sqlite3.column(result, 0)
    await sqlite3.finalize(stmt)

    return count > 0
  }

  /**
   * 获取所有键
   */
  async keys(): Promise<string[]> {
    await this.ensureInitialized()

    const sql = 'SELECT key FROM configs ORDER BY key'
    const stmt = await sqlite3.prepare(this.db, sql)
    const keys: string[] = []

    let result
    while ((result = await sqlite3.step(stmt))) {
      const key = sqlite3.column(result, 0)
      keys.push(key)
    }

    await sqlite3.finalize(stmt)
    return keys
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    await this.ensureInitialized()

    const tables = ['configs', 'groups', 'users', 'rules', 'templates']
    for (const table of tables) {
      await sqlite3.exec(this.db, `DELETE FROM ${table}`)
    }
  }

  /**
   * 获取数据库统计信息
   */
  async getStats(): Promise<any> {
    await this.ensureInitialized()

    const stats: any = {}
    const tables = ['configs', 'groups', 'users', 'rules', 'templates']

    for (const table of tables) {
      const sql = `SELECT COUNT(*) as count FROM ${table}`
      const stmt = await sqlite3.prepare(this.db, sql)
      const result = await sqlite3.step(stmt)
      stats[table] = sqlite3.column(result, 0)
      await sqlite3.finalize(stmt)
    }

    return stats
  }

  /**
   * 执行自定义 SQL 查询
   */
  async query(sql: string, params: any[] = []): Promise<any[]> {
    await this.ensureInitialized()

    const stmt = await sqlite3.prepare(this.db, sql, params)
    const results: any[] = []

    let result
    while ((result = await sqlite3.step(stmt))) {
      const row: any = {}
      for (let i = 0; i < sqlite3.columnCount(stmt); i++) {
        const name = sqlite3.columnName(stmt, i)
        row[name] = sqlite3.column(result, i)
      }
      results.push(row)
    }

    await sqlite3.finalize(stmt)
    return results
  }

  /**
   * 导出数据
   */
  async export(): Promise<any> {
    await this.ensureInitialized()

    const exportData: any = {}
    const tables = ['configs', 'groups', 'users', 'rules', 'templates']

    for (const table of tables) {
      const sql = `SELECT * FROM ${table}`
      exportData[table] = await this.query(sql)
    }

    return {
      data: exportData,
      metadata: {
        exportTime: new Date().toISOString(),
        version: '1.0.0',
        userAgent: navigator.userAgent
      }
    }
  }

  /**
   * 导入数据
   */
  async import(data: any, options: { clear?: boolean } = {}): Promise<void> {
    await this.ensureInitialized()

    if (options.clear) {
      await this.clear()
    }

    const tables = ['configs', 'groups', 'users', 'rules', 'templates']

    for (const table of tables) {
      if (data[table] && Array.isArray(data[table])) {
        for (const item of data[table]) {
          const columns = Object.keys(item).join(', ')
          const placeholders = Object.keys(item).map(() => '?').join(', ')
          const values = Object.values(item)

          const sql = `INSERT OR REPLACE INTO ${table} (${columns}) VALUES (${placeholders})`
          await sqlite3.exec(this.db, sql, values)
        }
      }
    }
  }

  /**
   * 批量操作
   */
  async batch(operations: Array<{
    type: 'set' | 'delete'
    key?: string
    data?: any
  }>): Promise<void> {
    await this.ensureInitialized()

    try {
      await sqlite3.exec(this.db, 'BEGIN TRANSACTION')

      for (const op of operations) {
        if (op.type === 'set' && op.key) {
          await this.set(op.key, op.data)
        } else if (op.type === 'delete' && op.key) {
          await this.delete(op.key)
        }
      }

      await sqlite3.exec(this.db, 'COMMIT')
    } catch (error) {
      await sqlite3.exec(this.db, 'ROLLBACK')
      throw error
    }
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.db) {
      await sqlite3.close(this.db)
      this.db = null
      this.isInitialized = false
    }
  }

  /**
   * 检查数据库连接状态
   */
  isConnected(): boolean {
    return this.isInitialized && this.db !== null
  }
}

// 创建单例实例
export const sqliteManager = new SQLiteManager()