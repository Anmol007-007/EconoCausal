import {
  CustomerRecord,
  DecileRow,
  DriftMetric,
  MicroserviceEndpoint,
  RefuterTest,
  ShapFeatureImportance,
  CustomerSegment,
  LiveMetric,
  ModelBenchmarkResult,
  RoiScenario,
  AlertNotification,
  UserPreferences,
} from './types.ts';

export const INITIAL_CUSTOMERS: CustomerRecord[] = [
  { cust_id: 'C-00001', past_spend: 142.50, recency_days: 14, loyalty_tier: 'Gold', category_affinity: 0.82, age: 34, discount: 10, purchase: 1, true_effect: 0.182, optimal_discount: 10, expected_profit: 38.20, quadrant: 'Persuadable' },
  { cust_id: 'C-00002', past_spend: 28.10, recency_days: 92, loyalty_tier: 'Bronze', category_affinity: 0.19, age: 58, discount: 0, purchase: 0, true_effect: 0.041, optimal_discount: 0, expected_profit: 0.00, quadrant: 'Lost Cause' },
  { cust_id: 'C-00003', past_spend: 310.85, recency_days: 6, loyalty_tier: 'Gold', category_affinity: 0.94, age: 29, discount: 20, purchase: 1, true_effect: 0.295, optimal_discount: 0, expected_profit: -14.20, quadrant: 'Sure Thing' },
  { cust_id: 'C-00004', past_spend: 74.20, recency_days: 45, loyalty_tier: 'Silver', category_affinity: 0.47, age: 42, discount: 0, purchase: 0, true_effect: 0.088, optimal_discount: 10, expected_profit: 26.40, quadrant: 'Persuadable' },
  { cust_id: 'C-00005', past_spend: 189.00, recency_days: 21, loyalty_tier: 'Silver', category_affinity: 0.63, age: 37, discount: 10, purchase: 1, true_effect: 0.144, optimal_discount: 10, expected_profit: 31.10, quadrant: 'Persuadable' },
  { cust_id: 'C-00006', past_spend: 412.00, recency_days: 3, loyalty_tier: 'Platinum', category_affinity: 0.98, age: 49, discount: 20, purchase: 1, true_effect: 0.002, optimal_discount: 0, expected_profit: -18.50, quadrant: 'Sure Thing' },
  { cust_id: 'C-00007', past_spend: 52.30, recency_days: 68, loyalty_tier: 'Bronze', category_affinity: 0.22, age: 63, discount: 10, purchase: 0, true_effect: -0.046, optimal_discount: 0, expected_profit: -24.80, quadrant: 'Sleeping Dog' },
  { cust_id: 'C-00008', past_spend: 96.80, recency_days: 38, loyalty_tier: 'Silver', category_affinity: 0.51, age: 31, discount: 0, purchase: 0, true_effect: 0.213, optimal_discount: 20, expected_profit: 42.50, quadrant: 'Persuadable' },
  { cust_id: 'C-00009', past_spend: 230.15, recency_days: 18, loyalty_tier: 'Gold', category_affinity: 0.77, age: 44, discount: 10, purchase: 1, true_effect: 0.165, optimal_discount: 10, expected_profit: 28.90, quadrant: 'Persuadable' },
  { cust_id: 'C-00010', past_spend: 15.00, recency_days: 120, loyalty_tier: 'Bronze', category_affinity: 0.08, age: 71, discount: 0, purchase: 0, true_effect: 0.005, optimal_discount: 0, expected_profit: 0.00, quadrant: 'Lost Cause' },
  { cust_id: 'C-00011', past_spend: 165.40, recency_days: 28, loyalty_tier: 'Silver', category_affinity: 0.61, age: 39, discount: 20, purchase: 1, true_effect: 0.284, optimal_discount: 20, expected_profit: 44.80, quadrant: 'Persuadable' },
  { cust_id: 'C-00012', past_spend: 290.00, recency_days: 8, loyalty_tier: 'Gold', category_affinity: 0.88, age: 52, discount: 0, purchase: 1, true_effect: 0.015, optimal_discount: 0, expected_profit: -8.10, quadrant: 'Sure Thing' },
  { cust_id: 'C-00013', past_spend: 88.50, recency_days: 52, loyalty_tier: 'Bronze', category_affinity: 0.35, age: 26, discount: 10, purchase: 1, true_effect: 0.198, optimal_discount: 10, expected_profit: 34.20, quadrant: 'Persuadable' },
  { cust_id: 'C-00014', past_spend: 42.10, recency_days: 85, loyalty_tier: 'Bronze', category_affinity: 0.12, age: 60, discount: 20, purchase: 0, true_effect: -0.038, optimal_discount: 0, expected_profit: -22.00, quadrant: 'Sleeping Dog' },
  { cust_id: 'C-00015', past_spend: 340.90, recency_days: 12, loyalty_tier: 'Platinum', category_affinity: 0.91, age: 45, discount: 10, purchase: 1, true_effect: 0.032, optimal_discount: 0, expected_profit: -5.40, quadrant: 'Sure Thing' },
  { cust_id: 'C-00016', past_spend: 115.70, recency_days: 34, loyalty_tier: 'Silver', category_affinity: 0.58, age: 33, discount: 10, purchase: 1, true_effect: 0.225, optimal_discount: 20, expected_profit: 46.10, quadrant: 'Persuadable' },
  { cust_id: 'C-00017', past_spend: 19.80, recency_days: 110, loyalty_tier: 'Bronze', category_affinity: 0.15, age: 68, discount: 0, purchase: 0, true_effect: 0.008, optimal_discount: 0, expected_profit: 0.00, quadrant: 'Lost Cause' },
  { cust_id: 'C-00018', past_spend: 215.30, recency_days: 22, loyalty_tier: 'Gold', category_affinity: 0.72, age: 41, discount: 20, purchase: 1, true_effect: 0.180, optimal_discount: 10, expected_profit: 32.50, quadrant: 'Persuadable' },
  { cust_id: 'C-00019', past_spend: 64.90, recency_days: 41, loyalty_tier: 'Silver', category_affinity: 0.49, age: 36, discount: 0, purchase: 0, true_effect: 0.192, optimal_discount: 10, expected_profit: 29.80, quadrant: 'Persuadable' },
  { cust_id: 'C-00020', past_spend: 480.00, recency_days: 2, loyalty_tier: 'Platinum', category_affinity: 0.99, age: 55, discount: 0, purchase: 1, true_effect: 0.001, optimal_discount: 0, expected_profit: -20.00, quadrant: 'Sure Thing' }
];

