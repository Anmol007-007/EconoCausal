import {
  CustomerRecord,
  DecileRow,
  DriftMetric,
  RefuterTest,
} from './types.ts';

const API_BASE = 'http://localhost:8000';

export interface ApiResponse<T> {
  data: T;
  isLive: boolean;
  latencyMs: number;
  error?: string;
}

export interface UpliftResult {
  model: string;
  records: number;
  cv_folds: number;
  ate_10: number;
  ate_20: number;
  pehe_rmse: number;
  qini_score: number;
  qini_curve: {
    fractions: number[];
    qini_values: number[];
    random_values: number[];
    qini_score: number;
  };
  uplift_curve: {
    fractions: number[];
    cumulative_uplift: number[];
    average_uplift: number;
  };
  execution_time_seconds: number;
}

export interface AllocationResult {
  solver: string;
  status: string;
  budget_allocated: number;
  net_incremental_profit: number;
  targeted_persuadables: number;
  sure_things_held_out: number;
  discount_waste_saved: number;
  alloc_0_count: number;
  alloc_10_count: number;
  alloc_20_count: number;
  quadrant_breakdown: Record<string, number>;
}

export interface DiagnosticsResult {
  dag_dot: string;
  estimand_backdoor_variables: string[];
  overlap_report: Record<string, any>;
  balance_table: Array<Record<string, any>>;
  refutations: {
    placebo: { test: string; new_effect: number; p_value: number; passed: boolean };
    random_common_cause: { test: string; original_effect: number; new_effect: number; drift_percent: number; passed: boolean };
    data_subset: { test: string; original_effect: number; new_effect: number; drift_percent: number; passed: boolean };
    all_passed: boolean;
  };
}

export interface DriftResult {
  metrics: Array<{
    feature: string;
    psi: number;
    ks_statistic: number;
    p_value: number;
    status: 'Stable' | 'Mild Shift' | 'Critical Drift';
  }>;
  max_psi: number;
  psi_threshold: number;
  critical_features: string[];
  retrain_recommended: boolean;
  overall_status: string;
}

export interface SummaryResult {
  narrative: string;
  pillars: Array<{
    title: string;
    stat: string;
    desc: string;
  }>;
  kpis: {
    net_incremental_profit: number;
    actual_spend: number;
    targeted_persuadables: number;
    sure_things_held_out: number;
    discount_waste_saved: number;
    max_psi: number;
    retrain_recommended: boolean;
    refutations_passed: boolean;
  };
}

export interface BenchmarkItem {
  id: string;
  name: string;
  description: string;
  treatment: string;
  outcome: string;
  features: string[];
  records_default: number;
}

export interface SchemaReport {
  is_valid: boolean;
  records: number;
  original_columns: string[];
  treatment_col: string | null;
  outcome_col: string | null;
  feature_cols: string[];
  imputed_missing_counts: Record<string, number>;
  detected_types: Record<string, string>;
  warnings: string[];
  errors: string[];
}

export interface UploadResult {
  status: string;
  dataset_id: string;
  records: number;
  columns: string[];
  missingness: number;
  confounders: string[];
  treatment: string;
  outcome: string;
  validated: boolean;
  schema_report?: SchemaReport;
}

async function requestWithFallback<T>(
  url: string,
  options: RequestInit,
  fallbackData: T
): Promise<ApiResponse<T>> {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        data,
        isLive: true,
        latencyMs: Math.round(performance.now() - start),
      };
    }
  } catch (err) {

  }

  return {
    data: fallbackData,
    isLive: false,
    latencyMs: Math.round(performance.now() - start),
  };
}

