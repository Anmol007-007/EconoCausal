import { CustomerRecord, DecileRow, DriftMetric, MicroserviceEndpoint, RefuterTest } from './types.ts';

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
    metricValue: '< 0.3% Drift',
    status: 'PASSED'
  },
  {
    id: 'data_subset',
    name: 'Data Subset Refuter',
    icon: 'splitscreen',
    description: 'Repeats Double ML nuisance cross-fitting on 10 random 80% splits to check sample stability.',
    metricLabel: 'Effect Variance:',
    metricValue: '±0.002 (CI 95%)',
    status: 'PASSED'
  },
  {
    id: 'unobserved_sensitivity',
    name: 'Unobserved Sensitivity',
    icon: 'visibility_off',
    description: 'Oster/Rosenbaum bound calculation: hidden confounder strength needed to overturn lift.',
    metricLabel: 'Critical Gamma:',
    metricValue: '> 2.85 (Resistant)',
    status: 'PASSED'
  }
];

export const DRIFT_METRICS_7D: DriftMetric[] = [
  { feature: 'past_spend', domain: 'Continuous ($)', psi: 0.042, ks: 0.031, pValue: 0.48, status: 'Stable' },
  { feature: 'recency_days', domain: 'Continuous (Days)', psi: 0.061, ks: 0.042, pValue: 0.32, status: 'Stable' },
  { feature: 'loyalty_tier', domain: 'Categorical (Ord)', psi: 0.028, ks: 0.021, pValue: 0.71, status: 'Stable' },
  { feature: 'category_affinity', domain: 'Vector Density', psi: 0.082, ks: 0.054, pValue: 0.18, status: 'Mild Shift' },
  { feature: 'ITE ($10 Promo)', domain: 'Causal Estimand τ(x)', psi: 0.051, ks: 0.039, pValue: 0.36, status: 'Stable' },
  { feature: 'ITE ($20 Promo)', domain: 'Causal Estimand τ(x)', psi: 0.064, ks: 0.044, pValue: 0.27, status: 'Stable' }
];

export const DRIFT_METRICS_30D: DriftMetric[] = [
  { feature: 'past_spend', domain: 'Continuous ($)', psi: 0.053, ks: 0.038, pValue: 0.39, status: 'Stable' },
  { feature: 'recency_days', domain: 'Continuous (Days)', psi: 0.078, ks: 0.049, pValue: 0.24, status: 'Stable' },
  { feature: 'loyalty_tier', domain: 'Categorical (Ord)', psi: 0.035, ks: 0.025, pValue: 0.62, status: 'Stable' },
  { feature: 'category_affinity', domain: 'Vector Density', psi: 0.096, ks: 0.068, pValue: 0.11, status: 'Mild Shift' },
  { feature: 'ITE ($10 Promo)', domain: 'Causal Estimand τ(x)', psi: 0.059, ks: 0.045, pValue: 0.31, status: 'Stable' },
  { feature: 'ITE ($20 Promo)', domain: 'Causal Estimand τ(x)', psi: 0.071, ks: 0.051, pValue: 0.22, status: 'Stable' }
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