export const DECILE_DATA: DecileRow[] = [
  { decile: 'Decile 1 (Top 10%)', population_size: 5000, base_rate: 11.2, treated_rate: 39.6, ite: 28.4, ite_se: 0.012, cumulative_qini: 0.284, net_profit_unit: 38.20, quadrant: 'Persuadable' },
  { decile: 'Decile 2 (10% - 20%)', population_size: 5000, base_rate: 14.8, treated_rate: 36.1, ite: 21.3, ite_se: 0.014, cumulative_qini: 0.497, net_profit_unit: 26.40, quadrant: 'Persuadable' },
  { decile: 'Decile 3 (20% - 30%)', population_size: 5000, base_rate: 28.4, treated_rate: 37.2, ite: 8.8, ite_se: 0.016, cumulative_qini: 0.585, net_profit_unit: 8.10, quadrant: 'Marginal Target' },
  { decile: 'Decile 4 (30% - 40%)', population_size: 5000, base_rate: 54.0, treated_rate: 56.2, ite: 2.2, ite_se: 0.011, cumulative_qini: 0.607, net_profit_unit: -4.30, quadrant: 'Sure Thing' },
  { decile: 'Deciles 5 - 9 (40% - 90%)', population_size: 25000, base_rate: 2.1, treated_rate: 2.3, ite: 0.2, ite_se: 0.005, cumulative_qini: 0.684, net_profit_unit: -12.40, quadrant: 'Lost Causes' },
  { decile: 'Decile 10 (Bottom 10%)', population_size: 5000, base_rate: 22.4, treated_rate: 17.8, ite: -4.6, ite_se: 0.015, cumulative_qini: 0.638, net_profit_unit: -24.80, quadrant: 'Sleeping Dogs' }
];

