import React, { useState } from 'react';
import { MICROSERVICE_ENDPOINTS } from '../data/mockData.ts';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ isOpen, onClose }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/uplift');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);

  if (!isOpen) return null;

  const endpointDetails: Record<string, { method: string; description: string; curl: string; sampleResponse: string }> = {
    '/upload': {
      method: 'POST',
      description: 'Ingests observational CSV or Parquet stream and performs schema verification and missingness pre-flight checks.',
      curl: `curl -X POST https://api.econocausal.internal/v1/upload \\
  -H "Authorization: Bearer $ECONO_JWT" \\
  -F "file=@synthetic_retail_50k.parquet" \\
  -F "seed=42"`,
      sampleResponse: `{
  "status": "success",
  "dataset_id": "ds_synth_50k_42",
  "records": 50000,
  "missingness": 0.00,
  "confounders": ["past_spend", "recency_days", "loyalty_tier", "category_affinity"],
  "treatment": "discount",
  "outcome": "purchase",
  "validated": true
}`
    },
    '/uplift': {
      method: 'POST',
      description: 'Fits EconML CausalForestDML (5-fold cross-fitting) and computes individual treatment effects (τ̂_i) for discount arms $10 and $20.',
      curl: `curl -X POST https://api.econocausal.internal/v1/uplift \\
  -H "Content-Type: application/json" \\
  -d '{"dataset_id": "ds_synth_50k_42", "n_estimators": 500, "cv": 5, "min_leaf": 20}'`,
      sampleResponse: `{
  "model": "CausalForestDML",
  "cv_folds": 5,
  "qini_score": 0.684,
  "ate_10": 0.084,
  "ate_20": 0.142,
  "pehe_rmse": 0.0084,
  "execution_time_seconds": 1.84
}`
    },
    '/allocate': {
      method: 'POST',
      description: 'Solves the SciPy MILP knapsack problem to assign treatments maximizing net profit under a promotional budget constraint.',
      curl: `curl -X POST https://api.econocausal.internal/v1/allocate \\
  -H "Content-Type: application/json" \\
  -d '{"budget": 5000, "unit_margin": 45.0, "max_arm_20": 2000, "max_arm_10": 4000}'`,
      sampleResponse: `{
  "solver": "scipy.optimize.milp",
  "status": "Optimal (converged)",
  "budget_allocated": 4980.0,
  "targeted_persuadables": 382,
  "net_incremental_profit": 18420.0,
  "discount_waste_saved": 11240.0,
  "sure_things_held_out": 15900
}`
    },
    '/diagnostics': {
      method: 'GET',
      description: 'Returns the Pearlian DAG identification proof and DoWhy refutation stress test signatures.',
      curl: `curl -X GET https://api.econocausal.internal/v1/diagnostics?dataset_id=ds_synth_50k_42`,
      sampleResponse: `{
  "estimand": "Pearl Backdoor on W",
  "d_separated": true,
  "overlap_positivity": 0.9988,
  "max_smd_adjusted": 0.032,
  "refutations": {
    "placebo_p_value": 0.89,
    "common_cause_drift": "0.28%",
    "subset_variance": 0.002,
    "gamma_critical": 2.85
  }
}`
    },
    '/drift': {
      method: 'POST',
      description: 'Calculates Population Stability Index (PSI) and Kolmogorov-Smirnov divergence against the reference baseline.',
      curl: `curl -X POST https://api.econocausal.internal/v1/drift \\
  -H "Content-Type: application/json" \\
  -d '{"baseline_id": "ds_synth_50k_42", "window": "7d"}'`,
      sampleResponse: `{
  "window": "7d",
  "max_psi": 0.082,
  "critical_threshold": 0.20,
  "system_health": "Stable",
  "peak_drift_feature": "category_affinity",
  "retrain_recommended": false
}`
    }
  };

  const active = endpointDetails[selectedEndpoint] || endpointDetails['/uplift'];

  const handleTestCall = () => {
    setIsCalling(true);
    setTestResponse(null);
    setTimeout(() => {
      setIsCalling(false);
      setTestResponse(active.sampleResponse);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#131d20]/45 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#bec8ce] w-full max-w-3xl rounded-lg shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {}
        <div className="px-6 py-4 bg-[#f8fdff] border-b border-[#bec8ce]/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#006481]/10 border border-[#006481]/20 flex items-center justify-center text-[#006481]">
              <span className="material-symbols-outlined text-base">terminal</span>
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#131d20] font-semibold">Production Microservice API Reference</h3>
              <p className="text-xs text-[#576063]">Gateway: envoy-prod-causal.ingress • SLA Target &lt; 3.0s</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          {}
          <div className="md:w-56 flex flex-col gap-1.5 shrink-0">
            <span className="text-[11px] font-label-code uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Endpoints
            </span>
            {MICROSERVICE_ENDPOINTS.map((ep) => (
              <button
                key={ep.path}
                onClick={() => {
                  setSelectedEndpoint(ep.path);
                  setTestResponse(null);
                }}
                className={`w-full text-left p-2.5 rounded border text-xs font-label-code transition-colors flex items-center justify-between cursor-pointer ${
                  selectedEndpoint === ep.path
                    ? 'border-[#006481] bg-[#eaf5f9] text-[#006481] font-semibold'
                    : 'border-[#bec8ce]/40 hover:bg-[#f8fdff] text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    ep.method === 'POST' ? 'bg-[#006481]/10 text-[#006481]' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {ep.method}
                  </span>
                  <span>{ep.path}</span>
                </div>
                <span className="text-[10px] text-slate-400">{ep.latency}</span>
              </button>
            ))}
          </div>

          {}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold font-label-code bg-[#006481] text-white">
                {active.method}
              </span>
              <span className="font-label-code text-sm font-semibold text-[#131d20]">
                {selectedEndpoint}
              </span>
            </div>

            <p className="text-xs text-[#475053] leading-relaxed">
              {active.description}
            </p>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-label-code text-slate-500 uppercase">Curl Command</span>
                <button
                  onClick={() => navigator.clipboard?.writeText(active.curl)}
                  className="text-[11px] text-[#006481] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">content_copy</span>
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-3 rounded bg-slate-900 text-emerald-300 font-label-code text-[11px] overflow-x-auto leading-relaxed">
                {active.curl}
              </pre>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-[#bec8ce]/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-label-code text-slate-500 uppercase">Interactive Test Sandbox</span>
                <button
                  onClick={handleTestCall}
                  disabled={isCalling}
                  className="px-3 py-1 rounded bg-[#006481] text-white text-xs font-medium hover:bg-[#007ea2] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-xs ${isCalling ? 'animate-spin' : ''}`}>
                    {isCalling ? 'sync' : 'send'}
                  </span>
                  <span>{isCalling ? 'Executing...' : 'Test Request'}</span>
                </button>
              </div>

              {testResponse ? (
                <pre className="p-3 rounded bg-[#f8fdff] border border-[#bec8ce]/60 font-label-code text-[11px] text-[#131d20] overflow-x-auto">
                  {testResponse}
                </pre>
              ) : (
                <div className="p-4 rounded border border-dashed border-[#bec8ce] text-center text-xs text-slate-400 font-label-code">
                  Click &ldquo;Test Request&rdquo; to simulate live microservice execution.
                </div>
              )}
            </div>
          </div>
        </div>

        {}
        <div className="px-6 py-3 bg-[#f8fdff] border-t border-[#bec8ce]/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
