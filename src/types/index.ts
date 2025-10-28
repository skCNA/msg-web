// 群组配置
export interface Group {
  id: string
  name: string
  identifier: string // 用于webhook路径的唯一标识
  description: string
  webhooks: Webhook[]
  created_at: string
  updated_at: string
  active: boolean
}

// Webhook配置
export interface Webhook {
  id: string
  platform: 'feishu' | 'wechat' | 'dingtalk' | 'slack' | 'discord' | 'teams' | 'webhook'
  name: string
  url: string
  enabled: boolean
  config?: WebhookConfig
  last_test_time?: string
  test_status?: 'success' | 'failed' | 'pending'
}

// Webhook平台配置
export interface WebhookConfig {
  // 通用配置
  headers?: Record<string, string>
  timeout?: number
  retry_count?: number

  // Slack配置
  slack_channel?: string
  slack_username?: string
  slack_icon_emoji?: string

  // Discord配置
  discord_username?: string
  discord_avatar_url?: string

  // Teams配置
  teams_title?: string
  teams_summary?: string
  teams_theme_color?: string

  // 自定义Webhook配置
  custom_method?: 'POST' | 'PUT' | 'PATCH'
  custom_content_type?: string
  custom_template?: string
}

// 用户信息
export interface User {
  id: string
  name: string
  feishu_user_id?: string
  wechat_user_id?: string
  dingtalk_user_id?: string
  slack_user_id?: string
  discord_user_id?: string
  teams_user_id?: string
  email?: string
  phone?: string
  department?: string
  role: string
  active: boolean
  created_at: string
}

// 规则配置
export interface Rule {
  id: string
  group_id: string
  name: string
  keywords: string[]
  user_ids: string[]
  template_color: 'red' | 'yellow' | 'green' | 'blue'
  priority: number
  active: boolean
  created_at: string
}

// 模板配置
export interface Template {
  id: string
  name: string
  description: string
  conditions: TemplateCondition[]
  style: TemplateStyle
  content: TemplateContent
  created_at: string
  updated_at: string
}

// 模板匹配条件
export interface TemplateCondition {
  field: string
  operator: 'equals' | 'contains' | 'regex'
  value: string
}

// 模板样式配置
export interface TemplateStyle {
  title_template: string
  template_color: 'red' | 'yellow' | 'green' | 'blue'
  icon_token: string
  tag_text: string
  tag_color: string
}

// 模板内容配置
export interface TemplateContent {
  left_content: string[]
  right_content: string[]
  button_text: string
}

// 全局配置
export interface GlobalConfig {
  groups: Group[]
  users: User[]
  rules: Rule[]
  templates: Template[]
  settings: {
    version: string
    created_at: string
    updated_at: string
  }
}

// 消息类型枚举
export enum MessageType {
  TENCENT_CLS = 'tencent_cls',
  CODING_CICD = 'coding_cicd',
  TENCENT_OBS = 'tencent_obs',
  PROMETHEUS = 'prometheus',
  CUSTOM_ALERT = 'custom_alert'
}

// 标准化消息结构
export interface StandardMessage {
  type: MessageType
  title: string
  level: string
  service: string
  description: string
  timestamp: Date
  source: string
  metadata: Record<string, any>
  trace_id?: string
  query_url?: string
}