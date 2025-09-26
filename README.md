# 车险多维分析系统

车险变动成本明细分析多维数据分析平台，提供车险业务核心指标的4×4 KPI看板展示和多维度分析功能。

## 功能特性

- **4×4 KPI看板矩阵**：展示16个核心车险业务指标
- **智能数据导入**：支持CSV文件拖拽上传，自动验证数据格式
- **多维度筛选**：支持16个维度字段的灵活筛选（起保年度、周序号、业务类型分类、机构层级、三级机构/城市、客户三级分类、险种类型、是否新能源车、保障方案、是否过户车、新续转状态、车险评级、高速风险等级、大货车评分、小货车评分、终端来源）
- **对比分析**：同比、环比及自定义时间段对比
- **响应式设计**：适配桌面、平板和移动设备
- **实时计算**：基于标准公式的动态指标计算
- **数据导出**：支持CSV格式数据导出

> 详细 PRD 请见：`PRD.md`

## 设计系统蓝图

- **色彩语义体系**：
  - 红色 `#F04438` 用于风险/警报，绿色 `#12B76A` 表示正向表现，蓝色 `#1D4ED8` 作为中性品牌色，橙色 `#F79009` 用于待关注或预测提醒。
  - 背景采用 `#F8FAFC` 柔和浅灰，并保持色彩对比度满足可读性要求；图表/标签控制在 6 色以内，兼顾色盲安全。
- **字体层级体系**：
  - H1/H2/H3 分别为 46/32/24 px，字重 600，正文（16 px）与辅助文字（14 px）保持 1.5 行距。
  - 关键 KPI 采用等宽数字字体呈现，确保读数稳定，主副信息间距 8–16 px。
- **倒金字塔信息层**：
  - KPI 卡片顶部聚焦 5 秒可读的核心指标（数值 + 对比箭头），中部以标签展示关键维度，底部给出趋势解读与“下钻分析 / 加入收藏”等操作。
  - 颜色、字体、阴影及渐变均遵循统一语义，确保仪表板在响应式布局与浅/深色主题下保持一致体验。

## 智能业务切片

为了提升分析效率和用户体验，系统引入了"智能业务切片"功能。此功能将复杂的多维度选项组合映射为简洁、易于理解的业务类型组合。该映射同时应用于动态标题生成和智能洞察（AI搜索）中。

### 当前业务类型组合规则 (可扩展)

| 业务类型组合 | 触发条件 (业务类型 `business_type_category`) | AI 搜索关键词 |
| :--- | :--- | :--- |
| **货车** | 包含所有货车相关类型（例如：“9吨及以上货车”、“2吨及以下货车”等） | `货车` |
| **大货车** | 仅选择“9吨及以上货车” | `大货车` |
| **小货车** | 仅选择“2吨及以下货车” | `小货车` |
| **营业货车** | 包含所有“营业”属性的货车类型 | `营业货车` |
| **非营业客车** | 仅选择“非营业客车” | `非营业客车` |
| **家自车** | 仅选择“非营业个人” | `家自车` |
| **不含摩托车** | 选择了除“摩托车”以外的所有业务类型 | `不含摩托车` |

> **注**：这是一个可扩展的规则体系。未来可根据业务需求，持续补充新的业务类型组合规则，例如"新能源车"、"高风险业务"等。

## 技术架构

- **前端框架**：Next.js 14 + TypeScript
- **样式系统**：Tailwind CSS + shadcn/ui
- **状态管理**：React Context
- **图表库**：Recharts
- **图标库**：Lucide React

## 快速开始

### 环境要求

- Node.js 18.17 或更高版本
- npm 9.0 或更高版本

### 安装依赖

```bash
cd car-insurance-dashboard
npm install
```

### 开发运行

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## 数据配置

### 数据文件结构

```
public/data/
├── metadata/
│   ├── available_years.json    # 可用年度配置
│   ├── available_weeks.json    # 可用周次配置
│   ├── data_catalog.json       # 数据文件目录
│   └── field_dictionary.json   # 字段定义字典
└── *.csv                       # 周度数据文件
```

### CSV文件格式

数据文件命名格式：`YYYY保单第WW周变动成本明细表.csv`

必须包含以下字段：
- 维度字段（17个）：时间、机构、业务、客户、风险等维度
- 度量字段（9个）：保费、赔款、费用等金额和数量指标

