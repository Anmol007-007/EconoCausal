import React, { useEffect, useState } from 'react';
import { ScreenTab } from '../types.ts';
import { apiService } from '../apiService.ts';

interface HeaderProps {
  currentTab: ScreenTab;
  onSelectTab: (tab: ScreenTab) => void;
  onOpenApiDocs: () => void;
  onRunPipeline: () => void;
  isPipelineRunning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenApiDocs,
  onRunPipeline,
  isPipelineRunning,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isBackendLive, setIsBackendLive] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const live = await apiService.checkHealth();
      if (mounted) setIsBackendLive(live);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const tabs: { id: ScreenTab; label: string }[] = [
    { id: 'upload-pipeline', label: 'Upload & Pipeline' },
    { id: 'causal-diagnostics', label: 'Causal Diagnostics' },
    { id: 'uplift-qini', label: 'Uplift & Qini' },
    { id: 'budget-allocation', label: 'Budget Allocation' },
    { id: 'executive-summary-drift', label: 'Executive Summary & Drift' },
  ];

  return (
    <header className="fixed top-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-[#bec8ce]/50 shadow-[0_1px_3px_rgba(19,29,32,0.04)]">
      <div className="w-full px-6 sm:px-10 xl:px-14 flex flex-col justify-between">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 lg:gap-6">
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => onSelectTab('upload-pipeline')}
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#006481] to-[#004d64] text-white flex items-center justify-center font-serif italic text-base font-bold shadow-xs">
                Ec
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg font-semibold tracking-tight text-[#131d20] leading-none">
                  EconoCausal
                </span>
                <span className="font-label-code text-[10px] text-[#2e94b9] uppercase tracking-wider mt-0.5">
                  Causal-AI • Ref: ITS/DSML/1150
                </span>
              </div>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded border border-[#bec8ce]/50 bg-[#eaf5f9] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#2e94b9]"></span>
              <span className="font-label-code text-slate-500">Campaign:</span>
              <span className="font-label-code text-[#131d20] font-semibold">
                Q4 Persuadable Promo • Synthetic Retail 50k
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#bec8ce]/50 bg-[#eaf5f9] text-[#475053] font-label-code text-xs">
              <span className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-emerald-500 animate-pulse' : isBackendLive === false ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
              <span>{isBackendLive ? 'API: LIVE (FastAPI:8000)' : 'API: MOCK (Offline)'}</span>
            </div>

            <button
              onClick={onOpenApiDocs}
              className="flex items-center gap-1 px-3 py-1.5 rounded border border-[#bec8ce]/50 hover:bg-[#eaf5f9] text-[#475053] hover:text-[#131d20] font-label-code text-xs transition-colors cursor-pointer"
              title="Inspect OpenAPI Microservice Endpoints"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">terminal</span>
              <span className="hidden md:inline">API Docs</span>
            </button>

            <button
              onClick={onRunPipeline}
              disabled={isPipelineRunning}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded font-medium text-xs text-white tracking-wide shadow-xs transition-all cursor-pointer ${
                isPipelineRunning
                  ? 'bg-[#2e94b9] opacity-80 cursor-wait'
                  : 'bg-[#006481] hover:bg-[#007ea2] active:scale-95'
              }`}
              type="button"
            >
              <span className={`material-symbols-outlined text-sm ${isPipelineRunning ? 'animate-spin' : ''}`}>
                {isPipelineRunning ? 'sync' : 'play_arrow'}
              </span>
              <span>{isPipelineRunning ? 'Fitting Models...' : 'Run Pipeline'}</span>
            </button>

            <div className="flex items-center gap-2.5 pl-3 border-l border-[#bec8ce]/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#006481] to-[#2e94b9] text-white flex items-center justify-center font-semibold text-xs shadow-xs ring-2 ring-[#006481]/20">
                AS
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#131d20] leading-tight">Anmol Soni</span>
                <span className="font-label-code text-[10px] uppercase text-[#2e94b9] font-medium">Lead Quant</span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded focus:outline-none"
              aria-label="Toggle Navigation"
              type="button"
            >
              <span className="material-symbols-outlined text-xl">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        <div className="hidden lg:flex h-11 items-center justify-between border-t border-[#bec8ce]/40">
          <nav className="flex items-center gap-1 h-full">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  type="button"
                  className={`h-full px-4 flex items-center text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#006481] bg-[#eaf5f9] font-semibold shadow-[inset_0_-2px_0_0_#2e94b9]'
                      : 'text-[#576063] hover:text-[#131d20] hover:bg-[#eaf5f9]/50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 text-slate-500 font-label-code text-xs">
            <span className={`inline-block w-2 h-2 rounded-full ${isBackendLive ? 'bg-emerald-500' : 'bg-[#2e94b9]'}`}></span>
            <span>{isBackendLive ? 'BACKEND: CONNECTED' : 'CLUSTER: ACTIVE (EVAL-NODE-03)'}</span>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-2 border-t border-[#bec8ce]/40 flex flex-col gap-1 bg-white">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  onSelectTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                type="button"
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded ${
                  currentTab === tab.id
                    ? 'bg-[#eaf5f9] text-[#006481] font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