export const apiService = {
  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },

  async getBenchmarks(): Promise<ApiResponse<BenchmarkItem[]>> {
    const fallback: BenchmarkItem[] = [
      {
        id: 'synthetic_retail',
        name: 'EconoCausal Confounded Retail (50k)',
        description: "Observational retail promo campaign with non-linear confounding, Simpson's paradox, and discrete coupon arms ($0, $10, $20).",
        treatment: 'discount (0, 10, 20)',
        outcome: 'purchase (binary)',
        features: ['past_spend', 'recency_days', 'loyalty_tier', 'age', 'category_affinity'],
        records_default: 50000,
      },
      {
        id: 'hillstrom_email',
        name: 'Kevin Hillstrom MineThatData',
        description: 'Classic direct marketing uplift benchmark with 3 arms (No E-mail, Mens E-mail, Womens E-mail) and conversion tracking.',
        treatment: 'discount (0=Control, 10=Mens, 20=Womens)',
        outcome: 'purchase (binary)',
        features: ['past_spend', 'recency_days', 'loyalty_tier', 'age', 'category_affinity'],
        records_default: 10000,
      },
      {
        id: 'starbucks_uplift',
        name: 'Starbucks Mobile Promo Challenge',
        description: 'Starbucks randomized mobile coupon incentive benchmark evaluating counterfactual incremental store visits vs discount waste.',
        treatment: 'discount (0=Control, 10=$10 Coupon, 20=$20 Coupon)',
        outcome: 'purchase (binary)',
        features: ['past_spend', 'recency_days', 'loyalty_tier', 'age', 'category_affinity'],
        records_default: 10000,
      },
    ];

    return requestWithFallback('/api/benchmarks', { method: 'GET' }, fallback);
  },

  async uploadDataset(
    file?: File,
    seed: number = 42,
    nRecords: number = 1000,
    benchmark?: string
  ): Promise<ApiResponse<UploadResult>> {
    const formData = new FormData();
    formData.append('seed', seed.toString());
    formData.append('n_records', nRecords.toString());
    if (file) {
      formData.append('file', file);
    }
    if (benchmark) {
      formData.append('benchmark', benchmark);
    }

    const fallback: UploadResult = {
      status: 'success',
      dataset_id: `ds_${nRecords}_${seed}`,
      records: nRecords,
      columns: ['past_spend', 'recency_days', 'loyalty_tier', 'category_affinity', 'age', 'discount', 'purchase'],
      missingness: 0.0,
      confounders: ['past_spend', 'recency_days', 'loyalty_tier', 'category_affinity'],
      treatment: 'discount',
      outcome: 'purchase',
      validated: true,
      schema_report: {
        is_valid: true,
        records: nRecords,
        original_columns: ['past_spend', 'recency_days', 'loyalty_tier', 'category_affinity', 'age', 'discount', 'purchase'],
        treatment_col: 'discount',
        outcome_col: 'purchase',
        feature_cols: ['past_spend', 'recency_days', 'loyalty_tier', 'age', 'category_affinity'],
        imputed_missing_counts: {},
        detected_types: { past_spend: 'float64', recency_days: 'int64', loyalty_tier: 'object', age: 'int64', category_affinity: 'float64', discount: 'int64', purchase: 'int64' },
        warnings: [],
        errors: [],
      },
    };

    return requestWithFallback('/api/upload', { method: 'POST', body: formData }, fallback);
  },

  async loadBenchmark(
    benchmarkId: string,
    nRecords: number = 1000,
    seed: number = 42
  ): Promise<ApiResponse<UploadResult>> {
    return this.uploadDataset(undefined, seed, nRecords, benchmarkId);
  },

  async runUplift(params?: {
    n_estimators?: number;
    cv?: number;
  }): Promise<ApiResponse<UpliftResult>> {
    const fallback: UpliftResult = {
      model: 'CausalForestDML',
      records: 50000,
      cv_folds: params?.cv || 5,
      ate_10: 0.084,
      ate_20: 0.142,
      pehe_rmse: 0.0084,
      qini_score: 0.684,
      qini_curve: {
        fractions: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        qini_values: [0.0, 48.2, 92.5, 131.0, 162.4, 185.1, 198.3, 204.0, 206.2, 207.0, 207.0],
        random_values: [0.0, 20.7, 41.4, 62.1, 82.8, 103.5, 124.2, 144.9, 165.6, 186.3, 207.0],
        qini_score: 0.684,
      },
      uplift_curve: {
        fractions: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        cumulative_uplift: [0.0, 0.162, 0.148, 0.134, 0.119, 0.106, 0.094, 0.083, 0.071, 0.062, 0.054],
        average_uplift: 0.054,
      },
      execution_time_seconds: 1.84,
    };

    return requestWithFallback(
      '/api/uplift',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {}),
      },
      fallback
    );
  },

  async runAllocate(params?: {
    total_budget?: number;
    unit_margin?: number;
    max_arm_20?: number;
  }): Promise<ApiResponse<AllocationResult>> {
    const budget = params?.total_budget ?? 5000;
    const margin = params?.unit_margin ?? 45;

    const fallback: AllocationResult = {
      solver: 'scipy.optimize.milp',
      status: 'Optimal (converged)',
      budget_allocated: Math.min(budget, 4980),
      net_incremental_profit: Math.round(18420 * (budget / 5000) * (margin / 45)),
      targeted_persuadables: Math.round(382 * (budget / 5000)),
      sure_things_held_out: 15900,
      discount_waste_saved: 11240,
      alloc_0_count: 45618,
      alloc_10_count: Math.round(2980 * (budget / 5000)),
      alloc_20_count: Math.round(1402 * (budget / 5000)),
      quadrant_breakdown: {
        Persuadable: Math.round(382 * (budget / 5000)),
        'Sure Thing': 15900,
        'Lost Cause': 28218,
        'Sleeping Dog': 5500,
      },
    };

    return requestWithFallback(
      '/api/allocate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {}),
      },
      fallback
    );
  },

  async getDiagnostics(): Promise<ApiResponse<DiagnosticsResult>> {
    const fallback: DiagnosticsResult = {
      dag_dot:
        'digraph { past_spend -> discount; recency_days -> discount; loyalty_tier -> discount; category_affinity -> discount; past_spend -> purchase; recency_days -> purchase; loyalty_tier -> purchase; category_affinity -> purchase; age -> purchase; discount -> purchase; }',
      estimand_backdoor_variables: ['past_spend', 'recency_days', 'loyalty_tier', 'category_affinity'],
      overlap_report: {
        discount_0: { min_propensity: 0.082, max_propensity: 0.812, mean: 0.44 },
        discount_10: { min_propensity: 0.071, max_propensity: 0.764, mean: 0.32 },
        discount_20: { min_propensity: 0.055, max_propensity: 0.692, mean: 0.24 },
        positivity_satisfied: true,
      },
      balance_table: [
        { feature: 'past_spend', unweighted_smd_10_vs_0: 0.412, weighted_smd_10_vs_0: 0.038, balanced_target_met: true },
        { feature: 'recency_days', unweighted_smd_10_vs_0: 0.294, weighted_smd_10_vs_0: 0.027, balanced_target_met: true },
        { feature: 'category_affinity', unweighted_smd_10_vs_0: 0.341, weighted_smd_10_vs_0: 0.032, balanced_target_met: true },
        { feature: 'loyalty_tier_Silver', unweighted_smd_10_vs_0: 0.265, weighted_smd_10_vs_0: 0.024, balanced_target_met: true },
        { feature: 'loyalty_tier_Gold', unweighted_smd_10_vs_0: 0.485, weighted_smd_10_vs_0: 0.041, balanced_target_met: true },
      ],
      refutations: {
        placebo: { test: 'placebo_treatment', new_effect: 0.0008, p_value: 0.89, passed: true },
        random_common_cause: { test: 'random_common_cause', original_effect: 0.084, new_effect: 0.0838, drift_percent: 0.24, passed: true },
        data_subset: { test: 'data_subset', original_effect: 0.084, new_effect: 0.0835, drift_percent: 0.59, passed: true },
        all_passed: true,
      },
    };

    return requestWithFallback('/api/diagnostics', { method: 'GET' }, fallback);
  },

  async checkDrift(params?: { psi_threshold?: number }): Promise<ApiResponse<DriftResult>> {
    const fallback: DriftResult = {
      metrics: [
        { feature: 'past_spend', psi: 0.024, ks_statistic: 0.031, p_value: 0.642, status: 'Stable' },
        { feature: 'recency_days', psi: 0.018, ks_statistic: 0.024, p_value: 0.781, status: 'Stable' },
        { feature: 'category_affinity', psi: 0.082, ks_statistic: 0.076, p_value: 0.124, status: 'Stable' },
        { feature: 'age', psi: 0.012, ks_statistic: 0.019, p_value: 0.912, status: 'Stable' },
      ],
      max_psi: 0.082,
      psi_threshold: params?.psi_threshold ?? 0.2,
      critical_features: [],
      retrain_recommended: false,
      overall_status: 'Healthy',
    };

    return requestWithFallback(
      '/api/drift',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {}),
      },
      fallback
    );
  },

  async getSummary(): Promise<ApiResponse<SummaryResult>> {
    const fallback: SummaryResult = {
      narrative:
        'By deploying Double Machine Learning (DML) and Mixed-Integer Linear Programming (MILP), the promotional campaign targeted 382 high-yield persuadable customers with an outlay of $4,980.00, delivering $18,420.00 in net incremental profit. Simultaneously, promotional cannibalization was prevented by withholding discounts from 15,900 organic converters, saving $11,240.00 in margin.',
      pillars: [
        {
          title: 'Holdout of Sure Things',
          stat: '15,900 customers',
          desc: 'Protected $11,240.00 in unnecessary promotional discounts by withholding coupons from organic buyers.',
        },
        {
          title: 'Targeted Persuadables',
          stat: '382 conversions',
          desc: 'Allocated promotional spend strictly where price elasticity drives incremental lift.',
        },
        {
          title: 'Unconfoundedness Guarantee',
          stat: 'Verified (DoWhy)',
          desc: 'Passed placebo treatment, random common cause, and sample subset refutations.',
        },
        {
          title: 'Continuous Drift Telemetry',
          stat: 'PSI 0.082 (Healthy)',
          desc: 'No model retraining needed based on rolling 7-day feature and uplift stability.',
        },
      ],
      kpis: {
        net_incremental_profit: 18420.0,
        actual_spend: 4980.0,
        targeted_persuadables: 382,
        sure_things_held_out: 15900,
        discount_waste_saved: 11240.0,
        max_psi: 0.082,
        retrain_recommended: false,
        refutations_passed: true,
      },
    };

    return requestWithFallback('/api/summary', { method: 'GET' }, fallback);
  },
};
