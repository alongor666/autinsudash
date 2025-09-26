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
  years: ['2025', '2024', '2023'],
  regions: ['天府', '高新', '青羊', '宜宾', '德阳', '新都', '乐山', '金牛', '武侯', '锦江', '成华', '双流', '温江'],
  insuranceTypes: ['交强险', '商业保险'],
  businessTypes: [
    '非营业客车旧车非过户',
    '非营业货车旧车',
    '非营业客车旧车过户车',
    '2吨以下营业货车',
    '2-9吨营业货车',
    '10吨以上-牵引',
    '自卸',
    '10吨以上-普货',
    '9-10吨营业货车',
    '非营业客车新车',
    '摩托车',
    '特种车',
    '非营业货车新车',
    '其他',
    '网约车',
    '出租车'
  ],
  newEnergyStatus: ['是', '否'],
  weekNumbers: [],
  transferredStatus: ['是', '否'],
  coverageTypes: ['交三', '主全', '单交'],
};

// 业务类型组合规则基于真实数据更新 - 2025-09-26
export const businessTypeCombinations: BusinessTypeAlias[] = [
    {
        name: '货车',
        description: '选择所有货车相关类型',
        matchFunction: (selected) => {
            const truckTypes = [
                '10吨以上-普货',
                '10吨以上-牵引',
                '2-9吨营业货车',
                '2吨以下营业货车',
                '9-10吨营业货车',
                '非营业货车新车',
                '非营业货车旧车'
            ];
            const hasTruckTypes = truckTypes.every(type => selected.has(type));
            return selected.size === truckTypes.length && hasTruckTypes;
        }
    },
    {
        name: '大货车',
        description: '选择"10吨以上-普货"、"10吨以上-牵引"、"9-10吨营业货车"',
        matchFunction: (selected) => {
            const bigTruckTypes = ['10吨以上-普货', '10吨以上-牵引', '9-10吨营业货车'];
            const hasBigTruckTypes = bigTruckTypes.every(type => selected.has(type));
            return selected.size === bigTruckTypes.length && hasBigTruckTypes;
        }
    },
    {
        name: '小货车',
        description: '选择"非营业货车新车"、"2吨以下营业货车"、"非营业货车旧车"',
        matchFunction: (selected) => {
            const smallTruckTypes = ['非营业货车新车', '2吨以下营业货车', '非营业货车旧车'];
            const hasSmallTruckTypes = smallTruckTypes.every(type => selected.has(type));
            return selected.size === smallTruckTypes.length && hasSmallTruckTypes;
        }
    },
    {
        name: '非营业客车',
        description: '选择所有非营业客车类型',
        matchFunction: (selected) => {
            const nonCommercialCarTypes = [
                '非营业客车旧车非过户',
                '非营业客车旧车过户车',
                '非营业客车新车非过户',
                '非营业客车新车过户车'
            ];
            const hasCarTypes = nonCommercialCarTypes.every(type => selected.has(type));
            return selected.size === nonCommercialCarTypes.length && hasCarTypes;
        }
    },
    {
        name: '营业货车',
        description: '选择所有营业货车类型',
        matchFunction: (selected) => {
            const commercialTruckTypes = [
                '2吨以下营业货车',
                '2-9吨营业货车',
                '9-10吨营业货车',
                '10吨以上-普货',
                '10吨以上-牵引'
            ];
            const hasCommercialTruckTypes = commercialTruckTypes.every(type => selected.has(type));
            return selected.size === commercialTruckTypes.length && hasCommercialTruckTypes;
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
