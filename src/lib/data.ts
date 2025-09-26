import type { Kpi, FilterOptions, KPIKey } from './types';

export const kpiData: { [key in KPIKey]: Omit<Kpi, 'title' | 'id'> } = {
  totalPremium: {
    value: '¥0万',
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
  regions: ['成都', '绵阳', '德阳', '南充', '宜宾'],
  insuranceTypes: ['交强险', '商业险'],
};

export const chartData = [
  { week_number: 1, signed_premium_yuan: 200000, reported_claim_payment_yuan: 120000 },
  { week_number: 2, signed_premium_yuan: 220000, reported_claim_payment_yuan: 130000 },
  { week_number: 3, signed_premium_yuan: 250000, reported_claim_payment_yuan: 140000 },
  { week_number: 4, signed_premium_yuan: 230000, reported_claim_payment_yuan: 150000 },
  { week_number: 5, signed_premium_yuan: 280000, reported_claim_payment_yuan: 160000 },
  { week_number: 6, signed_premium_yuan: 300000, reported_claim_payment_yuan: 170000 },
];

export const kpiListForAI = ['总保费', '赔付率', '承保利润率', '客户数'];

// Flatten all filter options into a single array for the AI
export const availableFiltersForAI = Object.values(filterOptions).flat();

export const historicalUserBehaviorForAI = "用户经常在查看'成都'地区的'商业险'后，关注'赔付率'和'承保利润率'。";
