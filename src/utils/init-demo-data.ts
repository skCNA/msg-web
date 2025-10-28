import { configManager } from './config-manager'
import type { Group, User, Rule } from '@/types'

// 初始化演示数据
export function initDemoData() {
  // 检查是否已经有数据
  const existingData = configManager.getAllConfig()
  if (existingData.groups.length > 0 || existingData.users.length > 0) {
    return // 已有数据，不覆盖
  }

  // 创建演示用户
  const demoUsers: Omit<User, 'id' | 'created_at'>[] = [
    {
      name: '张三',
      email: 'zhangsan@company.com',
      phone: '13800138001',
      department: '技术部',
      role: '系统管理员',
      feishu_user_id: 'feishu_zhangsan',
      wechat_user_id: 'wechat_zhangsan',
      active: true
    },
    {
      name: '李四',
      email: 'lisi@company.com',
      phone: '13800138002',
      department: '技术部',
      role: '运维工程师',
      feishu_user_id: 'feishu_lisi',
      wechat_user_id: 'wechat_lisi',
      active: true
    },
    {
      name: '王五',
      email: 'wangwu@company.com',
      phone: '13800138003',
      department: '技术部',
      role: '开发工程师',
      feishu_user_id: 'feishu_wangwu',
      wechat_user_id: '',
      active: true
    },
    {
      name: '赵六',
      email: 'zhaoliu@company.com',
      phone: '13800138004',
      department: '测试部',
      role: '测试工程师',
      feishu_user_id: 'feishu_zhaoliu',
      wechat_user_id: 'wechat_zhaoliu',
      active: true
    },
    {
      name: '陈七',
      email: 'chenqi@company.com',
      phone: '13800138005',
      department: '产品部',
      role: '产品经理',
      feishu_user_id: '',
      wechat_user_id: 'wechat_chenqi',
      active: true
    }
  ]

  // 创建演示群组
  const demoGroups: Omit<Group, 'id' | 'created_at' | 'updated_at'>[] = [
    {
      name: '运维团队群',
      identifier: 'devops',
      description: '负责系统运维相关的所有告警通知',
      active: true,
      webhooks: [
        {
          id: 'feishu_devops_1',
          platform: 'feishu',
          name: '运维飞书群',
          url: 'https://open.feishu.cn/open-apis/bot/v2/hook/webhook_url_here',
          enabled: true,
          test_status: 'success',
          last_test_time: new Date().toISOString()
        },
        {
          id: 'wechat_devops_1',
          platform: 'wechat',
          name: '运维企业微信群',
          url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=webhook_key_here',
          enabled: false,
          test_status: 'failed'
        }
      ]
    },
    {
      name: '开发团队群',
      identifier: 'dev-team',
      description: '负责开发相关的CI/CD通知和代码质量告警',
      active: true,
      webhooks: [
        {
          id: 'feishu_dev_1',
          platform: 'feishu',
          name: '开发飞书群',
          url: 'https://open.feishu.cn/open-apis/bot/v2/hook/webhook_url_here',
          enabled: true,
          test_status: 'success',
          last_test_time: new Date().toISOString()
        }
      ]
    },
    {
      name: '测试团队群',
      identifier: 'test-team',
      description: '负责测试相关的通知和质量报告',
      active: true,
      webhooks: [
        {
          id: 'feishu_test_1',
          platform: 'feishu',
          name: '测试飞书群',
          url: 'https://open.feishu.cn/open-apis/bot/v2/hook/webhook_url_here',
          enabled: true,
          test_status: 'success',
          last_test_time: new Date().toISOString()
        }
      ]
    }
  ]

  // 保存群组和用户
  const savedGroups = demoGroups.map(group => configManager.addGroup(group))
  const savedUsers = demoUsers.map(user => configManager.addUser(user))

  // 创建演示规则
  const demoRules: Omit<Rule, 'id' | 'created_at'>[] = [
    {
      group_id: savedGroups[0].id, // devops
      name: '数据库相关告警',
      keywords: ['数据库', 'MySQL', 'Redis', '连接池', '超时'],
      user_ids: [savedUsers[0].id, savedUsers[1].id], // 张三, 李四
      template_color: 'red',
      priority: 10,
      active: true
    },
    {
      group_id: savedGroups[0].id, // devops
      name: 'API响应时间告警',
      keywords: ['API', '响应时间', '超时', '5秒', '慢'],
      user_ids: [savedUsers[1].id], // 李四
      template_color: 'yellow',
      priority: 5,
      active: true
    },
    {
      group_id: savedGroups[0].id, // devops
      name: '文本安全校验告警',
      keywords: ['文本安全', '校验', 'muse', '内容审核'],
      user_ids: [savedUsers[0].id, savedUsers[3].id], // 张三, 赵六
      template_color: 'red',
      priority: 10,
      active: true
    },
    {
      group_id: savedGroups[1].id, // dev-team
      name: 'CI/CD部署通知',
      keywords: ['部署', 'CI/CD', '编译', '构建', '发布'],
      user_ids: [savedUsers[2].id], // 王五
      template_color: 'green',
      priority: 3,
      active: true
    },
    {
      group_id: savedGroups[1].id, // dev-team
      name: '代码质量检查',
      keywords: ['代码质量', 'Sonar', '覆盖率', '代码审查'],
      user_ids: [savedUsers[2].id, savedUsers[4].id], // 王五, 陈七
      template_color: 'blue',
      priority: 5,
      active: true
    },
    {
      group_id: savedGroups[2].id, // test-team
      name: '测试执行通知',
      keywords: ['测试', '自动化', '用例', '失败', '通过率'],
      user_ids: [savedUsers[3].id], // 赵六
      template_color: 'yellow',
      priority: 5,
      active: true
    }
  ]

  // 保存规则
  demoRules.forEach(rule => configManager.addRule(rule))

  console.log('演示数据初始化完成！')
  console.log(`创建了 ${savedGroups.length} 个群组`)
  console.log(`创建了 ${savedUsers.length} 个用户`)
  console.log(`创建了 ${demoRules.length} 个规则`)
}

// 清除演示数据
export function clearDemoData() {
  configManager.clearAllConfig()
  console.log('演示数据已清除')
}