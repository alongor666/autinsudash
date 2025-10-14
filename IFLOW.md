# 车险多维分析系统

## 项目概述

这是一个基于 Next.js 15.3.3 构建的车险业务数据分析仪表板，专为保险行业设计。系统提供 4×4 KPI 看板、多维度数据筛选、智能图表分析和 AI 驱动的业务洞察，帮助业务人员和管理者快速了解车险业务经营状况。

## 技术架构

### 核心技术栈
- **前端框架**：Next.js 15.3.3 + TypeScript
- **样式系统**：Tailwind CSS + shadcn/ui 组件库
- **状态管理**：React Context
- **图表库**：Recharts
- **AI 集成**：Genkit AI (Google AI)
- **数据存储**：IndexedDB + localStorage (本地缓存)
- **图标库**：Lucide React

### 项目结构
```
src/
├── ai/               # Genkit AI 功能模块
├── app/              # Next.js 应用目录
│   ├── globals.css   # 全局样式
│   └── layout.tsx    # 根布局
├── components/       # React 组件
│   ├── dashboard/    # 仪表板特定组件
│   └── ui/           # 可重用的 UI 组件 (shadcn/ui)
├── contexts/         # 全局状态管理 (React Context)
├── hooks/            # 自定义 Hooks
└── lib/              # 辅助函数、类型定义和工具
    ├── types.ts       # TypeScript 类型定义
    ├── data.ts        # 数据处理逻辑
    ├── csv.ts         # CSV 解析功能
    ├── utils.ts       # 工具函数
    └── idb.ts         # IndexedDB 操作
```

## 核心功能

### 1. KPI 看板系统
- **16 项核心指标**：包括签单保费、满期赔付率、费用率、满期边际贡献率等
- **4×4 矩阵布局**：按业务逻辑分组，每组共享主题色调
- **实时对比**：自动计算环比变化，显示变化幅度和绝对值
- **AI 洞察**：自动生成业务分析文本

### 2. 多维度筛选系统
- **16个筛选维度**：年度、周次、机构、客户类别、险种等
- **智能客户类别切片**：将复杂维度组合映射为简洁别名
- **草稿-应用模式**：变更暂存后统一应用，支持 URL 分享
- **快捷操作**：最新周、最近4周、本年度、仅商业险等预设

### 3. 图表分析模块
- **趋势洞察**：最近12周经营趋势，柱状图+折线组合
- **结构分析**：占比图支持13个维度切换，内/外环指标可自由组合
- **对比分析**：条形对比图支持13个维度和15个指标交叉分析
- **费用分析**：基于14%基准线展示各维度费用优化潜力

### 4. 数据管理
- **CSV 导入**：支持拖拽上传，自动验证数据格式
- **数据校验**：错误/警告分级处理，提供详细报告
- **本地缓存**：IndexedDB 持久化，刷新后自动恢复
- **数据导出**：支持 CSV 格式导出当前筛选结果

### 5. AI 智能功能
- **问题归因**：自动识别关键指标恶化并进行维度归因
- **预测式筛选**：基于历史记录推荐维度组合
- **智能洞察**：图表标题采用麦肯锡金字塔原理生成核心观点

## 设计系统

### 视觉风格
- **Apple 风格**：SF Pro 字体、玻璃态卡片、柔和渐变背景
- **色彩体系**：
  - 状态色专用：红/黄/蓝/绿仅用于满期边际贡献率四区间映射
  - 通用强调：紫系与中性灰用于非状态高亮
  - 面板统一：玻璃态白面板，支持浅/深色主题
- **字体层级**：H1/H2/H3 为 46/32/24px，正文 16px，辅助文字 14px

### 响应式设计
- **桌面端**：三段并排布局
- **平板端**：双列堆叠布局  
- **移动端**：单列卡片布局，首屏保留4个KPI与趋势图

## 数据模型

### 核心数据结构
```typescript
type RawDataRow = {
  snapshot_date: string;
  policy_start_year: number;
  business_type_category: string;
  chengdu_branch: string;
  third_level_organization: string;
  customer_category_3: string;
  insurance_type: string;
  is_new_energy_vehicle: string;
  coverage_type: string;
  is_transferred_vehicle: string;
  renewal_status: string;
  vehicle_insurance_grade: string;
  highway_risk_grade: string;
  large_truck_score: number | null;
  small_truck_score: number | null;
  terminal_source: string;
  signed_premium_yuan: number;
  matured_premium_yuan: number;
  policy_count: number;
  claim_case_count: number;
  reported_claim_payment_yuan: number;
  expense_amount_yuan: number;
  commercial_premium_before_discount_yuan: number;
  premium_plan_yuan: number;
  marginal_contribution_amount_yuan: number;
  week_number: number;
};
```

### KPI 计算公式
- 满期赔付率 = 已报告赔款 / 满期保费 × 100
- 费用率 = 费用金额 / 签单保费 × 100
- 满期边际贡献率 = 满期边际贡献额 / 满期保费 × 100
- 变动成本率 = (费用金额 ÷ 签单保费) + (已报告赔款 ÷ 满期保费)

## 开发指南

### 快速开始
```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build
npm start

# 类型检查
npm run typecheck

# 代码检查
npm run lint
```

### 开发端口
- 应用运行在：http://localhost:9010
- Genkit AI 开发模式：npm run genkit:dev

### 数据配置
- 数据文件位置：`public/data/`
- 模板格式：`YYYY保单第WW周变动成本明细表.csv`
- 字段定义：`public/data/metadata/field_dictionary.json`

### 添加新功能
1. 在 `src/types/index.ts` 中定义类型
2. 在 `src/lib/` 中实现业务逻辑
3. 在 `src/components/` 中创建组件
4. 更新相关配置文件

## 部署与维护

### 环境要求
- Node.js 18.17 或更高版本
- npm 9.0 或更高版本

### 构建优化
- 使用 Turbopack 加速开发构建
- 生产环境优化：`NODE_ENV=production next build`
- 支持静态导出和服务器部署

### 性能指标
- 首次内容绘制 < 2s
- 交互响应 < 200ms
- 图表切换 < 400ms
- 支持 1-3 万行数据流畅操作

## 扩展路线

### 短期优化
- 机构树选择/多层级汇总
- KPI 点击下钻功能
- 图表化分布视图

### 中期规划
- 智能推荐：基于用户行为提供预测性筛选
- 协同扩展：支持注释、分享视图与多格式导出
- 个性化：布局拖拽、主题切换、视图保存

### 长期愿景
- 云端同步：支持多用户协作
- 高级分析：机器学习预测模型
- 移动应用：React Native 移动端

## 许可证

本项目仅供内部使用，版权所有。