import type { Kpi, FilterOptions, KPIKey, BusinessTypeAlias } from './types';

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
  years: ['2024', '2023', '2022'],
  regions: ['成都', '绵阳', '德阳', '南充', '宜宾'],
  insuranceTypes: ['交强险', '商业险'],
  businessTypes: ['新车', '转保', '续保', '9吨及以上货车', '2吨及以下货车', '营业货车', '非营业客车', '非营业个人', '摩托车'],
  newEnergyStatus: ['是', '否'],
  weekNumbers: [],
  transferredStatus: [],
  coverageTypes: [],
};

export const businessTypeAliases: BusinessTypeAlias[] = [
    {
        name: '货车',
        description: '包含所有货车相关类型',
        matchFunction: (selected, all) => {
            const allTrucks = all.filter(t => t.includes('货车'));
            const selectedTrucks = Array.from(selected).filter(t => t.includes('货车'));
            return allTrucks.length > 0 && selectedTrucks.length === allTrucks.length && selected.size === allTrucks.length;
        }
    },
    {
        name: '大货车',
        description: '仅选择“9吨及以上货车”',
        matchFunction: (selected) => selected.size === 1 && selected.has('9吨及以上货车')
    },
    {
        name: '小货车',
        description: '仅选择“2吨及以下货车”',
        matchFunction: (selected) => selected.size === 1 && selected.has('2吨及以下货车')
    },
    {
        name: '营业货车',
        description: '包含所有“营业”属性的货车类型',
        matchFunction: (selected, all) => {
             const allCommercialTrucks = all.filter(t => t.includes('营业') && t.includes('货车'));
             const selectedCommercialTrucks = Array.from(selected).filter(t => t.includes('营业') && t.includes('货车'));
             return allCommercialTrucks.length > 0 && selectedCommercialTrucks.length === allCommercialTrucks.length && selected.size === allCommercialTrucks.length;
        }
    },
    {
        name: '非营业客车',
        description: '仅选择“非营业客车”',
        matchFunction: (selected) => selected.size === 1 && selected.has('非营业客车')
    },
    {
        name: '家自车',
        description: '仅选择“非营业个人”',
        matchFunction: (selected) => selected.size === 1 && selected.has('非营业个人')
    },
    {
        name: '不含摩托车',
        description: '选择了除“摩托车”以外的所有业务类型',
        matchFunction: (selected, all) => {
            const hasMotorcycle = selected.has('摩托车');
            const allWithoutMotorcycle = all.filter(t => t !== '摩托车');
            return !hasMotorcycle && selected.size === allWithoutMotorcycle.length;
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
