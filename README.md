# Webhook配置管理系统

一个基于Vue 3 + TypeScript的企业级Webhook统一管理系统，支持飞书、企业微信、钉钉等多种平台的消息聚合、智能路由和模板化管理。

## ✨ 功能特点

### 🎯 核心功能
- **统一Webhook接收**: 通过 `http://domain.com/webhook/{group}` 统一接收各种来源的webhook消息
- **多平台支持**: 支持飞书、企业微信、钉钉、Slack、Discord、Teams等多种通知平台
- **智能消息路由**: 基于关键字和规则的智能消息分发系统
- **用户提及系统**: 支持基于关键字自动@相关用户
- **模板管理**: 提供丰富的消息模板，支持自定义飞书卡片样式

### 🛠 管理功能
- **群组配置**: 完整的群组生命周期管理，包含Webhook配置和状态监控
- **用户管理**: 多平台用户ID映射，支持用户信息批量管理
- **规则配置**: 灵活的关键字匹配规则和优先级设置
- **模板配置**: 可视化模板编辑器，支持实时预览
- **导入导出**: 完整的配置备份恢复功能

### 💡 智能特性
- **实时预览**: 模板配置时的实时飞书卡片预览
- **连接测试**: Webhook连接状态实时测试和诊断
- **配置验证**: 自动化的配置格式验证和错误提示
- **智能解析**: 支持腾讯云CLS、Prometheus、Coding CI/CD等多种消息格式
- **彩色主题**: 支持红(严重)、黄(警告)、绿(成功)、蓝(信息)四种消息主题

## 🛠 技术栈

### 核心框架
- **前端框架**: Vue 3.4 + Composition API
- **类型系统**: TypeScript 5.2 (严格模式)
- **UI组件库**: Element Plus 2.4 (按需自动导入)
- **状态管理**: Pinia 2.1 (Vue 3官方推荐)
- **路由管理**: Vue Router 4.2
- **构建工具**: Vite 5.0 (快速开发和构建)

### 开发工具
- **代码检查**: ESLint + Vue官方配置
- **样式预处理**: Sass/SCSS with全局变量
- **自动导入**: unplugin-auto-import (Vue、Vue Router、Pinia)
- **组件自动注册**: unplugin-vue-components (Element Plus)
- **数据可视化**: ECharts + Vue-ECharts (监控面板)

### 数据存储
- **主存储**: localStorage (纯前端解决方案)
- **可选存储**: wa-sqlite (本地SQLite数据库)
- **数据管理**: ConfigManager统一配置管理器
- **版本控制**: 配置数据版本管理和自动迁移

## 🚀 快速开始

### 环境要求
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 或 **yarn**: >= 1.22.0

### 安装依赖

```bash
# 使用npm
npm install

# 或使用yarn
yarn install
```

### 开发运行

```bash
# 启动开发服务器 (默认端口3000)
npm run dev

# 服务器会自动在浏览器中打开
# 访问: http://localhost:3000
```

### 构建生产版本

```bash
# 构建生产版本 (包含TypeScript类型检查)
npm run build
```

### 预览生产版本

```bash
# 预览构建后的生产版本
npm run preview
```

### 代码检查

```bash
# 运行ESLint检查并自动修复
npm run lint
```

### 开发提示
- 🔥 **热重载**: 代码修改后自动刷新页面
- 🎯 **自动导入**: Vue、Element Plus等组件无需手动导入
- 💾 **自动保存**: 配置修改自动保存到localStorage
- 🎨 **样式变量**: SCSS全局变量可在任何组件中使用

## 📁 项目结构

