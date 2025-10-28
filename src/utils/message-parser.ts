/**
 * 消息解析引擎
 * 用于解析不同平台的告警消息格式，提取关键字段并进行结构化处理
 */

export interface ParsedMessage {
  // 基础信息
  id: string
  title: string
  content: string
  level: 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'unknown'
  source: string
  service: string
  timestamp: Date

  // 扩展信息
  labels: Record<string, string>
  annotations: Record<string, string>
  tags: string[]

  // 原始数据
  raw: any

  // 解析元信息
  parser: string
  confidence: number
}

export interface ParseResult {
  success: boolean
  message?: ParsedMessage
  error?: string
}

export interface Parser {
  name: string
  description: string
  patterns: RegExp[]
  parse: (data: any) => ParseResult
}

/**
 * 腾讯云CLS告警解析器
 */
class TencentCLSParser implements Parser {
  name = 'tencent-cls'
  description = '腾讯云日志服务告警消息解析器'
  patterns = [
    /腾讯云/i,
    /CLS/i,
    /日志服务/i,
    /AlarmId/i
  ]

  parse(data: any): ParseResult {
    try {
      let messageData = data

      // 如果是字符串，尝试解析JSON
      if (typeof data === 'string') {
        try {
          messageData = JSON.parse(data)
        } catch {
          // 如果不是JSON，尝试从文本中提取信息
          return this.parseText(data)
        }
      }

      // 腾讯云CLS告警标准格式
      const alert: any = messageData.AlarmNoticeInfo || messageData
      const alertInfo: any = alert.AlarmInfo || {}

      const parsedMessage: ParsedMessage = {
        id: alert.AlarmId || alert.AlarmNoticeId || `cls_${Date.now()}`,
        title: this.extractTitle(alert),
        content: this.extractContent(alert),
        level: this.extractLevel(alertInfo),
        source: '腾讯云CLS',
        service: this.extractService(alert),
        timestamp: new Date(alertInfo.CreateTime || alert.CreateTime || Date.now()),
        labels: this.extractLabels(alert),
        annotations: this.extractAnnotations(alert),
        tags: this.extractTags(alert),
        raw: messageData,
        parser: this.name,
        confidence: 0.9
      }

      return { success: true, message: parsedMessage }
    } catch (error) {
      return {
        success: false,
        error: `腾讯云CLS解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  private parseText(text: string): ParseResult {
    const title = text.match(/标题[：:]\s*([^\n]+)/)?.[1] || 'CLS告警'
    const level = text.match(/级别[：:]\s*(P[0-4])/)?.[1] as any || 'unknown'
    const service = text.match(/服务[：:]\s*([^\n]+)/)?.[1] || '未知服务'

    const parsedMessage: ParsedMessage = {
      id: `cls_text_${Date.now()}`,
      title: title,
      content: text,
      level: level,
      source: '腾讯云CLS',
      service: service,
      timestamp: new Date(),
      labels: {},
      annotations: {},
      tags: [],
      raw: text,
      parser: this.name,
      confidence: 0.6
    }

    return { success: true, message: parsedMessage }
  }

  private extractTitle(alert: any): string {
    return (
      alert.AlarmName ||
      alert.TopicName ||
      alert.Title ||
      '腾讯云CLS告警'
    )
  }

  private extractContent(alert: any): string {
    const alarmInfo = alert.AlarmInfo || {}
    return (
      alarmInfo.Description ||
      alarmInfo.Content ||
      JSON.stringify(alert, null, 2)
    )
  }

  private extractLevel(alarmInfo: any): 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'unknown' {
    const level = alarmInfo.Level || alarmInfo.Severity || 'unknown'

    // 腾讯云级别映射
    const levelMap: Record<string, 'P0' | 'P1' | 'P2' | 'P3' | 'P4'> = {
      'Critical': 'P0',
      'Warning': 'P1',
      'Info': 'P3',
      '0': 'P0',
      '1': 'P1',
      '2': 'P2',
      '3': 'P3',
      '4': 'P4'
    }

    return levelMap[level] || 'unknown'
  }

  private extractService(alert: any): string {
    const alarmInfo = alert.AlarmInfo || {}
    return (
      alarmInfo.Service ||
      alarmInfo.LogSetId ||
      alarmInfo.TopicId ||
      alert.LogSet ||
      '未知服务'
    )
  }

  private extractLabels(alert: any): Record<string, string> {
    const labels: Record<string, string> = {}

    if (alert.AlarmInfo) {
      Object.keys(alert.AlarmInfo).forEach(key => {
        if (typeof alert.AlarmInfo[key] === 'string') {
          labels[key] = alert.AlarmInfo[key]
        }
      })
    }

    return labels
  }

  private extractAnnotations(alert: any): Record<string, string> {
    return {
      source: 'tencent-cls',
      type: 'alarm',
      region: alert.Region || 'unknown'
    }
  }

  private extractTags(alert: any): string[] {
    const tags: string[] = ['tencent', 'cls', 'alarm']

    if (alert.AlarmInfo && alert.AlarmInfo.Tags) {
      tags.push(...alert.AlarmInfo.Tags)
    }

    return tags
  }
}

/**
 * Prometheus告警解析器
 */
class PrometheusParser implements Parser {
  name = 'prometheus'
  description = 'Prometheus告警消息解析器'
  patterns = [
    /Prometheus/i,
    /Alertmanager/i,
    /receiver/i,
    /status/i
  ]

  parse(data: any): ParseResult {
    try {
      let messageData = data

      if (typeof data === 'string') {
        try {
          messageData = JSON.parse(data)
        } catch {
          return this.parseText(data)
        }
      }

      const alerts = messageData.alerts || [messageData]
      const alert = Array.isArray(alerts) ? alerts[0] : alerts

      const parsedMessage: ParsedMessage = {
        id: alert.fingerprint || alert.labels?.alertname || `prom_${Date.now()}`,
        title: this.extractTitle(alert),
        content: this.extractContent(alert),
        level: this.extractLevel(alert),
        source: 'Prometheus',
        service: this.extractService(alert),
        timestamp: new Date(alert.startsAt || Date.now()),
        labels: alert.labels || {},
        annotations: alert.annotations || {},
        tags: this.extractTags(alert),
        raw: messageData,
        parser: this.name,
        confidence: 0.9
      }

      return { success: true, message: parsedMessage }
    } catch (error) {
      return {
        success: false,
        error: `Prometheus解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  private parseText(text: string): ParseResult {
    const title = text.match(/Alert[：:]\s*([^\n]+)/)?.[1] || 'Prometheus告警'
    const level = text.match(/severity[=:]\s*(critical|warning|info)/i)?.[1]?.toLowerCase() as any || 'unknown'
    const service = text.match(/job[=:]\s*([^\s]+)/)?.[1] || '未知服务'

    const parsedMessage: ParsedMessage = {
      id: `prom_text_${Date.now()}`,
      title: title,
      content: text,
      level: this.mapPrometheusLevel(level),
      source: 'Prometheus',
      service: service,
      timestamp: new Date(),
      labels: {},
      annotations: {},
      tags: [],
      raw: text,
      parser: this.name,
      confidence: 0.6
    }

    return { success: true, message: parsedMessage }
  }

  private extractTitle(alert: any): string {
    return (
      alert.annotations?.summary ||
      alert.labels?.alertname ||
      alert.annotations?.description ||
      'Prometheus告警'
    )
  }

  private extractContent(alert: any): string {
    return (
      alert.annotations?.description ||
      alert.annotations?.message ||
      JSON.stringify(alert.annotations || alert.labels || {}, null, 2)
    )
  }

  private extractLevel(alert: any): 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'unknown' {
    const severity = alert.labels?.severity || 'unknown'
    return this.mapPrometheusLevel(severity)
  }

  private mapPrometheusLevel(severity: string): 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'unknown' {
    const severityMap: Record<string, 'P0' | 'P1' | 'P2' | 'P3' | 'P4'> = {
      'critical': 'P0',
      'warning': 'P1',
      'info': 'P3',
      'error': 'P0'
    }

    return severityMap[severity.toLowerCase()] || 'unknown'
  }

  private extractService(alert: any): string {
    return (
      alert.labels?.job ||
      alert.labels?.service ||
      alert.labels?.app ||
      '未知服务'
    )
  }

  private extractTags(alert: any): string[] {
    const tags: string[] = ['prometheus', 'alert']

    if (alert.labels) {
      Object.keys(alert.labels).forEach(key => {
        tags.push(`${key}:${alert.labels[key]}`)
      })
    }

    return tags
  }
}

/**
 * Coding CI/CD解析器
 */
class CodingCIParser implements Parser {
  name = 'coding-ci'
  description = 'Coding CI/CD消息解析器'
  patterns = [
    /Coding/i,
    /DevOps/i,
    /构建/i,
    /部署/i,
    /CI\/CD/i
  ]

  parse(data: any): ParseResult {
    try {
      let messageData = data

      if (typeof data === 'string') {
        try {
          messageData = JSON.parse(data)
        } catch {
          return this.parseText(data)
        }
      }

      const event = messageData.event || messageData
      const build = messageData.build || event

      const parsedMessage: ParsedMessage = {
        id: build.buildId || event.eventId || `coding_${Date.now()}`,
        title: this.extractTitle(event, build),
        content: this.extractContent(event, build),
        level: this.extractLevel(build),
        source: 'Coding CI/CD',
        service: this.extractService(event, build),
        timestamp: new Date(build.endTime || build.startTime || Date.now()),
        labels: this.extractLabels(event, build),
        annotations: this.extractAnnotations(event, build),
        tags: this.extractTags(event, build),
        raw: messageData,
        parser: this.name,
        confidence: 0.9
      }

      return { success: true, message: parsedMessage }
    } catch (error) {
      return {
        success: false,
        error: `Coding CI/CD解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  private parseText(text: string): ParseResult {
    const title = text.match(/项目[：:]\s*([^\n]+)/)?.[1] || 'CI/CD通知'
    const status = text.match(/状态[：:]\s*(成功|失败|进行中)/)?.[1] || 'unknown'
    const service = text.match(/项目[：:]\s*([^\n]+)/)?.[1] || '未知项目'

    const parsedMessage: ParsedMessage = {
      id: `coding_text_${Date.now()}`,
      title: title,
      content: text,
      level: status === '失败' ? 'P0' : status === '成功' ? 'P3' : 'P2',
      source: 'Coding CI/CD',
      service: service,
      timestamp: new Date(),
      labels: {},
      annotations: {},
      tags: [],
      raw: text,
      parser: this.name,
      confidence: 0.6
    }

    return { success: true, message: parsedMessage }
  }

  private extractTitle(event: any, build: any): string {
    const action = event.eventType || build.action || '构建'
    const project = event.projectName || build.projectName || '未知项目'
    return `${project} - ${action}`
  }

  private extractContent(event: any, build: any): string {
    return (
      build.statusMessage ||
      build.errorMessage ||
      event.eventMessage ||
      `项目: ${event.projectName || '未知项目'}\n操作: ${event.eventType || '未知操作'}\n状态: ${build.status || '未知状态'}`
    )
  }

  private extractLevel(build: any): 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'unknown' {
    const status = build.status || build.result || 'unknown'

    const statusMap: Record<string, 'P0' | 'P1' | 'P2' | 'P3' | 'P4'> = {
      'FAILED': 'P0',
      'FAILURE': 'P0',
      'ERROR': 'P0',
      'SUCCESS': 'P3',
      'SUCCEEDED': 'P3',
      'WARNING': 'P1',
      'RUNNING': 'P2',
      'PENDING': 'P4'
    }

    return statusMap[status.toUpperCase()] || 'P2'
  }

  private extractService(event: any, build: any): string {
    return (
      event.projectName ||
      build.projectName ||
      event.depotName ||
      build.depotName ||
      '未知项目'
    )
  }

  private extractLabels(event: any, build: any): Record<string, string> {
    return {
      project: event.projectName || build.projectName || 'unknown',
      branch: build.branch || event.branch || 'unknown',
      commit: build.commitId || event.commitId || 'unknown',
      build: build.buildNumber || build.buildId || 'unknown'
    }
  }

  private extractAnnotations(event: any, build: any): Record<string, string> {
    return {
      source: 'coding-ci',
      type: event.eventType || 'build',
      trigger: build.triggerBy || event.triggerBy || 'manual',
      duration: build.duration ? `${build.duration}s` : 'unknown'
    }
  }

  private extractTags(event: any, build: any): string[] {
    const tags: string[] = ['coding', 'ci-cd']

    if (build.status) {
      tags.push(build.status.toLowerCase())
    }

    if (event.eventType) {
      tags.push(event.eventType.toLowerCase())
    }

    return tags
  }
}

/**
 * 通用文本解析器
 */
class GenericTextParser implements Parser {
  name = 'generic-text'
  description = '通用文本消息解析器'
  patterns = [/.*/] // 匹配所有内容

  parse(data: any): ParseResult {
    try {
      const text = typeof data === 'string' ? data : JSON.stringify(data)

      const parsedMessage: ParsedMessage = {
        id: `generic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: this.extractTitle(text),
        content: text,
        level: this.extractLevel(text),
        source: '通用消息',
        service: this.extractService(text),
        timestamp: new Date(),
        labels: {},
        annotations: {},
        tags: this.extractTags(text),
        raw: data,
        parser: this.name,
        confidence: 0.3
      }

      return { success: true, message: parsedMessage }
    } catch (error) {
      return {
        success: false,
        error: `通用文本解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  private extractTitle(text: string): string {
    // 尝试从文本第一行提取标题
    const firstLine = text.split('\n')[0].trim()
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine || '消息通知'
  }

  private extractLevel(text: string): 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'unknown' {
    const lowerText = text.toLowerCase()

    if (lowerText.includes('紧急') || lowerText.includes('严重') || lowerText.includes('critical') || lowerText.includes('error')) {
      return 'P0'
    }
    if (lowerText.includes('警告') || lowerText.includes('warning') || lowerText.includes('warn')) {
      return 'P1'
    }
    if (lowerText.includes('通知') || lowerText.includes('info') || lowerText.includes('成功')) {
      return 'P3'
    }

    return 'P2'
  }

  private extractService(text: string): string {
    // 尝试提取服务名
    const serviceMatch = text.match(/服务[：:]\s*([^\n\s]+)/) ||
                         text.match(/service[：:]\s*([^\n\s]+)/i) ||
                         text.match(/项目[：:]\s*([^\n\s]+)/)

    return serviceMatch?.[1] || '未知服务'
  }

  private extractTags(text: string): string[] {
    const tags: string[] = ['generic']
    const lowerText = text.toLowerCase()

    // 根据关键词添加标签
    const keywords = {
      'error': ['error', '错误'],
      'warning': ['warning', '警告'],
      'info': ['info', '信息'],
      'success': ['success', '成功'],
      'failed': ['failed', '失败'],
      'alarm': ['alarm', '告警'],
      'test': ['test', '测试'],
      'deploy': ['deploy', '部署']
    }

    Object.entries(keywords).forEach(([tag, words]) => {
      if (words.some(word => lowerText.includes(word))) {
        tags.push(tag)
      }
    })

    return tags
  }
}

/**
 * 消息解析引擎主类
 */
export class MessageParserEngine {
  private parsers: Parser[] = [
    new TencentCLSParser(),
    new PrometheusParser(),
    new CodingCIParser(),
    new GenericTextParser() // 放在最后作为兜底
  ]

  /**
   * 解析消息
   */
  parseMessage(data: any): ParseResult {
    const input = typeof data === 'string' ? data : JSON.stringify(data)

    // 尝试使用每个解析器
    for (const parser of this.parsers) {
      // 检查是否匹配解析器的模式
      const matches = parser.patterns.some(pattern => pattern.test(input))

      if (matches || parser.name === 'generic-text') {
        const result = parser.parse(data)
        if (result.success && result.message) {
          return result
        }
      }
    }

    // 如果所有解析器都失败，返回通用解析结果
    return {
      success: false,
      error: '无法解析消息格式'
    }
  }

  /**
   * 获取所有可用解析器
   */
  getParsers(): Parser[] {
    return [...this.parsers]
  }

  /**
   * 添加自定义解析器
   */
  addParser(parser: Parser): void {
    this.parsers.unshift(parser) // 添加到开头，优先使用
  }

  /**
   * 批量解析消息
   */
  parseMessages(messages: any[]): ParseResult[] {
    return messages.map(message => this.parseMessage(message))
  }

  /**
   * 验证消息格式
   */
  validateMessage(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      const result = this.parseMessage(data)
      if (!result.success) {
        errors.push(result.error || '解析失败')
      }
    } catch (error) {
      errors.push(`验证异常: ${error instanceof Error ? error.message : '未知错误'}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// 创建全局实例
export const messageParser = new MessageParserEngine()

// 导出类型和实用函数
export * from './message-parser'
export type { Parser }