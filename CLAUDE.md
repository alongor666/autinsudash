# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。
## 🎯 

## 项目概述
这是一个**车险多维分析系统** - 基于 React 的仪表板应用程序，用于分析车险数据，具有 16 个 KPI 可视化和多维过滤功能。

## 开发命令

### 核心开发
```bash
npm run dev                 # 启动开发服务器，端口 9002，使用 Turbopack
npm run build              # 构建生产版本
npm start                  # 启动生产服务器
npm run lint               # 运行 Next.js 代码检查
npm run typecheck          # 运行 TypeScript 类型检查
```

### AI 集成（可选）
```bash
npm run genkit:dev         # 启动 Genkit AI 开发服务器
npm run genkit:watch       # 启动 Genkit 文件监听模式
```

## 架构概述

### 技术栈
- **Next.js 15.3.3** (App Router) 配合 TypeScript
- **React 18.3.1** 使用 Context API 进行状态管理
- **Tailwind CSS** + **shadcn/ui** 组件库
- **Recharts** 用于数据可视化
- **IndexedDB** 用于客户端数据持久化
- **Google AI (Genkit)** 用于智能洞察

### 关键目录结构
```
src/
├── app/                    # Next.js App Router (page.tsx, layout.tsx)
├── components/
│   ├── dashboard/         # 主要仪表板组件
│   │   ├── kpi-grid.tsx   # 4x4 KPI 矩阵显示
│   │   ├── kpi-card.tsx   # 单个 KPI 卡片
│   │   └── main-chart.tsx # 主要可视化图表
│   ├── ui/               # shadcn/ui 可复用组件
│   └── data/             # CSV 导入/导出组件
├── contexts/
│   └── data-context.tsx  # 全局状态管理
├── lib/                  # 工具函数和类型定义
└── hooks/                # 自定义 React hooks
```

### 数据模型
系统处理车险数据包含：
- **17 个维度字段**：时间周期、机构、业务类型、风险等级
- **9 个度量字段**：保费、赔款、费用、保单数量
- **16 个 KPI 计算**：标准保险指标及特定公式

### 状态管理
- 单一 **DataProvider** 上下文包装整个应用程序
- 数据持久化到浏览器的 IndexedDB 以支持离线功能
- 实时过滤触发所有组件的 KPI 重新计算

## 核心功能与业务逻辑

### 智能业务切片
复杂过滤器组合映射到业务类型组合：
- **货车**、**大货车**、**家自车**（私家车）
- **营业货车**（商用货车）、**非营业客车**（非商用客车）
- 映射规则位于 `/src/lib/data.ts` 的 `businessTypeCombinations` 配置中

### KPI 计算
所有 16 个指标遵循标准保险公式：
- **签单保费**：`SUM(signed_premium_yuan)`
- **满期赔付率**：`SUM(reported_claim_payment_yuan) / SUM(matured_premium_yuan) × 100`
- **费用率**：`SUM(expense_amount_yuan) / SUM(signed_premium_yuan) × 100`

完整公式记录在 README.md 第 141-160 行。

### 数据导入系统
- CSV 拖拽上传及验证
- 多文件批量上传支持
- 实时解析进度和错误报告
- 标准化 36 列格式模板下载

## 开发指南

### 组件模式
- 统一使用 **shadcn/ui** 组件
- 遵循现有的玻璃态设计（backdrop-blur、渐变）
- KPI 卡片使用复合组件模式和标准化布局
- 所有交互组件支持响应式设计

### 添加新 KPI
1. 在 `src/types/index.ts` 中定义类型
2. 在 `src/utils/calculations.ts` 中添加计算逻辑
3. 在 `components/dashboard/DashboardGrid.tsx` 中配置显示
4. 如需要更新字段字典

### 样式系统
- **Tailwind CSS** 配合 `tailwind.config.ts` 中的自定义主题
- 颜色语义：红色 `#F04438`（风险）、绿色 `#12B76A`（正向）、蓝色 `#1D4ED8`（中性）
- 字体层级：H1(46px)、H2(32px)、H3(24px)、正文(16px)、辅助(14px)
- 苹果发布会美学风格，流畅动画效果

### 数据处理
- 所有数据操作通过 DataContext 进行
- CSV 解析处理中文字段名和各种数据格式
- 错误处理包含行级验证和详细报告
- 支持赔款/费用负值（冲销）

## 配置文件
- **`next.config.ts`**：忽略构建错误以提供开发灵活性
- **`tsconfig.json`**：使用 `@/*` 别名的路径映射
- **`tailwind.config.ts`**：全面的主题和设计令牌
- **`.env`**：包含 Gemini API 密钥用于 AI 功能
- **`apphosting.yaml`**：Firebase 部署配置

## 数据要求
CSV 文件必须遵循 36 列模板格式，字段名称需与字段字典中指定的完全一致。关键字段包括用于过滤的维度字段（17个）和用于计算的度量字段（9个）。

## AI 集成
系统包含 Google AI 集成，使用 Gemini 2.5 Flash 模型提供智能洞察。AI 功能对过滤数据和业务场景提供上下文分析。