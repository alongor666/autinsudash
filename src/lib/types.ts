export type KPIKey = 'totalPremium' | 'lossRatio' | 'underwritingProfitMargin' | 'customerCount';

export type Kpi = {
  id: KPIKey;
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  description: string;
};

export type FilterOptions = {
  years: string[];
  months: string[];
  quarters: string[];
  regions: string[];
  insuranceTypes: string[];
};
