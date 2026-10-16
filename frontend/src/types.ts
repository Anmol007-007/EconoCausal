export type ScreenTab =
  | 'upload-pipeline'
  | 'causal-diagnostics'
  | 'uplift-qini'
  | 'budget-allocation'
  | 'executive-summary-drift';

export interface CustomerRecord {
  cust_id: string;
  past_spend: number;
  recency_days: number;
  loyalty_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  category_affinity: number;
  age: number;
  discount: 0 | 10 | 20;
  purchase: 0 | 1;
  true_effect: number;
  optimal_discount?: 0 | 10 | 20;
  expected_profit?: number;
  quadrant?: 'Persuadable' | 'Sure Thing' | 'Lost Cause' | 'Sleeping Dog';
}

export interface DecileRow {
  decile: string;
  population_size: number;
  base_rate: number;
  treated_rate: number;
  ite: number;
  ite_se: number;
  cumulative_qini: number;
  net_profit_unit: number;
  quadrant: string;
}

export interface RefuterTest {
  id: string;
  name: string;
  icon: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  status: 'PASSED' | 'EVALUATING';
}

export interface DriftMetric {
  feature: string;
  domain: string;
  psi: number;
  ks: number;
  pValue: number;
  status: 'Stable' | 'Mild Shift' | 'Critical Drift';
}

export interface MicroserviceEndpoint {
  method: 'POST' | 'GET';
  path: string;
  status: string;
  latency: string;
  p99OrSla: string;
  description: string;
}
