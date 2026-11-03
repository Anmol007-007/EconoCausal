import { ScreenTab } from '../types.ts';

export const TABS = {
  UPLOAD_PIPELINE: 'upload-pipeline' as ScreenTab,
  CAUSAL_DIAGNOSTICS: 'causal-diagnostics' as ScreenTab,
  UPLIFT_QINI: 'uplift-qini' as ScreenTab,
  BUDGET_ALLOCATION: 'budget-allocation' as ScreenTab,
  EXECUTIVE_SUMMARY_DRIFT: 'executive-summary-drift' as ScreenTab,
  LIVE_METRICS: 'live-metrics' as ScreenTab,
  MODEL_COMPARISON: 'model-comparison' as ScreenTab,
  SHAP_EXPLAINABILITY: 'shap-explainability' as ScreenTab,
  SEGMENT_EXPLORER: 'segment-explorer' as ScreenTab,
  ROI_SIMULATOR: 'roi-simulator' as ScreenTab,
} as const;

export const TAB_LABELS: Record<ScreenTab, string> = {
  'upload-pipeline': 'Upload & Pipeline',
  'causal-diagnostics': 'Causal Diagnostics',
  'uplift-qini': 'Uplift & Qini',
  'budget-allocation': 'Budget Allocation',
  'executive-summary-drift': 'Executive Summary & Drift',
  'live-metrics': 'Live Metrics',
  'model-comparison': 'Model Comparison',
  'shap-explainability': 'SHAP Explainability',
  'segment-explorer': 'Segment Explorer',
  'roi-simulator': 'ROI Simulator',
};

export interface TabCategory {
  id: string;
  name: string;
  tabs: { id: ScreenTab; label: string; icon: string; badge?: string }[];
}

export const TAB_CATEGORIES: TabCategory[] = [
  {
    id: 'core',
    name: 'Core Pipeline',
    tabs: [
      { id: 'upload-pipeline', label: 'Upload & Pipeline', icon: 'upload_file' },
      { id: 'causal-diagnostics', label: 'Causal Diagnostics', icon: 'account_tree' },
      { id: 'uplift-qini', label: 'Uplift & Qini', icon: 'trending_up' },
    ],
  },
  {
    id: 'decision',
    name: 'Decision & Optimization',
    tabs: [
      { id: 'budget-allocation', label: 'Budget Allocation', icon: 'payments' },
      { id: 'roi-simulator', label: 'ROI Simulator', icon: 'calculate', badge: 'NEW' },
      { id: 'segment-explorer', label: 'Segment Explorer', icon: 'pie_chart', badge: 'NEW' },
    ],
  },
  {
    id: 'intelligence',
    name: 'Causal Intelligence & Ops',
    tabs: [
      { id: 'shap-explainability', label: 'SHAP Explainability', icon: 'insights', badge: 'NEW' },
      { id: 'model-comparison', label: 'Model Benchmark', icon: 'compare_arrows', badge: 'NEW' },
      { id: 'live-metrics', label: 'Live Metrics', icon: 'speed', badge: 'LIVE' },
      { id: 'executive-summary-drift', label: 'Summary & Drift', icon: 'summarize' },
    ],
  },
];
