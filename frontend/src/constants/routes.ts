export const TABS = {
  UPLOAD_PIPELINE: 'upload-pipeline',
  CAUSAL_DIAGNOSTICS: 'causal-diagnostics',
  UPLIFT_QINI: 'uplift-qini',
  BUDGET_ALLOCATION: 'budget-allocation',
  EXECUTIVE_SUMMARY_DRIFT: 'executive-summary-drift',
} as const;

export const TAB_LABELS: Record<string, string> = {
  'upload-pipeline': 'Upload & Pipeline',
  'causal-diagnostics': 'Causal Diagnostics',
  'uplift-qini': 'Uplift & Qini',
  'budget-allocation': 'Budget Allocation',
  'executive-summary-drift': 'Executive Summary & Drift',
};

