export type ScreenTab =
  | 'upload-pipeline'
  | 'causal-diagnostics'
  | 'uplift-qini'
  | 'budget-allocation'
  | 'executive-summary-drift'
  | 'live-metrics'
  | 'model-comparison'
  | 'shap-explainability'
  | 'segment-explorer'
  | 'roi-simulator';

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

export type Theme = 'light' | 'dark';

export interface ShapFeatureImportance {
  feature: string;
  mean_abs_shap: number;
  direction: 'positive' | 'negative';
  description: string;
  impact_level: 'High' | 'Medium' | 'Low';
  relative_weight: number;
}

export interface CustomerSegment {
  quadrant: 'Persuadable' | 'Sure Thing' | 'Lost Cause' | 'Sleeping Dog';
  count: number;
  percentage: number;
  avg_uplift: number;
  avg_past_spend: number;
  avg_recency: number;
  recommended_action: string;
  risk_profile: 'Low' | 'Medium' | 'High' | 'Severe';
  projected_roi: number;
}

export interface LiveMetric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  icon: string;
  status: 'healthy' | 'warning' | 'alert' | 'neutral';
  category: 'system' | 'ml' | 'business';
}

export interface ModelBenchmarkResult {
  learner: string;
  displayName: string;
  pehe: number;
  auqc: number;
  qini_score: number;
  training_time_s: number;
  inference_time_ms: number;
  ram_usage_mb: number;
  robustness_score: number;
  is_winner?: boolean;
}

export interface RoiScenario {
  scenario_id: string;
  name: string;
  budget: number;
  unit_margin: number;
  targeting_strategy: 'persuadables_only' | 'top_decile' | 'all_customers';
  discount_depth: 10 | 20;
  customers_targeted: number;
  projected_incremental_revenue: number;
  net_incremental_profit: number;
  projected_roi_pct: number;
  risk_adjusted_profit: number;
}

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  category: 'pipeline' | 'drift' | 'budget' | 'model';
}

export interface UserPreferences {
  defaultBudget: number;
  defaultUnitMargin: number;
  defaultCurrency: string;
  confidenceAlpha: number;
  enableSoundAlerts: boolean;
  autoRefreshStream: boolean;
  exportFormat: 'csv' | 'json' | 'pdf';
}
