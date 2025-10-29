/**
 * 存储信息工具
 * 用于查看和管理 SQLite 数据库文件的存储位置
 */

export class StorageInfo {

  /**
   * 获取当前存储信息
   */
  static async getStorageInfo(): Promise<{
    backend: 'sqlite' | 'localStorage'
    sqliteInfo?: {
      dbName: string
      estimatedSize?: string
      fileSystemType: string
      supported: boolean
    }
    localStorageInfo?: {
      available: boolean
      estimatedSize?: string
      quota?: string
    }
  }> {
    const info: any = {
      backend: 'localStorage'
    }

    // 检查 OPFS 支持
    const opfsSupported = 'storage' in navigator && 'getDirectory' in navigator.storage
    const waSqliteSupported = typeof SharedArrayBuffer !== 'undefined'

    if (opfsSupported && waSqliteSupported) {
      info.backend = 'sqlite'
      info.sqliteInfo = {
        dbName: 'webhook-config.db',
        fileSystemType: 'OPFS (Origin Private File System)',
        supported: true
      }

      try {
        // 尝试获取存储配额信息
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate()
          info.sqliteInfo.estimatedSize = this.formatBytes(estimate.usage || 0)
          info.sqliteInfo.quota = this.formatBytes(estimate.quota || 0)
        }
      } catch (error) {
        console.warn('Failed to get storage estimate:', error)
      }
    } else {
      info.localStorageInfo = {
        available: true
      }

      try {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate()
          info.localStorageInfo.estimatedSize = this.formatBytes(estimate.usage || 0)
          info.localStorageInfo.quota = this.formatBytes(estimate.quota || 0)
        }
      } catch (error) {
        console.warn('Failed to get storage estimate:', error)
      }
    }

    return info
  }

  /**
   * 获取数据库文件的浏览器路径信息
   */
  static getBrowserStoragePaths(): {
    chrome: {
      macos: string
      windows: string
      linux: string
    }
    firefox: {
      macos: string
      windows: string
      linux: string
    }
    safari: {
      macos: string
    }
  } {
    return {
      chrome: {
        macos: '~/Library/Application Support/Google/Chrome/Default/File System/[origin_id]/000/t/00/',
        windows: '%LocalAppData%\\Google\\Chrome\\User Data\\Default\\File System\\[origin_id]\\000\\t\\00\\',
        linux: '~/.config/google-chrome/Default/File System/[origin_id]/000/t/00/'
      },
      firefox: {
        macos: '~/Library/Application Support/Firefox/Profiles/[profile]/storage/default/http+++localhost:3000/idb/',
        windows: '%AppData%\\Mozilla\\Firefox\\Profiles\\[profile]\\storage\\default\\http+++localhost:3000\\idb\\',
        linux: '~/.mozilla/firefox/[profile]/storage/default/http+++localhost:3000/idb/'
      },
      safari: {
        macos: '~/Library/Safari/Databases/http_localhost_3000_0/'
      }
    }
  }

  /**
   * 格式化字节大小
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 创建数据库文件的下载链接
   */
  static async exportDatabaseFile(): Promise<Blob | null> {
    try {
      // 这里需要 wa-sqlite 的特定 API 来导出数据库文件
      // 目前提供一个基本的实现思路

      // 1. 首先获取所有数据
      const { sqliteManager } = await import('./sqlite-manager')
      await sqliteManager.init()

      // 2. 导出数据为 JSON 格式
      const exportData = await sqliteManager.export()

      // 3. 创建 Blob
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })

      return blob
    } catch (error) {
      console.error('Failed to export database:', error)
      return null
    }
  }

  /**
   * 检查存储权限和兼容性
   */
  static async checkStorageCompatibility(): Promise<{
    opfs: boolean
    waSqlite: boolean
    localStorage: boolean
    indexedDB: boolean
    recommended: 'sqlite' | 'localStorage' | 'indexeddb'
  }> {
    const compatibility = {
      opfs: false,
      waSqlite: false,
      localStorage: false,
      indexedDB: false,
      recommended: 'localStorage' as 'sqlite' | 'localStorage' | 'indexeddb'
    }

    // 检查 OPFS 支持
    try {
      if ('storage' in navigator && 'getDirectory' in navigator.storage) {
        await navigator.storage.getDirectory()
        compatibility.opfs = true
      }
    } catch (error) {
      console.warn('OPFS not supported:', error)
    }

    // 检查 wa-sqlite 支持
    try {
      compatibility.waSqlite = typeof SharedArrayBuffer !== 'undefined'
    } catch (error) {
      console.warn('wa-sqlite not supported:', error)
    }

    // 检查 localStorage 支持
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
      compatibility.localStorage = true
    } catch (error) {
      console.warn('localStorage not supported:', error)
    }

    // 检查 IndexedDB 支持
    try {
      if ('indexedDB' in window) {
        compatibility.indexedDB = true
      }
    } catch (error) {
      console.warn('IndexedDB not supported:', error)
    }

    // 推荐最佳方案
    if (compatibility.opfs && compatibility.waSqlite) {
      compatibility.recommended = 'sqlite'
    } else if (compatibility.indexedDB) {
      compatibility.recommended = 'indexeddb'
    }

    return compatibility
  }
}