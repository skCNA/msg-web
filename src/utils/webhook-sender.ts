/**
 * Webhook 发送工具类
 * 支持多种平台的 webhook 测试和消息发送
 */

import type { Webhook, WebhookConfig } from '@/types'

export interface WebhookTestResult {
  success: boolean
  status?: number
  message: string
  response?: any
  error?: string
  duration?: number
}

export interface FeishuMessage {
  msg_type: 'interactive'
  card: {
    header: {
      title: {
        tag: 'plain_text'
        content: string
      }
      template: string
    }
    elements: Array<{
      tag: string
      text?: {
        tag: 'lark_md'
        content: string
      }
      actions?: Array<{
        tag: 'button'
        text: {
          tag: 'plain_text'
          content: string
        }
        type: 'primary'
        url: string
      }>
    }>
  }
}

export class WebhookSender {
  /**
   * 测试 Webhook 连接
   */
  static async testWebhook(webhook: Webhook): Promise<WebhookTestResult> {
    const startTime = Date.now()

    try {
      // 检查 URL 格式
      if (!webhook.url || !this.isValidUrl(webhook.url)) {
        return {
          success: false,
          message: '无效的 webhook URL',
          error: 'URL 格式不正确或为空'
        }
      }

      // 根据平台发送测试消息
      let result: WebhookTestResult
      switch (webhook.platform) {
        case 'feishu':
          result = await this.testFeishuWebhook(webhook)
          break
        case 'webhook':
          result = await this.testGenericWebhook(webhook)
          break
        default:
          result = {
            success: false,
            message: `不支持的平台: ${webhook.platform}`,
            error: '暂不支持该平台的 webhook 测试'
          }
      }

      result.duration = Date.now() - startTime
      return result

    } catch (error: any) {
      return {
        success: false,
        message: '测试失败',
        error: error.message || '未知错误',
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * 测试飞书 webhook
   */
  private static async testFeishuWebhook(webhook: Webhook): Promise<WebhookTestResult> {
    try {
      const testMessage = this.buildFeishuTestMessage()

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhook.config?.headers
        },
        body: JSON.stringify(testMessage)
      })

      const responseText = await response.text()

      if (response.ok) {
        // 飞书成功响应通常包含 {"code": 0, "msg": "success"}
        try {
          const responseData = JSON.parse(responseText)
          if (responseData.code === 0) {
            return {
              success: true,
              status: response.status,
              message: '测试消息发送成功',
              response: responseData
            }
          } else {
            return {
              success: false,
              status: response.status,
              message: `飞书返回错误: ${responseData.msg || '未知错误'}`,
              response: responseData
            }
          }
        } catch {
          // 如果无法解析响应，但 HTTP 状态码是成功的
          return {
            success: true,
            status: response.status,
            message: '测试消息发送成功',
            response: responseText
          }
        }
      } else {
        return {
          success: false,
          status: response.status,
          message: `HTTP 错误: ${response.status} ${response.statusText}`,
          error: responseText
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: '网络请求失败',
        error: error.message
      }
    }
  }

  /**
   * 测试通用 webhook
   */
  private static async testGenericWebhook(webhook: Webhook): Promise<WebhookTestResult> {
    try {
      const testMessage = {
        title: 'Webhook测试消息',
        content: '这是一个测试消息，用于验证 webhook 配置是否正确。',
        timestamp: new Date().toISOString(),
        test: true
      }

      const response = await fetch(webhook.url, {
        method: webhook.config?.custom_method || 'POST',
        headers: {
          'Content-Type': webhook.config?.custom_content_type || 'application/json',
          ...webhook.config?.headers
        },
        body: JSON.stringify(testMessage)
      })

      if (response.ok) {
        return {
          success: true,
          status: response.status,
          message: '测试消息发送成功',
          response: await response.text()
        }
      } else {
        return {
          success: false,
          status: response.status,
          message: `HTTP 错误: ${response.status} ${response.statusText}`,
          error: await response.text()
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: '网络请求失败',
        error: error.message
      }
    }
  }

  /**
   * 构建飞书测试消息
   */
  private static buildFeishuTestMessage(): FeishuMessage {
    return {
      msg_type: 'interactive',
      card: {
        header: {
          title: {
            tag: 'plain_text',
            content: '🎯 Webhook 测试消息'
          },
          template: 'blue'
        },
        elements: [
          {
            tag: 'div',
            text: {
              tag: 'lark_md',
              content: '**测试内容：**\n\n这是一个来自 Webhook 配置管理系统的测试消息，用于验证您的飞书 webhook 配置是否正确。\n\n如果您看到这条消息，说明配置成功！✅'
            }
          },
          {
            tag: 'div',
            text: {
              tag: 'lark_md',
              content: '**测试信息：**\n\n• 测试时间：' + new Date().toLocaleString('zh-CN') + '\n• 发送状态：测试中\n• 消息类型：交互式卡片'
            }
          },
          {
            tag: 'action',
            actions: [
              {
                tag: 'button',
                text: {
                  tag: 'plain_text',
                  content: '✅ 测试成功'
                },
                type: 'primary',
                url: 'https://www.feishu.cn'
              }
            ]
          }
        ]
      }
    }
  }

  /**
   * 验证 URL 格式
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取平台名称
   */
  static getPlatformName(platform: string): string {
    const platformNames: Record<string, string> = {
      feishu: '飞书',
      wechat: '企业微信',
      dingtalk: '钉钉',
      slack: 'Slack',
      discord: 'Discord',
      teams: 'Microsoft Teams',
      webhook: '自定义 Webhook'
    }
    return platformNames[platform] || platform
  }

  /**
   * 获取平台图标
   */
  static getPlatformIcon(platform: string): string {
    const platformIcons: Record<string, string> = {
      feishu: '🚀',
      wechat: '💼',
      dingtalk: '⚡',
      slack: '💬',
      discord: '🎮',
      teams: '🏢',
      webhook: '🔗'
    }
    return platformIcons[platform] || '📡'
  }

  /**
   * 生成测试报告
   */
  static generateTestReport(results: Array<{
    webhook: Webhook
    result: WebhookTestResult
  }>): string {
    const timestamp = new Date().toLocaleString('zh-CN')
    let report = `📊 Webhook 测试报告\n`
    report += `生成时间: ${timestamp}\n\n`

    const successCount = results.filter(r => r.result.success).length
    const failCount = results.length - successCount

    report += `📈 测试概览:\n`
    report += `• 总数: ${results.length}\n`
    report += `• 成功: ${successCount} ✅\n`
    report += `• 失败: ${failCount} ❌\n`
    report += `• 成功率: ${((successCount / results.length) * 100).toFixed(1)}%\n\n`

    report += `📋 详细结果:\n`
    results.forEach(({ webhook, result }, index) => {
      const icon = result.success ? '✅' : '❌'
      const platform = this.getPlatformName(webhook.platform)
      const duration = result.duration ? `${result.duration}ms` : 'N/A'

      report += `${index + 1}. ${icon} ${webhook.name} (${platform})\n`
      report += `   状态: ${result.message}\n`
      report += `   耗时: ${duration}\n`
      if (result.error) {
        report += `   错误: ${result.error}\n`
      }
      report += '\n'
    })

    return report
  }
}