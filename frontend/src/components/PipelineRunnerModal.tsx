import React, { useEffect, useState } from 'react';
import { ScreenTab } from '../types.ts';

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

  const steps = [
    {
      title: 'Observational Ingestion & Trimming',
      detail: 'Validating 50,000 customer vectors. Trimming 142 extreme points to enforce 0.05 < e(X) < 0.95 positivity.',
      duration: '320ms'
    },
    {
      title: 'Stage 1: Nuisance Residualization',
      detail: 'LightGBM Regressor (Y ~ W) & Classifier (T ~ W) across 5-fold cross-fitting. Eliminating bias leakage.',
      duration: '850ms'
    },
    {
      title: 'Stage 2: CausalForestDML Estimation',
      detail: 'Constructing 500 orthogonalized causal trees. Computing Individual Treatment Effects (τ̂_i) for $10 & $20.',
      duration: '980ms'
    },
    {
      title: 'Stage 3: SciPy MILP Knapsack Convergence',
      detail: 'Branch-and-Bound integer solver maximizing net incremental margin under promotional budget constraints.',
      duration: '420ms'
    },
    {
      title: 'Stage 4: DoWhy Refutation & Drift Verification',
      detail: 'Executing Placebo, Random Common Cause, 80% Data Subset, and Oster sensitivity bounds. Calculating PSI.',
      duration: '310ms'
    }
  ];

  useEffect(() => {
    if (!isOpen) {
      setActiveStep(0);
      setCompleted(false);
      return;
    }

    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current >= steps.length) {
        clearInterval(interval);
        setCompleted(true);
      } else {
        setActiveStep(current);
      }
    }, 700);

    return () => clearInterval(interval);
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
                {!completed ? 'Running Double ML & MILP Pipeline' : 'Pipeline Converged Successfully'}
              </h3>
              <p className="text-xs text-[#576063]">
                EconML CausalForestDML (cv=5) • SciPy Optimization • DoWhy Diagnostics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {}
        <div className="flex flex-col gap-2.5">
          {steps.map((step, idx) => {
            const isDone = idx < activeStep || completed;
            const isCurrent = idx === activeStep && !completed;
            const isPending = idx > activeStep && !completed;

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
                    <span className={`text-xs font-semibold ${
                      isDone ? 'text-emerald-900' : isCurrent ? 'text-[#006481]' : 'text-slate-700'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  <span className="font-label-code text-[10px] text-slate-500">
                    {isDone ? 'COMPLETED' : isCurrent ? step.duration : 'QUEUED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            );
          })}
        </div>

        {}
        <div className="flex items-center justify-between pt-2 border-t border-[#bec8ce]/50">
          <span className="text-xs font-label-code text-slate-500">
            {completed ? 'All 5 phases verified (Total wall-time: 2.84s)' : 'Executing cross-fitting...'}
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