详细字段定义请参考 `public/data/metadata/field_dictionary.json`。

实际模板字段（与系统解析器、测试数据.csv 完全一致，按列顺序）：

```
snapshot_date,
policy_start_year,
business_type_category,
chengdu_branch,
third_level_organization,
customer_category_3,
insurance_type,
is_new_energy_vehicle,
coverage_type,
is_transferred_vehicle,
renewal_status,
vehicle_insurance_grade,
highway_risk_grade,
large_truck_score,
small_truck_score,
terminal_source,
signed_premium_yuan,
matured_premium_yuan,
policy_count,
claim_case_count,
reported_claim_payment_yuan,
expense_amount_yuan,
commercial_premium_before_discount_yuan,
premium_plan_yuan,
marginal_contribution_amount_yuan,
week_number
```

## KPI指标说明

### 核心指标
1. **签单保费**（万元）：SUM(signed_premium_yuan)
2. **满期赔付率**（%）：SUM(reported_claim_payment_yuan) / SUM(matured_premium_yuan) × 100
3. **费用率**（%）：SUM(expense_amount_yuan) / SUM(signed_premium_yuan) × 100
4. **满期边际贡献率**（%）：SUM(marginal_contribution_amount_yuan) / SUM(matured_premium_yuan) × 100

### 其他指标
5. **满期保费**（万元）：SUM(matured_premium_yuan)
6. **保单件数**（件）：SUM(policy_count)
7. **赔案件数**（件）：SUM(claim_case_count)
8. **变动成本率**（%）：(SUM(expense_amount_yuan) / SUM(signed_premium_yuan) + SUM(reported_claim_payment_yuan) / SUM(matured_premium_yuan)) × 100
9. **满期出险率**（%）：(SUM(claim_case_count) / SUM(policy_count)) × (SUM(matured_premium_yuan) / SUM(signed_premium_yuan)) × 100
10. **单均保费**（元）：SUM(signed_premium_yuan) / SUM(policy_count)
11. **案均赔款**（元）：SUM(reported_claim_payment_yuan) / SUM(claim_case_count)
12. **满期边际贡献额**（万元）：SUM(marginal_contribution_amount_yuan)
13. **商业险折前保费**（万元）：SUM(commercial_premium_before_discount_yuan)
14. **商业险自主系数**：SUM(signed_premium_yuan) / SUM(commercial_premium_before_discount_yuan)
15. **已报告赔款**（万元）：SUM(reported_claim_payment_yuan)
16. **费用金额**（万元）：SUM(expense_amount_yuan)

## 使用说明

### 导入数据
1. 点击页面右上角的"导入数据"按钮
2. 在弹出的导入界面中，可以：
   - 点击"下载模板"获取标准CSV模板（包含示例行）
   - 拖拽或多选多个CSV文件，系统会自动识别周次与年度并汇总校验
   - 实时查看解析进度、重复周次提醒、按文件拆分的错误/警告摘要
   - 支持一键复制错误报告，或下载合并后的验证报告（含逐行问题明细：行号/字段/级别/说明）
   - 导入成功后自动启用最近两周的对比分析，并将数据快照持久化至浏览器，以便下次直接恢复
3. 支持多文件批量上传；建议按周导入保持校验粒度

### 筛选数据
1. 在左侧筛选面板选择所需的维度条件，常用维度提供快捷按钮（最新周、最近4周、本年度、仅商业险）
2. 支持多选和单选模式，并提供“全选 / 清空 / 反选”“周次范围”等批量工具
3. 使用搜索框快速定位筛选项，应用后面板自动收起并显示摘要；点击摘要或浮出的快捷按钮可再次展开
4. 清空筛选将立即恢复默认视图并写入链接参数，便于分享复现
5. 当车险评级、高速风险等级、大货车评分、小货车评分存在空值时，筛选器会以“未评级”展示并可直接筛选空值记录

### 对比分析
1. 在右侧对比控制面板启用对比分析
2. 选择对比类型：同比、环比或自定义
3. 系统自动计算变化值和变化率
4. 变化性质通过颜色和图标直观展示

### 导出数据
1. 在筛选面板或KPI卡片中选择导出功能
2. 支持导出当前筛选结果的CSV文件
3. 包含KPI指标汇总和明细数据

## 开发指南

### 项目结构

