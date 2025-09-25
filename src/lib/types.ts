export type Kpi = {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  description: string;
};

export type FilterOptions = {
  years: string[];
  weeks: string[];
  orgLevels: string[];
  cities: string[];
  insuranceTypes: string[];
  policyTypes: string[];
  renewalStatus: string[];
  vehicleTypes: string[];
};