```
src/
├── components/                 # 📦 公共组件
│   ├── GroupDialog.vue        # 群组配置对话框
│   ├── UserDialog.vue         # 用户配置对话框
│   ├── RuleDialog.vue         # 规则配置对话框
│   ├── TemplateDialog.vue     # 模板配置对话框
│   ├── ImportExportDialog.vue # 导入导出对话框
│   ├── FeishuCardPreview.vue  # 飞书卡片预览组件
│   └── WebhookDialogEnhanced.vue # 增强Webhook配置
├── layout/                    # 🎨 布局组件
│   └── index.vue             # 主布局 (带侧边栏导航)
├── router/                    # 🛣 路由配置
│   └── index.ts              # Vue Router配置
├── stores/                    # 🗃 状态管理 (Pinia)
│   ├── groups.ts             # 群组状态管理
│   ├── users.ts              # 用户状态管理
│   ├── rules.ts              # 规则状态管理
│   └── templates.ts          # 模板状态管理
├── styles/                    # 🎨 样式文件
│   ├── main.scss             # 主样式文件
│   └── variables.scss        # 全局SCSS变量
├── types/                     # 📝 类型定义
│   └── index.ts              # TypeScript类型定义
├── utils/                     # 🔧 工具函数
│   ├── config-manager.ts     # 配置管理器 (localStorage)
│   ├── message-parser.ts     # 消息解析引擎
│   ├── webhook-sender.ts     # Webhook发送器
│   └── init-demo-data.ts     # 演示数据初始化
├── views/                     # 📄 页面组件
│   ├── groups/               # 群组管理页面
│   │   ├── index.vue         # 群组列表
│   │   └── detail-working.vue # 群组详情 (当前版本)
│   ├── users/                # 用户管理页面
│   ├── rules-working.vue     # 规则配置页面 (当前版本)
│   ├── templates/            # 模板配置页面
│   └── dashboard/            # 监控面板
├── App.vue                   # 🖥 根组件
└── main.ts                   # 🚀 应用入口
```

### 文件命名约定
- **-working.vue**: 当前正在使用的功能完整版本
- **-simple.vue**: 简化版本 (用于故障排除或开发测试)
- **Dialog.vue**: 对话框组件统一后缀
- **index.vue**: 页面或模块的主入口文件

## 📖 使用指南

### 1. 创建群组 🆕

1. **访问群组管理页面**: 点击侧边栏"群组配置"
2. **创建新群组**: 点击"新建群组"按钮
3. **填写基本信息**:
   - **群组标识**: 用于生成Webhook URL（如：`devops`, `production`, `alerts`）
   - **群组名称**: 显示名称（如："运维团队群", "生产环境告警"）
   - **描述信息**: 详细说明群组用途
4. **配置Webhook**:
   - **选择平台**: 飞书、企业微信、钉钉、Slack等
   - **填写URL**: 对应平台的Webhook地址
   - **测试连接**: 系统会自动验证连接状态
5. **保存配置**: 完成群组创建

### 2. 管理用户 👥

1. **进入用户管理**: 点击侧边栏"用户管理"
2. **添加用户**: 点击"添加用户"按钮
3. **填写用户信息**:
   - **基本信息**: 姓名、邮箱、手机号、部门、角色
   - **多平台ID映射**:
     - 飞书用户ID
     - 企业微信用户ID
     - 钉钉用户ID
     - 其他平台用户ID
4. **保存用户**: 完成用户信息录入

### 3. 配置智能规则 ⚡

1. **规则配置页面**: 点击侧边栏"规则配置"
2. **创建规则**: 点击"新建规则"按钮
3. **设置匹配条件**:
   - **关键字**: 支持多个关键字，用逗号分隔
   - **匹配方式**: 包含、精确匹配、正则表达式
   - **优先级**: 数字越小优先级越高
4. **选择通知对象**:
   - **@用户**: 选择需要@的用户
   - **@所有人**: 可选择是否@全体成员
5. **配置消息样式**:
   - **颜色主题**: 严重(红)、警告(黄)、成功(绿)、信息(蓝)
   - **模板**: 选择预设模板或自定义
6. **测试规则**: 使用测试功能验证规则配置
7. **保存规则**: 完成规则创建

### 4. 模板管理 🎨

1. **模板配置**: 点击侧边栏"模板配置"
2. **选择模板类型**:
   - **预设模板**: P0(严重)、P1(重要)、CI/CD成功等
   - **自定义模板**: 创建个性化消息模板
3. **编辑模板内容**:
   - **标题**: 消息标题模板
   - **内容**: 消息内容模板，支持变量替换
   - **样式**: 颜色主题和布局
4. **实时预览**: 右侧面板实时显示模板效果
5. **保存模板**: 完成模板配置

### 5. 使用Webhook 🔗

创建群组后，系统会自动生成对应的Webhook URL：

```
https://your-domain.com/webhook/{group_identifier}
```

**支持的第三方系统**:
- **📊 监控系统**: Prometheus, Zabbix, Nagios
- **🔍 日志系统**: 腾讯云CLS, 阿里云SLS, ELK
- **🚀 CI/CD**: Jenkins, GitLab CI, Coding CI/CD, GitHub Actions
- **☁ 云平台**: 阿里云, 腾讯云, AWS CloudWatch