```
src/
├── components/
│   ├── dashboard/     # 仪表板组件
│   ├── kpi/          # KPI指标组件
│   ├── filters/      # 筛选器组件
│   ├── data/         # 数据导入组件（CSV 上传/校验/导入）
│   └── ui/           # 基础UI组件
├── contexts/         # 全局状态管理
├── types/           # TypeScript类型定义
├── utils/           # 工具函数
└── app/             # Next.js应用目录
```

### 添加新指标

1. 在 `src/types/index.ts` 中定义指标类型
2. 在 `src/utils/calculations.ts` 中添加计算逻辑
3. 在 `components/dashboard/DashboardGrid.tsx` 中配置显示顺序
4. 更新字段字典文件

### 自定义样式

项目使用 Tailwind CSS，主要样式配置在：
- `tailwind.config.js`：主题配置
- `src/app/globals.css`：全局样式和自定义CSS

## 上传到 GitHub

您可以按照以下步骤将此项目上传到您自己的 GitHub 仓库。

### 第一步：准备本地仓库

在您的项目根目录打开终端，然后执行以下命令：

1.  **初始化 Git**：
    ```bash
    git init -b main
    ```

2.  **添加所有文件到暂存区**：
    > `.gitignore` 文件已为您创建好，它会自动忽略 `node_modules` 等不需要上传的文件。
    ```bash
    git add .
    ```

3.  **创建第一次提交**：
    ```bash
    git commit -m "Initial commit"
    ```

### 第二步：在 GitHub 创建远程仓库

1.  登录您的 GitHub 账户。
2.  点击页面右上角的 **+** 号，选择 **New repository**。
3.  为您的仓库命名（例如 `car-insurance-dashboard`）。
4.  将仓库设置为 **Public**（公开）或 **Private**（私有）。
5.  **不要** 勾选 "Add a README file" 或 "Add .gitignore"。
6.  点击 **Create repository**。

### 第三步：关联并推送代码

创建仓库后，复制页面上提供的仓库 URL。回到您的终端执行以下命令：

1.  **关联远程仓库** (请将 URL 替换为您自己的):
    ```bash
    git remote add origin https://github.com/YourUsername/YourRepositoryName.git
    ```

2.  **推送代码到 GitHub**:
    ```bash
    git push -u origin main
    ```

完成这些步骤后，您的项目代码就会出现在您的 GitHub 仓库中。

## 故障排除

### 常见问题

1. **数据导入失败**
   - 检查 CSV 文件格式是否符合模板要求
   - 确认必需字段是否完整
   - 查看数据验证错误信息并修复
   - 检查数值字段是否包含非法字符
   - 说明：
     - 逐行解析失败不会中断导入，跳过该行并记录到“问题明细”与报告
     - `已报告赔款`/`费用金额`允许负值（冲销），作为“警告”提示，不阻止导入
     - “赔案件数>保单件数”在部分场景属正常，不再提示为问题

### 筛选器使用优化
- 核心筛选（年度/周次/机构/保险类型/险种）默认展开
- 多选支持：全选/清空/反选；周次支持“范围选择”“最近4周”快捷操作
- 草稿-应用模式：变更先在草稿中累积，点击“应用筛选”后生效（并写入URL），便于分享与复现
- 应用后筛选器自动收起，显示简洁摘要条与“调整筛选/清空”按钮，聚焦数据展示

### 视觉风格
- 整体偏向苹果发布会风格：留白、渐变背景、玻璃态卡片、细腻动效
- KPI 卡片采用玻璃态（backdrop-blur）与柔和阴影，标题使用渐变字色

2. **KPI计算异常**
   - 验证数据中是否包含必需字段
   - 检查数值字段是否为有效数字
   - 确认分母不为零的情况处理

3. **筛选器无响应**
   - 确认数据已正确导入
   - 检查筛选选项是否从数据中正确提取
   - 验证筛选逻辑是否正确应用

4. **文件上传问题**
   - 确保文件格式为CSV（.csv）
   - 检查文件大小是否过大（建议<10MB）
   - 确认文件编码为UTF-8

### 日志调试

开发模式下，相关日志会输出到浏览器控制台：
- 数据加载过程
- 计算错误信息
- 筛选应用状态

## 版本信息

- 当前版本：v1.0.0
- 更新日期：2024-09-21
- 兼容数据版本：1.0.0

## 许可证

本项目仅供内部使用，版权所有。

## 支持

如有问题或建议，请联系开发团队。