export const REFUTER_SUITE: RefuterTest[] = [
  {
    id: 'placebo',
    name: 'Placebo Treatment',
    icon: 'shuffle',
    description: 'Replaces treatment arm vector with independent random noise. Non-zero effect rejects identification.',
    metricLabel: 'Estimated Effect:',
    metricValue: '+0.0004 (p = 0.89)',
    status: 'PASSED'
  },
  {
    id: 'random_common_cause',
    name: 'Random Common Cause',
    icon: 'grain',
    description: 'Adds synthetic orthogonal noise variables into covariate matrix W to test estimator stability.',
    metricLabel: 'Estimate Shift:',
    metricValue: '-0.0011 (Δ < 1%)',
    status: 'PASSED'
  },
  {
    id: 'data_subset',
    name: 'Data Subset Refuter',
    icon: 'pie_chart',
    description: 'Re-estimates causal forest parameters across random 80% subsamples over 10 cross-validation folds.',
    metricLabel: 'Subset Variance:',
    metricValue: '±0.0032 (Robust)',
    status: 'PASSED'
  }
];

export const DRIFT_METRICS: DriftMetric[] = [
  { feature: 'past_spend', domain: 'Financial', psi: 0.038, ks: 0.024, pValue: 0.42, status: 'Stable' },
  { feature: 'recency_days', domain: 'Engagement', psi: 0.052, ks: 0.031, pValue: 0.28, status: 'Stable' },
  { feature: 'category_affinity', domain: 'Behavioral', psi: 0.128, ks: 0.065, pValue: 0.048, status: 'Mild Shift' },
  { feature: 'loyalty_tier', domain: 'Profile', psi: 0.015, ks: 0.012, pValue: 0.76, status: 'Stable' },
  { feature: 'predicted_uplift', domain: 'Model Output', psi: 0.044, ks: 0.029, pValue: 0.35, status: 'Stable' }
];

export const DRIFT_METRICS_7D: DriftMetric[] = [
  { feature: 'past_spend', domain: 'Financial', psi: 0.038, ks: 0.024, pValue: 0.42, status: 'Stable' },
  { feature: 'recency_days', domain: 'Engagement', psi: 0.052, ks: 0.031, pValue: 0.28, status: 'Stable' },
  { feature: 'category_affinity', domain: 'Behavioral', psi: 0.064, ks: 0.038, pValue: 0.22, status: 'Stable' },
  { feature: 'loyalty_tier', domain: 'Profile', psi: 0.015, ks: 0.012, pValue: 0.76, status: 'Stable' },
  { feature: 'predicted_uplift', domain: 'Model Output', psi: 0.044, ks: 0.029, pValue: 0.35, status: 'Stable' }
];

export const DRIFT_METRICS_30D: DriftMetric[] = [
  { feature: 'past_spend', domain: 'Financial', psi: 0.082, ks: 0.048, pValue: 0.14, status: 'Stable' },
  { feature: 'recency_days', domain: 'Engagement', psi: 0.094, ks: 0.056, pValue: 0.08, status: 'Stable' },
  { feature: 'category_affinity', domain: 'Behavioral', psi: 0.185, ks: 0.082, pValue: 0.021, status: 'Mild Shift' },
  { feature: 'loyalty_tier', domain: 'Profile', psi: 0.028, ks: 0.019, pValue: 0.65, status: 'Stable' },
  { feature: 'predicted_uplift', domain: 'Model Output', psi: 0.091, ks: 0.052, pValue: 0.11, status: 'Stable' }
];

export const MICROSERVICE_ENDPOINTS: MicroserviceEndpoint[] = [
  { method: 'POST', path: '/upload', status: '200 OK', latency: '210ms', p99OrSla: 'p99: 310ms', description: 'Parquet schema validate' },
  { method: 'POST', path: '/uplift', status: '200 OK', latency: '1.84s', p99OrSla: '< 3.0s NFR', description: 'EconML CausalForestDML' },
  { method: 'POST', path: '/allocate', status: '200 OK', latency: '420ms', p99OrSla: 'MILP converged', description: 'SciPy Branch-and-Bound' },
  { method: 'GET', path: '/diagnostics', status: '200 OK', latency: '85ms', p99OrSla: 'Cached (Redis)', description: 'DoWhy identification DAG' },
  { method: 'POST', path: '/drift', status: '200 OK', latency: '340ms', p99OrSla: 'KS-test vectorized', description: 'PSI 10-quantile matrix' }
];

