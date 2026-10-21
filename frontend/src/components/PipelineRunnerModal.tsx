import React, { useEffect, useState } from 'react';
import { ScreenTab } from '../types.ts';
import { apiService } from '../apiService.ts';

interface PipelineRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: ScreenTab) => void;
}

export const PipelineRunnerModal: React.FC<PipelineRunnerModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);
  const [wallTime, setWallTime] = useState<string>('2.84s');

  const steps = [
    {
      title: 'Observational Ingestion & Trimming',
      detail: 'Validating customer vectors. Enforcing positivity support e(X) across treatment arms.',
      duration: '210ms',
    },
    {
      title: 'Stage 1: Nuisance Residualization & DAG Proof',
      detail: 'Fitting LightGBM Regressors Y ~ W & T ~ W across K-folds. Testing backdoor identification.',
      duration: '450ms',
    },
    {
      title: 'Stage 2: CausalForestDML Estimation',
      detail: 'Constructing orthogonalized causal trees. Estimating Individual Treatment Effects (tau_i).',
      duration: '820ms',
    },
    {
      title: 'Stage 3: SciPy MILP Knapsack Convergence',
      detail: 'Sparse HiGHS solver maximizing net margin under budget & arm capacity constraints.',
      duration: '180ms',
    },
    {
      title: 'Stage 4: DoWhy Refutation & Drift Telemetry',
      detail: 'Running Placebo, Common Cause, and Data Subset refuters. Evaluating PSI divergence.',
      duration: '310ms',
    },
  ];

  useEffect(() => {
    if (!isOpen) {
      setActiveStep(0);
      setCompleted(false);
      return;
    }

    let isMounted = true;
    const runLivePipeline = async () => {
      const startTime = performance.now();

      setActiveStep(0);
      const res0 = await apiService.uploadDataset(undefined, 42, 1000);
      if (!isMounted) return;
      if (res0.isLive) setIsLiveBackend(true);

      setActiveStep(1);
      await apiService.getDiagnostics();
      if (!isMounted) return;

      setActiveStep(2);
      await apiService.runUplift({ n_estimators: 32, cv: 2 });
      if (!isMounted) return;

      setActiveStep(3);
      await apiService.runAllocate({ total_budget: 5000, unit_margin: 45 });
      if (!isMounted) return;

      setActiveStep(4);
      await apiService.checkDrift({ psi_threshold: 0.2 });
      await apiService.getSummary();
      if (!isMounted) return;

      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      setWallTime(`${elapsed}s`);
      setActiveStep(5);
      setCompleted(true);
    };

    runLivePipeline();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#131d20]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#bec8ce] w-full max-w-xl rounded-lg shadow-2xl p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-[#bec8ce]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#006481]/10 border border-[#006481]/20 flex items-center justify-center text-[#006481]">
              <span className={`material-symbols-outlined text-base ${!completed ? 'animate-spin' : ''}`}>
                {!completed ? 'sync' : 'verified'}
              </span>
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#131d20] font-semibold">
                {!completed ? 'Executing Live Double ML & MILP Pipeline' : 'Pipeline Converged Successfully'}
              </h3>
              <p className="text-xs text-[#576063]">
                {isLiveBackend ? 'FastAPI Microservice Engine • EconML & SciPy MILP' : 'EconML CausalForestDML • SciPy Optimization (Deterministic)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {steps.map((step, idx) => {
            const isDone = idx < activeStep || completed;
            const isCurrent = idx === activeStep && !completed;

            return (
              <div
                key={step.title}
                className={`p-3 rounded border transition-all ${
                  isCurrent
                    ? 'border-[#006481] bg-[#eaf5f9] shadow-xs'
                    : isDone
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-[#bec8ce]/40 bg-white opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">
                      {isDone ? (
                        <span className="text-emerald-600 font-bold">check_circle</span>
                      ) : isCurrent ? (
                        <span className="text-[#006481] animate-spin">refresh</span>
                      ) : (
                        <span className="text-slate-400">radio_button_unchecked</span>
                      )}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        isDone ? 'text-emerald-900' : isCurrent ? 'text-[#006481]' : 'text-slate-700'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  <span className="font-label-code text-[10px] text-slate-500">
                    {isDone ? 'COMPLETED' : isCurrent ? 'RUNNING' : 'QUEUED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#bec8ce]/50">
          <span className="text-xs font-label-code text-slate-500">
            {completed
              ? `All 5 phases verified • Total wall-time: ${wallTime}`
              : `Executing phase ${Math.min(activeStep + 1, 5)} of 5...`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-[#bec8ce] text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Dismiss
            </button>
            {completed && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToTab('uplift-qini');
                }}
                className="px-4 py-1.5 rounded bg-[#006481] hover:bg-[#007ea2] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Inspect Uplift Curves</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
