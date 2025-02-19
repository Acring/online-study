# 在线学习数据统计系统

这是一个基于 Next.js 开发的在线学习数据统计系统，用于实时监控和统计飞书会议的学习情况。

## 功能特点

- 实时显示当前在线学习人数
- 统计每个参与者的学习时长
- 自动同步飞书会议数据到多维表格
- 支持每日定时数据同步
- 美观的粒子动画背景

## 技术栈

- Next.js 14
- TypeScript
- Tailwind CSS
- 飞书开放平台 API

## 开始使用

### 环境要求

- Node.js 20+
- pnpm

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

创建 `.env` 文件并配置以下变量：

```bash
APP_ID=你的飞书应用ID
APP_SECRET=你的飞书应用密钥
TABLE_TOKEN=会议数据表Token
TABLE_ID=会议数据表ID
PARTICIPANT_TABLE_TOKEN=参会人数据表Token
PARTICIPANT_TABLE_ID=参会人数据表ID
MEETING_STATISTIC_TABLE_TOKEN=会议统计表Token
MEETING_STATISTIC_TABLE_ID=会议统计表ID
PARTICIPANT_STATISTIC_TABLE_TOKEN=参会人统计表Token
PARTICIPANT_STATISTIC_TABLE_ID=参会人统计表ID
```

### 开发运行

```bash
pnpm dev
```

访问 http://localhost:3000 查看结果。

### 构建部署

```bash
pnpm build
pnpm start
```

## 自动化任务

系统包含两个主要的自动化脚本：

1. 同步会议数据：
```bash
pnpm sync-meeting-data
```

2. 获取学习状态：
```bash
pnpm get-study-status
```

## GitHub Actions

项目配置了自动化的 GitHub Actions 工作流，每天会自动执行数据同步任务。工作流配置详见：

.github/workflows/daily_task.yml

## 项目结构

```
src/
├── app/                # Next.js 应用页面
├── components/         # React 组件
├── lib/               # 工具函数和配置
├── scripts/           # 自动化脚本
├── types/             # TypeScript 类型定义
└── ...
```

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

MIT

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。