export function computeMilpAllocation(totalBudget: number, unitMargin: number = 45) {
  const ratio = totalBudget / 5000;
  const targetedPersuadables = Math.min(11200, Math.round(382 * Math.pow(ratio, 0.72)));
  const purchasesCaptured = Math.round(targetedPersuadables * 1.07);
  const grossProfit = purchasesCaptured * unitMargin;
  const netProfit = Math.round(grossProfit - totalBudget);
  const sureThingsSaved = Math.round(15900 * Math.min(1.0, 0.95 + ratio * 0.02));
  const discountWasteSaved = Math.round(11240 * (1 + (ratio - 1) * 0.15));
  const costEfficiencyGain = Math.round(156 * Math.pow(1 / Math.max(0.3, ratio), 0.25));

  const alloc20 = Math.min(2000, Math.round(totalBudget * 0.45 / 20));
  const alloc10 = Math.min(4000, Math.round((totalBudget - alloc20 * 20) / 10));
  const alloc0 = 50000 - alloc20 - alloc10;

  return {
    targetedPersuadables,
    purchasesCaptured,
    netProfit,
    sureThingsSaved,
    discountWasteSaved,
    costEfficiencyGain,
    alloc0,
    alloc10,
    alloc20,
    actualSpend: alloc10 * 10 + alloc20 * 20
  };
}

export const SHAP_IMPORTANCE_DATA: ShapFeatureImportance[] = [
  {
    feature: 'past_spend',
    mean_abs_shap: 0.0842,
    direction: 'positive',
    description: 'Higher previous customer expenditure increases price sensitivity elasticity in promotional campaigns.',
    impact_level: 'High',
    relative_weight: 38.4,
  },
  {
    feature: 'recency_days',
    mean_abs_shap: 0.0615,
    direction: 'negative',
    description: 'Lapsed customers (recency > 60 days) exhibit dampened uplift response to promotional discounts.',
    impact_level: 'High',
    relative_weight: 27.6,
  },
  {
    feature: 'category_affinity',
    mean_abs_shap: 0.0398,
    direction: 'positive',
    description: 'Deep affinity for target catalog categories significantly magnifies coupon conversion probabilities.',
    impact_level: 'Medium',
    relative_weight: 18.2,
  },
  {
    feature: 'age',
    mean_abs_shap: 0.0210,
    direction: 'positive',
    description: 'Middle-age cohort demographics (30-48 years) demonstrate peak conditional treatment effects.',
    impact_level: 'Medium',
    relative_weight: 9.8,
  },
  {
    feature: 'loyalty_tier',
    mean_abs_shap: 0.0132,
    direction: 'negative',
    description: 'High-tier loyalty members (Platinum) already purchase organically; discounting yields negative net incrementality.',
    impact_level: 'Low',
    relative_weight: 6.0,
  },
];

export const SHAP_WATERFALL_SAMPLE = {
  customer_id: 'C-00001 (Gold Tier)',
  base_value: 0.052,
  final_cate: 0.182,
  contributions: [
    { feature: 'past_spend = $142.50', value: +0.071, cumulative: 0.123 },
    { feature: 'category_affinity = 0.82', value: +0.048, cumulative: 0.171 },
    { feature: 'recency_days = 14', value: +0.024, cumulative: 0.195 },
    { feature: 'age = 34', value: +0.009, cumulative: 0.204 },
    { feature: 'loyalty_tier = Gold', value: -0.022, cumulative: 0.182 },
  ],
};

