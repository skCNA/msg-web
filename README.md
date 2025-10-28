# Webhook配置管理系统

一个用于统一管理多种Webhook通知的系统，支持飞书、企业微信等多种平台的消息聚合和智能分发。

## 功能特点

### 🎯 核心功能
- **统一Webhook接收**: 通过 `http://domain.com/webhook/{group}` 统一接收各种来源的webhook消息
- **多平台支持**: 支持飞书、企业微信、钉钉等多种通知平台
- **智能消息路由**: 根据消息内容和关键字自动匹配规则并分发到对应群组
- **用户提及系统**: 支持基于关键字自动@相关用户
- **模板管理**: 提供多种消息模板，支持自定义飞书卡片样式

### 🛠 管理功能
- **群组配置**: 管理不同的通知群组和对应的Webhook配置
- **用户管理**: 管理用户信息和各平台的用户ID映射
- **规则配置**: 配置关键字匹配规则和用户提及策略
- **模板配置**: 自定义消息模板和样式
- **导入导出**: 支持配置的批量导入导出和备份恢复

### 💡 智能特性
- **实时预览**: 模板配置时实时预览飞书卡片效果
- **连接测试**: 支持Webhook连接状态测试
- **配置验证**: 自动验证配置格式的正确性
- **批量操作**: 支持批量导入导出和配置管理

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **构建工具**: Vite
- **样式预处理**: Sass/SCSS
- **数据存储**: localStorage（前端存储）

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
src/
├── components/          # 公共组件
│   ├── GroupDialog.vue # 群组配置对话框
│   ├── UserDialog.vue  # 用户配置对话框
│   ├── ImportExportDialog.vue # 导入导出对话框
│   └── WebhookDialog.vue # Webhook配置对话框
├── layout/              # 布局组件
│   └── index.vue       # 主布局
├── router/              # 路由配置
│   └── index.ts
├── stores/              # 状态管理
│   ├── groups.ts       # 群组状态
│   ├── users.ts        # 用户状态
│   ├── rules.ts        # 规则状态
│   └── templates.ts    # 模板状态
├── styles/              # 样式文件
│   ├── main.scss       # 主样式
│   └── variables.scss  # 样式变量
├── types/               # 类型定义
│   └── index.ts
├── utils/               # 工具函数
│   └── config-manager.ts # 配置管理器
├── views/               # 页面组件
│   ├── groups/          # 群组管理页面
│   ├── users/           # 用户管理页面
│   ├── rules/           # 规则配置页面
│   ├── templates/       # 模板配置页面
│   └── dashboard/       # 监控面板
├── App.vue             # 根组件
└── main.ts             # 入口文件
```

## 使用说明

### 1. 创建群组

1. 在"群组配置"页面点击"新建群组"
2. 填写群组基本信息：
   - 群组标识：用于生成Webhook URL（如：devops）
   - 群组名称：显示名称（如：运维团队群）
   - 描述信息：群组用途说明
3. 配置Webhook：
   - 选择通知平台（飞书、企业微信等）
   - 填写Webhook URL
   - 测试连接状态
4. 保存配置

### 2. 添加用户

1. 在"用户管理"页面点击"添加用户"
2. 填写用户基本信息：
   - 姓名、邮箱、手机号
   - 部门和角色
   - 各平台的用户ID
3. 保存用户信息

### 3. 配置规则

1. 在"规则配置"页面创建匹配规则
2. 设置关键字匹配条件
3. 选择要@的用户
4. 配置消息样式和优先级

### 4. 使用Webhook

创建群组后，会生成对应的Webhook URL：
```
https://your-domain.com/webhook/{group_identifier}
```

将这个URL配置到各种系统中（如Prometheus、腾讯云CLS、Coding CI/CD等），即可开始接收消息。

## 配置示例

### 腾讯云CLS告警配置
```
Webhook URL: https://your-domain.com/webhook/devops
请求方法: POST
Content-Type: application/json
```

### Prometheus告警配置
```yaml
alertmanager.yml:
  receivers:
  - name: 'webhook'
    webhook_configs:
    - url: 'https://your-domain.com/webhook/devops'
      send_resolved: true
```

## 数据存储

本系统使用浏览器的localStorage进行数据存储，支持：

- 自动保存配置变更
- 配置备份和恢复
- 导入导出配置文件
- 版本兼容性处理

## 开发计划

- [ ] 规则配置功能完善
- [ ] 模板配置功能完善
- [ ] 监控面板开发
- [ ] 消息处理引擎后端
- [ ] 实时消息推送
- [ ] 多语言支持
- [ ] 主题定制

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交变更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如果您在使用过程中遇到问题，欢迎：

- 提交 [Issue](https://github.com/your-repo/issues)
- 发送邮件至 support@example.com
- 查看 [文档](https://docs.example.com)

---

**注意**: 本项目目前处于开发阶段，部分功能尚未完成。