import type { Kpi, FilterOptions } from './types';

export const kpiData: Kpi[] = [
  {
    title: '保费',
    value: '¥1.2M',
    change: '+12.5%',
    changeType: 'increase',
    description: '与上一周期相比',
  },
  {
    title: '赔付率',
    value: '58.6%',
    change: '-2.1%',
    changeType: 'decrease',
    description: '与上一周期相比',
  },
  {
    title: '费用率',
    value: '32.1%',
    change: '+0.5%',
    changeType: 'increase',
    description: '与上一周期相比',
  },
  {
    title: '边际贡献',
    value: '¥250K',
    change: '+8.2%',
    changeType: 'increase',
    description: '与上一周期相比',
  },
];

export const filterOptions: FilterOptions = {
  years: ['2024', '2023', '2022'],
  weeks: Array.from({ length: 52 }, (_, i) => `第 ${i + 1} 周`),
  orgLevels: ['集团', '分公司', '中心支公司', '支公司'],
  cities: ['北京', '上海', '广州', '深圳', '杭州'],
  insuranceTypes: ['交强险', '商业险'],
  policyTypes: ['个人', '团体'],
  renewalStatus: ['新保', '续保'],
  vehicleTypes: ['私家车', '货车', '客车'],
};

export const chartData = [
  { date: '2024-01', "保费": 200000, "赔付": 120000 },
  { date: '2024-02', "保费": 220000, "赔付": 130000 },
  { date: '2024-03', "保费": 250000, "赔付": 140000 },
  { date: '2024-04', "保费": 230000, "赔付": 150000 },
  { date: '2024-05', "保费": 280000, "赔付": 160000 },
  { date: '2024-06', "保费": 300000, "赔付": 170000 },
];

export const kpiListForAI = ['保费', '赔付率', '费用率', '边际贡献'];

// Flatten all filter options into a single array for the AI
export const availableFiltersForAI = Object.values(filterOptions).flat();

export const historicalUserBehaviorForAI = "用户经常在查看'北京'地区的'商业险'后，关注'赔付率'和'边际贡献'。同时，'续保'状态的'私家车'保单是常见的筛选组合。";