export const CUSTOMER_SEGMENTS_DATA: CustomerSegment[] = [
  {
    quadrant: 'Persuadable',
    count: 11200,
    percentage: 22.4,
    avg_uplift: +0.214,
    avg_past_spend: 138.40,
    avg_recency: 24,
    recommended_action: 'Target with $10 or $20 coupon. Maximum incremental lift per dollar invested.',
    risk_profile: 'Low',
    projected_roi: 268.4,
  },
  {
    quadrant: 'Sure Thing',
    count: 15900,
    percentage: 31.8,
    avg_uplift: +0.012,
    avg_past_spend: 324.80,
    avg_recency: 7,
    recommended_action: 'Strictly withhold discounts. They convert organically; coupons cause deadweight loss.',
    risk_profile: 'High',
    projected_roi: -64.2,
  },
  {
    quadrant: 'Lost Cause',
    count: 18400,
    percentage: 36.8,
    avg_uplift: +0.008,
    avg_past_spend: 24.10,
    avg_recency: 98,
    recommended_action: 'Suppress from expensive channels. Low conversion elasticity regardless of discount.',
    risk_profile: 'Medium',
    projected_roi: -88.5,
  },
  {
    quadrant: 'Sleeping Dog',
    count: 4500,
    percentage: 9.0,
    avg_uplift: -0.042,
    avg_past_spend: 58.20,
    avg_recency: 72,
    recommended_action: 'Do not contact. Discounts trigger opt-outs, unsubscribes, or cart abandonment.',
    risk_profile: 'Severe',
    projected_roi: -142.0,
  },
];

export const MODEL_BENCHMARK_DATA: ModelBenchmarkResult[] = [
  {
    learner: 'CausalForestDML',
    displayName: 'CausalForestDML (Cross-Fitted LightGBM)',
    pehe: 0.0284,
    auqc: 0.412,
    qini_score: 0.684,
    training_time_s: 1.84,
    inference_time_ms: 12.4,
    ram_usage_mb: 245,
    robustness_score: 98.2,
    is_winner: true,
  },
  {
    learner: 'XLearner',
    displayName: 'X-Learner (Propensity-Weighted Double Stage)',
    pehe: 0.0492,
    auqc: 0.365,
    qini_score: 0.598,
    training_time_s: 2.45,
    inference_time_ms: 18.2,
    ram_usage_mb: 310,
    robustness_score: 87.5,
    is_winner: false,
  },
  {
    learner: 'TLearner',
    displayName: 'T-Learner (Two Separate Treatment Classifiers)',
    pehe: 0.0718,
    auqc: 0.298,
    qini_score: 0.512,
    training_time_s: 0.92,
    inference_time_ms: 9.1,
    ram_usage_mb: 180,
    robustness_score: 74.0,
    is_winner: false,
  },
  {
    learner: 'SLearner',
    displayName: 'S-Learner (Single Outcome Estimator with Treatment Dummy)',
    pehe: 0.1140,
    auqc: 0.215,
    qini_score: 0.420,
    training_time_s: 0.48,
    inference_time_ms: 6.4,
    ram_usage_mb: 140,
    robustness_score: 52.8,
    is_winner: false,
  },
];

export const LIVE_METRICS_DATA: LiveMetric[] = [
  {
    id: 'auqc',
    label: 'Model AUQC Score',
    value: '0.412',
    unit: 'score',
    trend: +4.8,
    icon: 'show_chart',
    status: 'healthy',
    category: 'ml',
  },
  {
    id: 'pehe',
    label: 'PEHE (Estimation RMSE)',
    value: '0.028',
    unit: 'rmse',
    trend: -12.4,
    icon: 'adjust',
    status: 'healthy',
    category: 'ml',
  },
  {
    id: 'roi',
    label: 'Incremental Net Profit',
    value: '$18,420',
    unit: 'USD',
    trend: +18.2,
    icon: 'trending_up',
    status: 'healthy',
    category: 'business',
  },
  {
    id: 'cannibalization',
    label: 'Sure Thing Margin Saved',
    value: '$11,240',
    unit: 'USD',
    trend: +8.5,
    icon: 'savings',
    status: 'healthy',
    category: 'business',
  },
  {
    id: 'throughput',
    label: 'Inference Throughput',
    value: '14,250',
    unit: 'records/sec',
    trend: +2.1,
    icon: 'speed',
    status: 'healthy',
    category: 'system',
  },
  {
    id: 'latency',
    label: 'API P95 Latency',
    value: '142',
    unit: 'ms',
    trend: -6.4,
    icon: 'timer',
    status: 'healthy',
    category: 'system',
  },
  {
    id: 'drift',
    label: 'Max Population PSI',
    value: '0.082',
    unit: 'PSI',
    trend: -1.2,
    icon: 'sync_alt',
    status: 'healthy',
    category: 'ml',
  },
  {
    id: 'node_ram',
    label: 'Cluster Memory Util',
    value: '38.4',
    unit: '%',
    trend: +1.5,
    icon: 'memory',
    status: 'healthy',
    category: 'system',
  },
];

