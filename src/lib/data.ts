import type { Kpi, FilterOptions, KPIKey } from './types';

export const kpiData: { [key in KPIKey]: Omit<Kpi, 'title' | 'id'> } = {
  totalPremium: {
    value: '¥0',
    change: '0%',
    changeType: 'increase',
    description: '与上一周期相比',
  },
  lossRatio: {
    value: '0%',
    change: '0%',
    changeType: 'decrease',
    description: '与上一周期相比',
  },
  underwritingProfitMargin: {
    value: '0%',
    change: '0%',
    changeType: 'increase',
    description: '与上一周期相比',
  },
  customerCount: {
    value: '0',
    change: '0%',
    changeType: 'increase',
    description: '与上一周期相比',
  },
};

export const kpiMeta: { [key in KPIKey]: { title: string } } = {
  totalPremium: { title: '总保费' },
  lossRatio: { title: '赔付率' },
  underwritingProfitMargin: { title: '承保利润率' },
  customerCount: { title: '客户数' },
};


export const filterOptions: FilterOptions = {
  years: ['2024', '2023', '2022'],
  months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  quarters: ['Q1', 'Q2', 'Q3', 'Q4'],
  regions: ['北京', '上海', '广州', '深圳', '杭州'],
  insuranceTypes: ['交强险', '商业险'],
};

export const chartData = [
  { date: '2024-01', "总保费": 200000, "赔付额": 120000 },
  { date: '2024-02', "总保费": 220000, "赔付额": 130000 },
  { date: '2024-03', "总保费": 250000, "赔付额": 140000 },
  { date: '2024-04', "总保费": 230000, "赔付额": 150000 },
  { date: '2024-05', "总保费": 280000, "赔付额": 160000 },
  { date: '2024-06', "总保费": 300000, "赔付额": 170000 },
];

export const kpiListForAI = ['总保费', '赔付率', '承保利润率', '客户数'];

// Flatten all filter options into a single array for the AI
export const availableFiltersForAI = Object.values(filterOptions).flat();

export const historicalUserBehaviorForAI = "用户经常在查看'北京'地区的'商业险'后，关注'赔付率'和'承保利润率'。";
