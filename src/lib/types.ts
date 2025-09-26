export type KPIKey = 'signedPremium' | 'maturedLossRatio' | 'expenseRatio' | 'maturedMarginalContributionRate';

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
  regions: string[];
  insuranceTypes: string[];
  businessTypes: string[];
  newEnergyStatus: string[];
  weekNumbers: string[];
  transferredStatus: string[];
  coverageTypes: string[];
};

export type Filters = {
  year: string | null;
  region: string | null;
  weekNumber: string | null;
  businessTypes: string[] | null;
  insuranceTypes: string[] | null;
  newEnergyStatus: string[] | null;
  transferredStatus: string[] | null;
  coverageTypes: string[] | null;
}

export type RawDataRow = {
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

export type ChartDataPoint = {
  week_number: number;
  signed_premium_yuan: number;
  reported_claim_payment_yuan: number;
};
