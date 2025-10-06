# CLAUDE.md

> 最近更新：2025-10-06

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。
## 🎯 重要约定

**开发进度同步约定**：
1. **开发前必读**：每次开始工作前，必须先查阅 `开发进度.md` 了解：
   - 当前版本状态和已完成功能
   - 待办任务的优先级排序
   - 已知的风险阻塞项
2. **开发中更新**：功能开发过程中如遇到新问题或状态变化，及时更新 `开发进度.md`
3. **完成后同步**：功能完成后必须：
   - 将对应任务状态从待办改为已完成
   - 更新相关文档（README.md、PLAN.md、CLAUDE.md、PRD.md）
   - 记录完成时间和关键说明

**文档一致性检查**：每次提交前确保所有文档描述与实际代码功能保持一致。

## 项目概述
这是一个**车险多维分析系统** - 基于 React 的仪表板应用程序，用于分析车险数据，具有 16 个 KPI 可视化和多维过滤功能。

## 开发命令

### 核心开发
```bash
npm run dev                 # 启动开发服务器，端口 9010，使用 Turbopack
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
├── ai/                     # Genkit AI 集成 (模型、流程定义)
├── app/                    # Next.js App Router (页面、API路由)
│   ├── api/
│   │   └── analyze-chart/  # "AI分析"按钮的后端API实现
│   └── page.tsx            # 主仪表板页面
├── components/
│   ├── dashboard/          # 核心仪表板业务组件
│   │   ├── kpi-grid.tsx    # 概览: KPI矩阵 & AI洞察
│   │   ├── ai-deterioration-analysis.tsx # 概览: AI归因分析报告
│   │   ├── weekly-trend.tsx # 趋势洞察: 周度趋势图
│   │   ├── customer-performance.tsx # 结构/费用分析: 旭日/条形图
│   │   ├── comparison-analysis.tsx  # 对比分析: 多维度对比条形图
│   │   ├── top-filters.tsx  # 智能筛选面板
│   │   └── header.tsx     # 仪表板顶部栏(标题、数据源、设置)
│   └── ui/                 # shadcn/ui 基础UI组件
├── contexts/
│   └── data-context.tsx    # 全局数据状态管理 (React Context)
├── lib/                    # 核心工具函数、类型与数据处理
│   ├── data.ts             # 核心数据转换、聚合与计算逻辑
│   ├── csv.ts              # CSV导入与导出功能
│   ├── idb.ts              # IndexedDB 客户端缓存实现
│   ├── color-scale.ts      # 图表颜色动态计算规则
│   └── types.ts            # 全局核心类型定义
└── hooks/                  # 自定义 React Hooks
```

### 数据模型
系统处理车险数据包含：
- **17 个维度字段**：时间周期、机构、客户类别、风险等级
- **9 个度量字段**：保费、赔款、费用、保单数量
- **16 个 KPI 计算**：标准保险指标及特定公式
- 字段取值约定：`is_new_energy_vehicle` 为能源类型（新能源/燃油），`is_transferred_vehicle` 为过户状态（过户/非过户）；导入旧的“是/否”或布尔 `true/false` 取值时会自动转换。

### 状态管理
- 单一 **DataProvider** 上下文包装整个应用程序
- 数据持久化到浏览器的 IndexedDB 以支持离线功能
- 实时过滤触发所有组件的 KPI 重新计算

### 板块切换逻辑
- **六大核心板块** (`page.tsx`):
  1.  **经营概览** (`overview`): 默认首页，展示 KPI 网格。
  2.  **趋势洞察** (`trend`): 展示周度趋势图。
  3.  **结构分析** (`structure`): 展示客户表现图。
  4.  **对比分析** (`comparison`): 展示对比分析图。
  5.  **费用分析** (`expense`): 展示费用分析图。
  6.  **设置** (`settings`): 数据导入、导出及筛选配置。
- **状态管理**: 使用 `useState` 在 `page.tsx` 中管理当前激活的板块。

## 核心功能与业务逻辑

### 智能客户类别切片
复杂过滤器组合映射到客户类别组合：
- **私家车**、**单位客车**、**非营客车组合**
- **营业客运**、**货运车辆**、**非营货车**、**特种车辆**、**摩托车业务**、**不含摩托车**
- 映射规则位于 `/src/lib/data.ts` 的 `customerCategoryCombinations` 配置中

