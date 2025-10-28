// 规则配置测试脚本
export const testRulesData = [
  {
    group_id: 'test-group-1',
    name: '数据库相关告警',
    keywords: ['数据库', 'MySQL', 'PostgreSQL', '连接超时', '死锁'],
    user_ids: ['test-user-1', 'test-user-2'],
    template_color: 'red',
    priority: 10,
    active: true
  },
  {
    group_id: 'test-group-1',
    name: 'API响应时间告警',
    keywords: ['API', '响应时间', 'timeout', '5xx', '4xx'],
    user_ids: ['test-user-1'],
    template_color: 'yellow',
    priority: 5,
    active: true
  },
  {
    group_id: 'test-group-2',
    name: 'CI/CD部署通知',
    keywords: ['部署', '构建', 'CI/CD', '发布', '成功'],
    user_ids: ['test-user-3'],
    template_color: 'green',
    priority: 3,
    active: true
  }
]

// 测试规则匹配
export function testRuleMatching() {
  const testMessages = [
    'MySQL数据库连接超时，请检查网络配置',
    'API响应时间超过5秒，需要优化',
    'CI/CD部署成功，版本v1.2.3已发布',
    '系统正常运行，无需处理'
  ]

  console.log('=== 规则匹配测试 ===')

  testMessages.forEach((message, index) => {
    console.log(`\n测试消息 ${index + 1}: ${message}`)

    testRulesData.forEach(rule => {
      const isMatch = rule.keywords.some(keyword =>
        message.toLowerCase().includes(keyword.toLowerCase())
      )

      if (isMatch) {
        console.log(`  ✓ 匹配规则: ${rule.name} (优先级: ${rule.priority})`)
      }
    })
  })
}

// 如果直接运行此脚本
if (typeof window === 'undefined') {
  testRuleMatching()
}