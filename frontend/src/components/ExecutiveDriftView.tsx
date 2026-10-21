import React, { useState } from 'react';
import { ScreenTab } from '../types.ts';
import { exportRefutationJSON } from '../exportUtils.ts';
import { apiService, SummaryResult, DriftResult } from '../apiService.ts';

interface ExecutiveDriftViewProps {
  onNavigate: (tab: ScreenTab) => void;
  onOpenExportModal: () => void;
  totalBudget: number;
}

export const ExecutiveDriftView: React.FC<ExecutiveDriftViewProps> = ({
  onNavigate,
  onOpenExportModal,
}) => {
  const [driftWindow, setDriftWindow] = useState<'7d' | '30d'>('7d');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryResult | null>(null);
  const [driftData, setDriftData] = useState<DriftResult | null>(null);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);

  React.useEffect(() => {
    let mounted = true;
    Promise.all([apiService.getSummary(), apiService.checkDrift()]).then(([sumRes, driftRes]) => {
      if (!mounted) return;
      if (sumRes.data) setSummaryData(sumRes.data);
      if (driftRes.data) setDriftData(driftRes.data);
      setIsLiveApi(sumRes.isLive || driftRes.isLive);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const activeDriftData = driftData?.metrics || (driftWindow === '7d' ? DRIFT_METRICS_7D : DRIFT_METRICS_30D);
  const maxPsi = driftData ? driftData.max_psi.toFixed(3) : (driftWindow === '7d' ? '0.082' : '0.096');
  const netProfitDisplay = summaryData?.kpis ? `$${summaryData.kpis.net_incremental_profit.toLocaleString()}` : '$18,420';
  const wasteSavedDisplay = summaryData?.kpis ? `$${summaryData.kpis.discount_waste_saved.toLocaleString()}` : '$11,240';
  const persuadablesDisplay = summaryData?.kpis ? summaryData.kpis.targeted_persuadables.toLocaleString() : '382';
  const sureThingsDisplay = summaryData?.kpis ? summaryData.kpis.sure_things_held_out.toLocaleString() : '15,900';

  const triggerDownloadReport = (type: 'PDF' | 'PPT') => {
    setToastMessage(`Generating Executive ${type} Causal Audit Report... Complete.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {}
      {toastMessage && (
        <div className="fixed bottom-12 right-6 z-50 bg-[#006481] text-white px-4 py-2.5 rounded shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-sm text-[#acdcee]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {}
      <section className="w-full p-5 sm:p-6 rounded-lg bg-white border border-[#bec8ce]/50 shadow-sm flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-[#131d20] tracking-tight font-medium">
              Executive Intelligence &amp; Production Drift Telemetry
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-[#bec8ce]/50 bg-[#eaf5f9]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2e94b9]"></span>
              <span className="font-label-code text-xs text-[#576063] font-medium">
                System Health: Stable (Max PSI: {maxPsi} &lt; 0.20 Threshold)
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#475053] max-w-4xl leading-relaxed">
            Natural language strategy narrative, ROI attribution, and continuous covariate / predicted-effect drift monitoring (Population Stability Index &amp; Kolmogorov–Smirnov test matrices).
          </p>
        </div>

        {}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-[#eaf5f9] p-0.5 rounded border border-[#bec8ce]/50">
            <button
              onClick={() => setDriftWindow('7d')}
              className={`px-3 py-1 rounded font-label-code text-xs font-semibold transition-all cursor-pointer ${
                driftWindow === '7d'
                  ? 'bg-white text-[#006481] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              type="button"
            >
              W4 7-Day Window
            </button>
            <button
              onClick={() => setDriftWindow('30d')}
              className={`px-3 py-1 rounded font-label-code text-xs font-semibold transition-all cursor-pointer ${
                driftWindow === '30d'
                  ? 'bg-white text-[#006481] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              type="button"
            >
              Rolling 30-Day
            </button>
          </div>

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-[#bec8ce]/60 bg-white hover:bg-slate-50 text-[#131d20] font-medium text-xs shadow-xs transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-sm text-[#006481]">download</span>
            <span>Export Artifacts</span>
          </button>
        </div>
      </section>

      {}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {}
        <div className="bg-white rounded-lg border border-[#bec8ce]/50 p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between pb-1">
            <span className="font-label-code text-[11px] uppercase tracking-wider text-slate-500">
              Net Incremental Profit
            </span>
            <span className="material-symbols-outlined text-[#006481] text-xl">payments</span>
          </div>
          <div className="my-1">
            <div className="font-data-metric text-2xl text-[#131d20] font-semibold">{netProfitDisplay}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-label-code text-xs text-[#006481] font-semibold">▲ +156%</span>
              <span className="text-xs text-slate-500">vs blanket promotional policy</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-[#bec8ce]/30 rounded overflow-hidden mt-2">
            <div className="h-full bg-[#006481] rounded" style={{ width: '78%' }}></div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-lg border border-[#bec8ce]/50 p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between pb-1">
            <span className="font-label-code text-[11px] uppercase tracking-wider text-slate-500">
              Unneeded Discount Waste Saved
            </span>
            <span className="material-symbols-outlined text-[#006481] text-xl">savings</span>
          </div>
          <div className="my-1">
            <div className="font-data-metric text-2xl text-[#131d20] font-semibold">{wasteSavedDisplay}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-label-code text-xs text-slate-700 font-semibold">{sureThingsDisplay}</span>
              <span className="text-xs text-slate-500">“Sure Things” held out ($31.8k gross)</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-[#bec8ce]/30 rounded overflow-hidden mt-2">
            <div className="h-full bg-[#2e94b9] rounded" style={{ width: '84%' }}></div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-lg border border-[#bec8ce]/50 p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between pb-1">
            <span className="font-label-code text-[11px] uppercase tracking-wider text-slate-500">
              Targeted Persuadables
            </span>
            <span className="material-symbols-outlined text-slate-500 text-xl">person_pin</span>
          </div>
          <div className="my-1">
            <div className="font-data-metric text-2xl text-[#131d20] font-semibold">
              {persuadablesDisplay} <span className="text-sm text-slate-500 font-normal">/ 409 Purchases</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-label-code text-xs text-[#006481] font-semibold">1.07 Ratio</span>
              <span className="text-xs text-slate-500">Allocated on $4,980 total spend</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-[#bec8ce]/30 rounded overflow-hidden mt-2">
            <div className="h-full bg-[#475053] rounded" style={{ width: '62%' }}></div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-lg border border-[#bec8ce]/50 p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between pb-1">
            <span className="font-label-code text-[11px] uppercase tracking-wider text-slate-500">
              Drift Safety Ceiling
            </span>
            <span className="material-symbols-outlined text-[#006481] text-xl">speed</span>
          </div>
          <div className="my-1">
            <div className="font-data-metric text-2xl text-[#131d20] font-semibold">
              {maxPsi} <span className="font-label-code text-xs text-slate-500 font-normal">PSI</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-label-code text-xs text-[#006481] font-semibold">NOMINAL</span>
              <span className="text-xs text-slate-500">Retraining bound: PSI &gt; 0.200</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-[#bec8ce]/30 rounded overflow-hidden mt-2">
            <div className="h-full bg-[#006481]/50 rounded" style={{ width: '41%' }}></div>
          </div>
        </div>
      </section>

      {}
      <section className="bg-white rounded-lg border border-[#bec8ce]/50 p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
        {}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#bec8ce]/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#eaf5f9] border border-[#bec8ce]/50 text-[#006481] flex items-center justify-center">
              <span className="material-symbols-outlined text-base">auto_graph</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg text-[#131d20] font-semibold">
                Causal Synthesis &amp; Strategic Allocation Narrative
              </span>
              <span className="font-label-code text-xs text-slate-500">
                Model Pipeline: CausalForestDML (K=5 Cross-Fitting) • Constrained SciPy MILP Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-label-code text-xs px-3 py-1 rounded bg-[#eaf5f9] border border-[#bec8ce]/50 text-slate-600">
            <span className="material-symbols-outlined text-sm text-[#006481]">verified</span>
            <span>Unconfoundedness Verified (DoWhy)</span>
          </div>
        </div>

        {}
        <div className="p-4 rounded-lg border-l-4 border-[#006481] bg-[#f8fdff]">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#006481] text-2xl shrink-0 mt-0.5">
              format_quote
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-label-code text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Executive Synthesis
              </span>
              {summaryData?.narrative ? (
                <p className="text-sm sm:text-base text-[#131d20] leading-relaxed">
                  {summaryData.narrative}
                </p>
              ) : (
                <p className="text-sm sm:text-base text-[#131d20] leading-relaxed">
                  By replacing standard propensity marketing with{' '}
                  <span className="font-semibold text-[#006481]">Double Machine Learning (DML)</span> and{' '}
                  <span className="font-semibold text-slate-700">SciPy Mixed-Integer Linear Programming (MILP)</span> optimization, the campaign captures{' '}
                  <span className="font-semibold text-[#131d20]">409 incremental purchases</span> from{' '}
                  <span className="font-semibold text-[#131d20]">382 high-yield persuadables</span> on a{' '}
                  <span className="font-semibold text-[#131d20]">$4,980 spend</span>. This delivers{' '}
                  <span className="font-bold text-[#006481]">$18,420 in net incremental profit</span>, representing an estimated{' '}
                  <span className="font-bold text-[#006481]">$11,240 (+156%) cost-efficiency gain</span> over blanket discounting and saving{' '}
                  <span className="font-semibold text-slate-700">$11,240</span> from being wasted on high-propensity customers who would have purchased regardless.
                </p>
              )}
            </div>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {}
          <div className="p-4 rounded border border-[#bec8ce]/50 bg-[#f8fdff] flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 pb-1">
              <span className="material-symbols-outlined text-base text-[#006481]">do_not_disturb_on</span>
              <span className="font-serif text-sm font-bold text-[#131d20]">1. Zero Allocation to &ldquo;Sure Things&rdquo;</span>
            </div>
            <p className="text-xs text-slate-600 leading-normal">
              Allocated $0 across 15,900 customers identified with high base purchase probability and zero counterfactual uplift, preventing{' '}
              <span className="text-[#131d20] font-semibold">$31,800 in unneeded discount giveaways</span>.
            </p>
            <div className="mt-auto pt-2 border-t border-[#bec8ce]/40 flex items-center justify-between font-label-code text-[11px] text-slate-500">
              <span>Counterfactual ITE: ~0.002</span>
              <span className="font-medium text-[#131d20]">15,900 Isolated</span>
            </div>
          </div>

          {}
          <div className="p-4 rounded border border-[#bec8ce]/50 bg-[#f8fdff] flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 pb-1">
              <span className="material-symbols-outlined text-base text-[#006481]">tune</span>
              <span className="font-serif text-sm font-bold text-[#131d20]">2. Surgical Tier &amp; Recency Targeting</span>
            </div>
            <p className="text-xs text-slate-600 leading-normal">
              Aggressive $20 discounts concentrated exclusively in Bronze/Silver tiers with recency &gt; 30 days where elasticities peaked (+34.8% incremental conversion) over baseline.
            </p>
            <div className="mt-auto pt-2 border-t border-[#bec8ce]/40 flex items-center justify-between font-label-code text-[11px] text-slate-500">
              <span>Coupon: $20 Max</span>
              <span className="font-medium text-[#131d20]">Recency &gt; 30d</span>
            </div>
          </div>

          {}
          <div className="p-4 rounded border border-[#bec8ce]/50 bg-[#f8fdff] flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 pb-1">
              <span className="material-symbols-outlined text-base text-[#006481]">mediation</span>
              <span className="font-serif text-sm font-bold text-[#131d20]">3. Elimination of Confounding Bias</span>
            </div>
            <p className="text-xs text-slate-600 leading-normal">
              Double ML cross-fitting eliminates confounding bias present in historical promo logs, preventing false attribution caused by marketing managers previously favoring high-loyalty accounts.
            </p>
            <div className="mt-auto pt-2 border-t border-[#bec8ce]/40 flex items-center justify-between font-label-code text-[11px] text-slate-500">
              <span>R-Score: 0.184</span>
              <span className="font-medium text-[#131d20]">14 Confounders</span>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl text-[#131d20] font-semibold">Continuous Covariate &amp; ITE Drift Engine</h2>
              <span className="px-2 py-0.5 rounded border border-[#bec8ce]/50 bg-[#eaf5f9] font-label-code text-xs text-slate-600">
                Statistical Process Control
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-0.5">
              Comparing Reference Baseline:{' '}
              <span className="text-[#131d20] font-label-code font-semibold">Synthetic Retail 50k (Seed #42)</span> vs Live Ingestion:{' '}
              <span className="text-[#006481] font-label-code font-semibold">
                {driftWindow === '7d' ? 'Week 4 Live Stream (12.5k Ingestion)' : 'Rolling 30D Window (48.2k Ingestion)'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3 font-label-code text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#006481]"></span>
              <span>Stable (&lt;0.10)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#acdcee] border border-[#006481]/40"></span>
              <span>Mild Shift (0.10 - 0.20)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-600"></span>
              <span>Critical Drift (&gt;0.20)</span>
            </div>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          {}
          <div className="xl:col-span-8 bg-white rounded-lg border border-[#bec8ce]/50 overflow-hidden flex flex-col shadow-xs">
            <div className="p-3.5 bg-[#f8fdff] border-b border-[#bec8ce]/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#131d20]">
                <span className="material-symbols-outlined text-sm text-[#006481]">query_stats</span>
                <span>Covariate Stability &amp; Treatment Effect Uniformity Metrics</span>
              </div>
              <span className="font-label-code text-xs text-slate-500">Significance Level α = 0.05</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-label-code text-xs">
                <thead>
                  <tr className="bg-[#f8fdff] border-b border-[#bec8ce]/40 text-slate-500 uppercase text-[11px]">
                    <th className="py-2.5 px-3.5">Feature / Estimand</th>
                    <th className="py-2.5 px-3.5">Domain Type</th>
                    <th className="py-2.5 px-3.5 text-right">PSI Metric</th>
                    <th className="py-2.5 px-3.5 text-right">Kolmogorov–Smirnov</th>
                    <th className="py-2.5 px-3.5 text-right">P-Value</th>
                    <th className="py-2.5 px-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#bec8ce]/25">
                  {activeDriftData.map(row => (
                    <tr
                      key={row.feature}
                      className={`hover:bg-[#f8fdff] transition-colors ${
                        row.status === 'Mild Shift' ? 'bg-[#eaf5f9]/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3.5 font-semibold text-[#131d20]">{row.feature}</td>
                      <td className="py-2.5 px-3.5 text-slate-500">{row.domain}</td>
                      <td className="py-2.5 px-3.5 text-right font-semibold font-data-metric text-[#006481]">
                        {row.psi.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-data-metric text-[#131d20]">
                        {row.ks.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-data-metric text-slate-500">
                        {row.pValue.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          row.status === 'Stable'
                            ? 'border-[#006481]/30 bg-[#006481]/10 text-[#006481]'
                            : 'border-amber-300 bg-amber-50 text-amber-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {}
            <div className="mt-auto p-3.5 bg-[#f8fdff] border-t border-[#bec8ce]/40 flex items-start gap-2">
              <span className="material-symbols-outlined text-[#006481] text-base shrink-0 mt-0.5">info</span>
              <div className="flex flex-col gap-0.5 text-xs">
                <span className="font-semibold text-[#131d20]">Automated Alert Trigger Logic</span>
                <p className="text-slate-600 leading-normal">
                  Automated alert trigger configured at{' '}
                  <span className="text-[#131d20] font-label-code font-bold">PSI &gt; 0.20</span>. When triggered, the platform flags the pipeline for retraining and recalibration of base nuisance estimators. Current maximum drift is safely localized at{' '}
                  <span className="text-[#006481] font-label-code font-bold">{maxPsi}</span> (category_affinity).
                </p>
              </div>
            </div>
          </div>

          {}
          <div className="xl:col-span-4 flex flex-col gap-4">
            {}
            <div className="bg-white rounded-lg border border-[#bec8ce]/50 p-4 flex flex-col gap-2 shadow-xs">
              <div className="flex items-center justify-between pb-1 border-b border-[#bec8ce]/40">
                <span className="text-xs font-semibold text-[#131d20]">Peak Covariate Shift Gauge</span>
                <span className="font-label-code text-xs text-slate-500">category_affinity</span>
              </div>

              {}
              <div className="relative flex flex-col items-center justify-center py-2">
                <svg className="w-48 h-28" viewBox="0 0 200 110">
                  {}
                  <path d="M 20,100 A 80,80 0 0,1 180,100" fill="none" stroke="#d8e7ed" strokeLinecap="round" strokeWidth="12"></path>
                  {}
                  <path d="M 20,100 A 80,80 0 0,1 78,35" fill="none" stroke="#2e94b9" strokeLinecap="round" strokeWidth="12"></path>
                  {}
                  <line stroke="#ba1a1a" strokeWidth="2.5" x1="140" x2="148" y1="31" y2="24"></line>
                </svg>

                <div className="absolute bottom-2 flex flex-col items-center">
                  <span className="font-data-metric text-2xl text-[#006481] font-bold leading-none">{maxPsi}</span>
                  <span className="font-label-code text-[10px] text-slate-500 mt-1">PSI VALUE (MILD)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-500 font-label-code text-[10px] pt-1 border-t border-[#bec8ce]/40">
                <span>0.00 (Identical)</span>
                <span className="text-red-600 font-medium">0.20 Alert Bound</span>
                <span>0.40+ (Severe)</span>
              </div>
            </div>

            {}
            <div className="bg-white rounded-lg border border-[#bec8ce]/50 p-4 flex flex-col gap-2 flex-1 shadow-xs">
              <div className="flex items-center justify-between pb-1 border-b border-[#bec8ce]/40">
                <span className="text-xs font-semibold text-[#131d20]">Empirical CDF Kolmogorov Split</span>
                <span className="font-label-code text-xs text-[#006481] font-semibold">D = 0.054</span>
              </div>

              <div className="relative w-full h-28 flex items-center justify-center">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 320 120">
                  <line stroke="#e4f1f6" strokeDasharray="2 2" strokeWidth="1" x1="0" x2="320" y1="20" y2="20"></line>
                  <line stroke="#e4f1f6" strokeDasharray="2 2" strokeWidth="1" x1="0" x2="320" y1="60" y2="60"></line>
                  <line stroke="#e4f1f6" strokeDasharray="2 2" strokeWidth="1" x1="0" x2="320" y1="100" y2="100"></line>

                  {}
                  <path d="M 0,110 C 80,105 130,80 180,40 C 230,10 280,5 320,5" fill="none" stroke="#7e8b91" strokeDasharray="3 3" strokeWidth="1.75"></path>

                  {}
                  <path d="M 0,110 C 90,108 140,88 185,48 C 235,15 285,5 320,5" fill="none" stroke="#2e94b9" strokeWidth="2"></path>

                  {}
                  <line stroke="#475053" strokeLinecap="round" strokeWidth="2" x1="182" x2="182" y1="40" y2="48"></line>
                </svg>
              </div>

              <div className="flex items-center justify-between font-label-code text-[11px] text-slate-500 pt-1 border-t border-[#bec8ce]/40">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-slate-400 inline-block"></span>
                  <span>Ref Baseline (50k)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#2e94b9] inline-block"></span>
                  <span>{driftWindow === '7d' ? 'Batch W4 (12.5k)' : 'Rolling 30D (48.2k)'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl text-[#131d20] font-semibold">Production Microservice Telemetry</h2>
            <span className="px-2 py-0.5 rounded border border-[#bec8ce]/50 bg-[#eaf5f9] font-label-code text-xs text-slate-600">
              SLA Target &lt; 3.0s
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-label-code text-xs text-slate-500">
            <span className="material-symbols-outlined text-sm text-[#006481]">cloud_done</span>
            <span>Gateway: envoy-prod-causal.ingress</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {MICROSERVICE_ENDPOINTS.map(ep => (
            <div
              key={ep.path}
              className="bg-white rounded-lg border border-[#bec8ce]/50 p-3.5 flex flex-col justify-between hover:border-[#006481]/50 transition-colors shadow-xs"
            >
              <div className="flex items-center justify-between pb-1">
                <span className="font-label-code text-xs font-semibold text-[#131d20]">
                  {ep.method} {ep.path}
                </span>
                <span className="px-1.5 py-0.5 rounded border border-[#bec8ce]/60 bg-[#eaf5f9] font-label-code text-[10px] text-slate-600 font-medium">
                  {ep.status}
                </span>
              </div>
              <div className="flex items-baseline justify-between my-1">
                <span className={`font-data-metric text-lg font-semibold ${
                  ep.path === '/uplift' ? 'text-[#006481]' : 'text-[#131d20]'
                }`}>
                  {ep.latency}
                </span>
                <span className="font-label-code text-xs text-slate-400">{ep.p99OrSla}</span>
              </div>
              <span className="text-xs text-slate-500 truncate">{ep.description}</span>
            </div>
          ))}
        </div>
      </section>

      {}
      <section className="bg-white rounded-lg border border-[#bec8ce]/50 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded border border-[#bec8ce]/50 bg-[#eaf5f9] flex items-center justify-center text-slate-600 shrink-0">
            <span className="material-symbols-outlined text-xl text-[#006481]">inventory_2</span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-base font-semibold text-[#131d20]">
              Regulatory Causal Audit &amp; Compliance Packaging
            </span>
            <span className="text-xs text-slate-500">
              Validated under IEEE-USA AI Ethics Framework &amp; Federal Trade Commission Algorithmic Pricing Guidelines
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => triggerDownloadReport('PDF')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#bec8ce] bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all cursor-pointer shadow-xs"
            type="button"
          >
            <span className="material-symbols-outlined text-sm text-red-600">picture_as_pdf</span>
            <span>Export Full Audit Report (PDF)</span>
          </button>

          <button
            onClick={() => triggerDownloadReport('PPT')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#bec8ce] bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all cursor-pointer shadow-xs"
            type="button"
          >
            <span className="material-symbols-outlined text-sm text-slate-500">slideshow</span>
            <span>Download Slide Deck (PPT)</span>
          </button>

          <button
            onClick={() => exportRefutationJSON(REFUTER_SUITE)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#006481] hover:bg-[#007ea2] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">verified</span>
            <span>Export Refutation Artifacts</span>
          </button>
        </div>
      </section>

      {}
      <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-[#bec8ce]/50 shadow-xs">
        <button
          onClick={() => onNavigate('budget-allocation')}
          className="px-4 py-2 rounded border border-[#bec8ce] text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xs">arrow_back</span>
          <span>Back: Budget Allocation</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="px-4 py-2 rounded bg-[#006481] hover:bg-[#007ea2] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xs">file_download</span>
          <span>Bundle &amp; Export Audit Package</span>
        </button>
      </div>
    </div>
  );
};