## ⚙️ 配置示例

### 腾讯云CLS告警配置
```bash
Webhook URL: https://your-domain.com/webhook/devops
请求方法: POST
Content-Type: application/json
```

### Prometheus告警配置
```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'webhook'

receivers:
  - name: 'webhook'
    webhook_configs:
      - url: 'https://your-domain.com/webhook/production'
        send_resolved: true
        http_config:
          headers:
            Content-Type: 'application/json'
```

### Coding CI/CD配置
```yaml
# .coding-ci.yml
stages:
  - name: deploy
    trigger: auto
    executor:
      - docker
    steps:
      - step: name: deploy
        script:
          - echo "Deploying..."
        notifications:
          - type: webhook
            url: https://your-domain.com/webhook/devops
            events: [SUCCESS, FAILURE]
```

### GitHub Actions配置
```yaml
# .github/workflows/notify.yml
name: Send Notification
on:
  workflow_run:
    types: [completed]

jobs:
  notify:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion != 'success' }}
    steps:
      - name: Send webhook
        run: |
          curl -X POST \
            -H "Content-Type: application/json" \
            -d '{"repository": "${{ github.repository }}", "status": "${{ github.event.workflow_run.conclusion }}"}' \
            https://your-domain.com/webhook/devops
```

## 💾 数据存储

本系统采用**纯前端数据存储**方案：

### 存储方式
- **主存储**: 浏览器localStorage
- **可选存储**: wa-sqlite (本地SQLite数据库)
- **配置管理**: ConfigManager统一管理

### 数据特性
- ✅ **自动保存**: 所有配置变更即时保存
- ✅ **版本管理**: 支持配置数据版本升级
- ✅ **备份恢复**: 完整的导入导出功能
- ✅ **数据验证**: 自动检查数据完整性
- ✅ **演示数据**: 首次使用自动初始化示例数据

### 数据模型
```typescript
interface GlobalConfig {
  version: string;
  groups: Group[];
  users: User[];
  rules: Rule[];
  templates: Template[];
  settings: Settings;
}
```

## 🚧 开发路线图

### ✅ 已完成功能
- [x] 完整的群组管理系统
- [x] 多平台用户ID映射
- [x] 智能规则引擎
- [x] 可视化模板编辑器
- [x] 实时消息预览
- [x] 配置导入导出
- [x] 多格式消息解析
- [x] Webhook连接测试

### 🚧 开发中功能
- [ ] 监控面板数据可视化
- [ ] 更多消息格式支持
- [ ] 权限管理系统
- [ ] API接口文档

### 📋 计划功能
- [ ] 消息处理引擎后端
- [ ] 实时消息推送
- [ ] 多语言支持 (i18n)
- [ ] 主题定制系统
- [ ] 移动端适配
- [ ] 插件系统

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 开发流程
1. **Fork** 本项目到你的GitHub
2. **创建特性分支**: `git checkout -b feature/amazing-feature`
3. **提交变更**: `git commit -m 'Add: amazing feature'`
4. **推送分支**: `git push origin feature/amazing-feature`
5. **创建Pull Request**: 详细描述你的变更

### 代码规范
- 使用 **TypeScript** 严格模式
- 遵循 **Vue 3 Composition API** 最佳实践
- 组件命名使用 **PascalCase**
- 文件命名使用 **kebab-case**
- 提交信息遵循 **Conventional Commits**

### 开发环境设置
```bash
# 克隆项目
git clone https://github.com/your-username/webhook-config-manager.git
cd webhook-config-manager

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行代码检查
npm run lint
```

## 📄 许可证

本项目采用 **MIT 许可证** - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持与反馈

### 获取帮助
- 📋 **提交Issue**: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 **讨论交流**: [GitHub Discussions](https://github.com/your-repo/discussions)
- 📧 **邮件支持**: support@example.com
- 📖 **在线文档**: [项目文档](https://docs.example.com)

### 常见问题
- **Q**: 数据是否安全？
  **A**: 所有数据存储在本地浏览器中，不会上传到任何服务器

- **Q**: 支持哪些平台？
  **A**: 支持飞书、企业微信、钉钉、Slack、Discord、Teams等主流平台

- **Q**: 如何备份数据？
  **A**: 使用系统设置中的"导出配置"功能即可备份所有数据

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个Star！**

Made with ❤️ by the Webhook Config Manager Team

</div>