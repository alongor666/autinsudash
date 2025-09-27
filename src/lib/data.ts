import type { Kpi, FilterOptions, KPIKey, CustomerCategoryAlias } from './types';

export const kpiData: { [key in KPIKey]: Omit<Kpi, 'title' | 'id'> } = {
  signedPremium: {
    value: '¥0万',
    change: '0%',
    changeType: 'increase',
    description: '与上一周期相比',
  },
  maturedLossRatio: {
    value: '0%',
    change: '0%',
    changeType: 'decrease',
    description: '与上一周期相比',
  },
  expenseRatio: {
    value: '0%',
    change: '0%',
    changeType: 'decrease',
    description: '与上一周期相比',
  },
  maturedMarginalContributionRate: {
    value: '0%',
    change: '0%',
    changeType: 'increase',
    description: '与上一周期相比',
  },
};

export const kpiMeta: { [key in KPIKey]: { title: string } } = {
  signedPremium: { title: '签单保费' },
  maturedLossRatio: { title: '满期赔付率' },
  expenseRatio: { title: '费用率' },
  maturedMarginalContributionRate: { title: '满期边际贡献率' },
};


export const filterOptions: FilterOptions = {
  years: ['2025', '2024', '2023'],
  regions: ['天府', '高新', '青羊', '宜宾', '德阳', '新都', '乐山', '金牛', '武侯', '锦江', '成华', '双流', '温江'],
  insuranceTypes: ['交强险', '商业保险'],
  customerCategories: [
    '非营业个人客车',
    '非营业企业客车',
    '非营业机关客车',
    '营业货车',
    '非营业货车',
    '营业出租租赁',
    '营业公路客运',
    '营业城市公交',
    '挂车',
    '特种车',
    '摩托车',
  ],
  newEnergyStatus: ['是', '否'],
  weekNumbers: [],
  transferredStatus: ['是', '否'],
  coverageTypes: ['交三', '主全', '单交'],
};

// 客户类别组合规则 - 基于 2025年第38周数据快照
export const customerCategoryCombinations: CustomerCategoryAlias[] = [
    {
        name: '私家车',
        description: '仅选择“非营业个人客车”',
        matchFunction: (selected) => selected.size === 1 && selected.has('非营业个人客车')
    },
    {
        name: '单位客车',
        description: '选择“非营业企业客车”与/或“非营业机关客车”',
        matchFunction: (selected) => {
            const target = ['非营业企业客车', '非营业机关客车'];
            const isSubset = Array.from(selected).every(item => target.includes(item));
            return selected.size > 0 && isSubset;
        }
    },
    {
        name: '非营客车组合',
        description: '同时选择所有非营业客车（个人、企业、机关）',
        matchFunction: (selected) => {
            const nonCommercial = ['非营业个人客车', '非营业企业客车', '非营业机关客车'];
            const hasAll = nonCommercial.every(item => selected.has(item));
            return selected.size === nonCommercial.length && hasAll;
        }
    },
    {
        name: '营业客运',
        description: '包含城市公交、公路客运或出租租赁任意组合',
        matchFunction: (selected) => {
            const passenger = ['营业城市公交', '营业公路客运', '营业出租租赁'];
            const allSelected = Array.from(selected).every(item => passenger.includes(item));
            return selected.size > 0 && allSelected;
        }
    },
    {
        name: '货运车辆',
        description: '选择“营业货车”和/或“挂车”',
        matchFunction: (selected) => {
            const freight = ['营业货车', '挂车'];
            const allFreight = Array.from(selected).every(item => freight.includes(item));
            return selected.size > 0 && allFreight;
        }
    },
    {
        name: '非营货车',
        description: '仅选择“非营业货车”',
        matchFunction: (selected) => selected.size === 1 && selected.has('非营业货车')
    },
    {
        name: '特种车辆',
        description: '仅选择“特种车”',
        matchFunction: (selected) => selected.size === 1 && selected.has('特种车')
    },
    {
        name: '摩托车业务',
        description: '仅选择“摩托车”',
        matchFunction: (selected) => selected.size === 1 && selected.has('摩托车')
    },
    {
        name: '不含摩托车',
        description: '选择除“摩托车”以外的所有客户类别',
        matchFunction: (selected, all) => {
            const withoutMotorcycle = all.filter(item => item !== '摩托车');
            return !selected.has('摩托车') && selected.size === withoutMotorcycle.length;
        }
    }
];

export const chartData = [
  { week_number: 1, signed_premium_yuan: 200000, reported_claim_payment_yuan: 120000 },
  { week_number: 2, signed_premium_yuan: 220000, reported_claim_payment_yuan: 130000 },
  { week_number: 3, signed_premium_yuan: 250000, reported_claim_payment_yuan: 140000 },
  { week_number: 4, signed_premium_yuan: 230000, reported_claim_payment_yuan: 150000 },
  { week_number: 5, signed_premium_yuan: 280000, reported_claim_payment_yuan: 160000 },
  { week_number: 6, signed_premium_yuan: 300000, reported_claim_payment_yuan: 170000 },
];

export const kpiListForAI = (Object.values(kpiMeta) as { title: string }[]).map(k => k.title);

// Flatten all filter options into a single array for the AI
export const availableFiltersForAI = Object.values(filterOptions).flat();

export const historicalUserBehaviorForAI = "用户经常在查看'成都'地区的'商业险'后，关注'赔付率'和'承保利润率'。";