export const ROI_SCENARIOS_DATA: RoiScenario[] = [
  {
    scenario_id: 'scen-conservative',
    name: 'Conservative ($2,500 Budget)',
    budget: 2500,
    unit_margin: 45,
    targeting_strategy: 'persuadables_only',
    discount_depth: 10,
    customers_targeted: 250,
    projected_incremental_revenue: 11250,
    net_incremental_profit: 8750,
    projected_roi_pct: 350.0,
    risk_adjusted_profit: 8120,
  },
  {
    scenario_id: 'scen-balanced',
    name: 'Balanced Recommended ($5,000 Budget)',
    budget: 5000,
    unit_margin: 45,
    targeting_strategy: 'persuadables_only',
    discount_depth: 10,
    customers_targeted: 382,
    projected_incremental_revenue: 23400,
    net_incremental_profit: 18420,
    projected_roi_pct: 368.4,
    risk_adjusted_profit: 17150,
  },
  {
    scenario_id: 'scen-aggressive',
    name: 'Aggressive Scale ($10,000 Budget)',
    budget: 10000,
    unit_margin: 45,
    targeting_strategy: 'persuadables_only',
    discount_depth: 20,
    customers_targeted: 620,
    projected_incremental_revenue: 37800,
    net_incremental_profit: 27800,
    projected_roi_pct: 278.0,
    risk_adjusted_profit: 24600,
  },
  {
    scenario_id: 'scen-naive',
    name: 'Naive Mass Blast ($10,000 Budget)',
    budget: 10000,
    unit_margin: 45,
    targeting_strategy: 'all_customers',
    discount_depth: 10,
    customers_targeted: 1000,
    projected_incremental_revenue: 9450,
    net_incremental_profit: -550,
    projected_roi_pct: -5.5,
    risk_adjusted_profit: -1800,
  },
];

export const SYSTEM_NOTIFICATIONS_DATA: AlertNotification[] = [
  {
    id: 'notif-1',
    title: 'Model Retraining Check Passed',
    message: 'Rolling 30-day drift telemetry verified. Maximum covariate PSI is 0.082 (Threshold: 0.20). No retraining required.',
    timestamp: '10 mins ago',
    severity: 'success',
    read: false,
    category: 'drift',
  },
  {
    id: 'notif-2',
    title: 'MILP Optimization Converged',
    message: 'Global optimum reached in 420ms using branch-and-cut. 382 persuadables allocated with zero discount leakage to Sure Things.',
    timestamp: '2 hours ago',
    severity: 'info',
    read: false,
    category: 'budget',
  },
  {
    id: 'notif-3',
    title: 'Unconfoundedness Verified',
    message: 'DoWhy refutation suite executed: Placebo treatment (p=0.89) and Random Common Cause passed within 1% shift bound.',
    timestamp: '1 day ago',
    severity: 'success',
    read: true,
    category: 'model',
  },
  {
    id: 'notif-4',
    title: 'Synthetic Stream Ingestion Complete',
    message: '50,000 customer records successfully loaded with non-linear propensity and ground-truth ITE labels.',
    timestamp: '2 days ago',
    severity: 'info',
    read: true,
    category: 'pipeline',
  },
];

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultBudget: 5000,
  defaultUnitMargin: 45,
  defaultCurrency: 'USD ($)',
  confidenceAlpha: 0.05,
  enableSoundAlerts: false,
  autoRefreshStream: true,
  exportFormat: 'csv',
};