### KPI 计算与展示
所有 16 个指标遵循标准保险公式：
- **签单保费**：`SUM(signed_premium_yuan)`
- **满期赔付率**：`SUM(reported_claim_payment_yuan) / SUM(matured_premium_yuan) × 100`
- **费用率**：`SUM(expense_amount_yuan) / SUM(signed_premium_yuan) × 100`

#### KPI 看板功能 (`kpi-grid.tsx`)
- **功能**: 核心指标卡片化展示，支持点击切换高亮。
- **数值精度**: 所有率值指标（如赔付率、费用率）均保留两位小数。
- **趋势显示**: 自动计算周环比变化，并用不同颜色和图标（上升/下降）表示。

#### AI 分析报告
- **富文本解析**: `src/lib/ai-markup.ts` 解析器将 AI 返回的自定义标记语言转换为带样式的 HTML。
- **一键复制**: AI 分析报告支持一键复制功能，复制内容包含：
  - 分析上下文（metadata）
  - AI Prompt（完整提示词）
  - 分析结果（带标记语法的原始文本）
- **精简分析**: 已移除下钻分析功能，AI 分析专注于提供简洁的核心洞察（200字以内），遵循麦肯锡金字塔原理。

### 周度趋势组合图 (`weekly-trend.tsx`)
- **功能**: 展示最近 12 周的签单保费、满期赔付率、综合费用率和边际贡献率的走势。
- **双轴展示**: 保费为主轴（柱状图），率值为次轴（折线图）。
- **指标小数位数**: 所有率值指标保留两位小数。

### 数据导入系统
- CSV 拖拽上传及验证
- 多文件批量上传支持
- 实时解析进度和错误报告
- 标准化 36 列格式模板下载

## 开发指南

### 组件模式
- **原子化**: 遵循原子设计理念，基础组件位于 `src/components/ui`。
- **组合式**: 仪表盘核心组件（如图表、KPI 卡片）在 `src/components/dashboard` 中进行组合。
- **AI 分析组件**: `ai-analysis-display.tsx` 提供统一的 AI 分析结果展示，包含富文本渲染和一键复制功能。

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
- **`next.config.mjs`**: Next.js 配置文件，用于启用 Turbopack 等高级功能。
- **`tailwind.config.ts`**: Tailwind CSS 配置文件，定义了项目的主题、颜色、字体等。
- **`postcss.config.mjs`**: PostCSS 配置文件。

## 数据要求
CSV 文件必须遵循 36 列模板格式，字段名称需与字段字典中指定的完全一致。关键字段包括用于过滤的维度字段（17个）和用于计算的度量字段（9个）。

## AI 集成
系统包含 Google AI 集成，使用 Gemini 2.5 Flash 模型提供智能洞察。AI 功能对过滤数据和业务场景提供上下文分析。

## 图表显示规范

### 颜色规范
基于满期边际贡献率的颜色映射规则：
- **绿色系**：满期边际贡献率 > 12%，数值越大颜色越深
- **蓝色系**：满期边际贡献率 8%-12% 区间，数值越大颜色越深
- **黄色系**：满期边际贡献率 4%-8% 区间，数值越小颜色越深
- **红色系**：满期边际贡献率 < 4% 区间，数值越小颜色越深

### 排序规范
- 所有图表必须支持排序功能
- 提供从大到小和从小到大的排序切换
- 默认排序方式根据业务需求确定

### 数值显示规范
- **率值或占比**:
  - **显示**: 百分比形式，保留两位小数 (e.g., `12.34%`)。
  - **场景**: 满期赔付率、综合费用率、边际贡献率等。
- **绝对值**:
  - **显示**: 整数或带单位的缩写 (e.g., `1,234` or `12.5w`)。
  - **场景**: 签单保费、满期保费、赔付金额等。

### 数值标签显示规范
- **默认隐藏**: 所有图表（如柱状图、折线图）默认不显示数值标签。
- **Hover 显示**: 鼠标悬停在图表元素上时，通过 Tooltip 显示详细数值。
- **目的**: 保持图表简洁性，避免视觉混乱。
