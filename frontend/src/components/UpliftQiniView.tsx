import React, { useRef, useState } from 'react';
import { ScreenTab } from '../types.ts';
import { DECILE_DATA } from '../mockData.ts';
import { exportDecilesCSV } from '../exportUtils.ts';

interface UpliftQiniViewProps {
  onNavigate: (tab: ScreenTab) => void;
}

export const UpliftQiniView: React.FC<UpliftQiniViewProps> = ({ onNavigate }) => {
  const [currentArm, setCurrentArm] = useState<'joint' | '20' | '10'>('joint');
  const [metricMode, setMetricMode] = useState<'conversions' | 'profit'>('conversions');
  const [hoverCutoff, setHoverCutoff] = useState<number>(22.4);
  const [hoverPosition, setHoverPosition] = useState<number>(220);
  const [activeQuadrant, setActiveQuadrant] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clampedX = Math.max(70, Math.min(x, rect.width - 50));
    const percent = Math.round(((clampedX - 70) / (rect.width - 120)) * 100);
    const svgX = (clampedX / rect.width) * 800;
    setHoverPosition(svgX);
    setHoverCutoff(Math.min(100, Math.max(0, percent)));
  };

  const armMultiplier = currentArm === '20' ? 1.25 : currentArm === '10' ? 0.8 : 1.0;
  const factor = hoverCutoff / 100;
  const dmlOrders = Math.round(4210 * Math.pow(factor, 0.45) * 2.2 * armMultiplier);
  const naiveOrders = Math.round(2490 * Math.pow(factor, 0.72) * 2.1 * armMultiplier);
  const randomOrders = Math.round(1142 * factor * 4.0 * armMultiplier);

  const dmlProfit = Math.round(dmlOrders * 38.2);
  const naiveProfit = Math.round(naiveOrders * 26.4);
  const randomProfit = Math.round(randomOrders * 12.0);

  const getDmlCurve = () => {
    if (currentArm === '20') {
      return {
        path: 'M 70 310 Q 130 160, 230 90 T 440 50 T 620 48 L 740 48',
        area: 'M 70 310 Q 130 160, 230 90 T 440 50 T 620 48 L 740 48 L 740 310 Z',
        naive: 'M 70 310 Q 170 210, 310 140 T 550 80 L 740 48',
      };
    }
    if (currentArm === '10') {
      return {
        path: 'M 70 310 Q 150 200, 250 140 T 460 90 T 620 85 L 740 85',
        area: 'M 70 310 Q 150 200, 250 140 T 460 90 T 620 85 L 740 85 L 740 310 Z',
        naive: 'M 70 310 Q 190 250, 330 180 T 570 120 L 740 85',
      };
    }
    return {
      path: 'M 70 310 Q 140 180, 240 115 T 450 68 T 620 62 L 740 62',
      area: 'M 70 310 Q 140 180, 240 115 T 450 68 T 620 62 L 740 62 L 740 310 Z',
      naive: 'M 70 310 Q 180 230, 320 160 T 560 95 L 740 62',
    };
  };

  const curves = getDmlCurve();

  const normX = Math.min(Math.max((hoverPosition - 70) / 670, 0), 1);
  const dotDmlY = 310 - Math.pow(normX, 0.45) * 248;
  const dotNaiveY = 310 - Math.pow(normX, 0.75) * 248;
  const dotRandomY = 310 - normX * 248;

  return (
    <div className="w-full flex flex-col gap-6">
      {}
      <section className="w-full p-5 sm:p-6 rounded-lg bg-white border border-[#bec8ce]/50 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded border border-[#2e94b9]/30 bg-[#2e94b9]/10 text-[#006481] font-label-code text-xs uppercase font-semibold">
              EconML CausalForestDML
            </span>
            <span className="font-label-code text-slate-400">•</span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#131d20] tracking-tight font-medium">
              Causal Uplift &amp; Benchmark Evaluation
            </h1>
            <span className="px-2 py-0.5 rounded border border-[#bec8ce]/50 bg-[#eaf5f9] text-[#475053] font-label-code text-xs">
              v2.4 DoubleML Kernel
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#475053] max-w-4xl leading-relaxed">
            Individual Treatment Effect (ITE) distribution for $10 and $20 discounts vs. baseline control ($0), validated against Naive T-Learner propensity models and theoretical synthetic oracle benchmarks.
          </p>
        </div>

        {}
        <div className="flex items-center gap-3 overflow-x-auto py-1">
          <div className="flex items-center gap-3 px-3.5 py-2 rounded border border-[#bec8ce]/50 bg-[#f8fdff] shadow-xs">
            <div className="flex flex-col">
              <span className="font-label-code text-[10px] text-slate-400 uppercase tracking-wider">Qini Score</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-data-metric text-xl text-[#006481] font-semibold">0.684</span>
                <span className="font-label-code text-xs text-[#2e94b9] font-medium flex items-center">▲ +41.0%</span>
              </div>
            </div>
            <div className="h-6 w-px bg-[#bec8ce]/40"></div>
            <span className="font-label-code text-xs text-slate-500">vs Naive T-Learner</span>
          </div>

          <div className="flex items-center gap-3 px-3.5 py-2 rounded border border-[#bec8ce]/50 bg-[#f8fdff] shadow-xs">
            <div className="flex flex-col">
              <span className="font-label-code text-[10px] text-slate-400 uppercase tracking-wider">PEHE Metric</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-data-metric text-xl text-[#2e94b9] font-semibold">0.0084</span>
                <span className="font-label-code text-xs text-slate-500">σ_err</span>
              </div>
            </div>
            <div className="h-6 w-px bg-[#bec8ce]/40"></div>
            <span className="font-label-code text-xs text-slate-500">Synthetic True Effect</span>
          </div>
        </div>
      </section>

      {}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {}
        <div className="bg-white border border-[#bec8ce]/50 rounded-lg p-3.5 flex flex-col justify-between shadow-xs relative overflow-hidden hover:border-[#006481] transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#006481]"></div>
          <div className="flex items-start justify-between">
            <span className="font-label-code text-[10px] text-slate-400 uppercase tracking-wider">CausalForest Qini</span>
            <span className="material-symbols-outlined text-sm text-[#006481]">verified</span>
          </div>
          <div className="mt-2">
            <div className="font-data-metric text-2xl text-[#006481] tracking-tight">0.684</div>
            <div className="flex items-center gap-1 font-label-code text-xs text-slate-500 mt-0.5">
              <span className="text-[#006481] font-semibold">Benchmark Leader</span>
              <span>(cv=5)</span>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white border border-[#bec8ce]/50 rounded-lg p-3.5 flex flex-col justify-between shadow-xs relative overflow-hidden hover:border-red-500 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#ba1a1a]"></div>
          <div className="flex items-start justify-between">
            <span className="font-label-code text-[10px] text-slate-400 uppercase tracking-wider">Naive T-Learner</span>
            <span className="material-symbols-outlined text-sm text-red-600">trending_down</span>
          </div>
          <div className="mt-2">
            <div className="font-data-metric text-2xl text-[#131d20] tracking-tight">0.485</div>
            <div className="flex items-center gap-1 font-label-code text-xs text-red-600 mt-0.5">
              <span>▼ -29.1% lower</span>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white border border-[#bec8ce]/50 rounded-lg p-3.5 flex flex-col justify-between shadow-xs relative overflow-hidden hover:border-slate-500 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400"></div>
          <div className="flex items-start justify-between">
            <span className="font-label-code text-[10px] text-slate-400 uppercase tracking-wider">Random Baseline</span>
            <span className="material-symbols-outlined text-sm text-slate-400">shuffle</span>
          </div>
          <div className="mt-2">
            <div className="font-data-metric text-2xl text-slate-600 tracking-tight">0.000</div>
            <div className="flex items-center gap-1 font-label-code text-xs text-slate-500 mt-0.5">
              <span>Uniform Allocation</span>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white border border-[#bec8ce]/50 rounded-lg p-3.5 flex flex-col justify-between shadow-xs relative overflow-hidden hover:border-[#2e94b9] transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#2e94b9]"></div>
          <div className="flex items-start justify-between">
            <span className="font-label-code text-[10px] text-slate-400 uppercase tracking-wider">PEHE Precision</span>
            <span className="material-symbols-outlined text-sm text-[#2e94b9]">biotech</span>
          </div>
          <div className="mt-2">
            <div className="font-data-metric text-2xl text-[#2e94b9] tracking-tight">0.0084</div>
            <div className="flex items-center gap-1 font-label-code text-xs text-slate-500 mt-0.5">
              <span>Ground Truth RMSE</span>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white border border-[#bec8ce]/50 rounded-lg p-3.5 flex flex-col justify-between shadow-xs relative overflow-hidden hover:border-slate-700 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#475053]"></div>
          <div className="flex items-start justify-between">
            <span className="font-label-code text-[10px] text-slate-400 uppercase tracking-wider">ATE Arm $10</span>
            <span className="material-symbols-outlined text-sm text-slate-600">local_atm</span>
          </div>
          <div className="mt-2">
            <div className="font-data-metric text-2xl text-[#131d20] tracking-tight">+8.4%</div>
            <div className="flex items-center gap-1 font-label-code text-xs text-slate-500 mt-0.5">
              <span>CI: [+7.9%, +8.9%]</span>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white border border-[#bec8ce]/50 rounded-lg p-3.5 flex flex-col justify-between shadow-xs relative overflow-hidden hover:border-[#007ea2] transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#007ea2]"></div>
          <div className="flex items-start justify-between">
            <span className="font-label-code text-[10px] text-slate-400 uppercase tracking-wider">ATE Arm $20</span>
            <span className="material-symbols-outlined text-sm text-[#007ea2]">payments</span>
          </div>
          <div className="mt-2">
            <div className="font-data-metric text-2xl text-[#007ea2] tracking-tight">+14.2%</div>
            <div className="flex items-center gap-1 font-label-code text-xs text-slate-500 mt-0.5">
              <span>CI: [+13.5%, +14.9%]</span>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {}
        <div className="xl:col-span-7 bg-white border border-[#bec8ce]/50 rounded-lg p-5 sm:p-6 shadow-sm flex flex-col gap-4">
          {}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#bec8ce]/40">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006481] text-lg">stacked_line_chart</span>
                <h2 className="font-serif text-lg text-[#131d20] font-semibold">Cumulative Gains &amp; Qini Curve</h2>
              </div>
              <span className="font-label-code text-xs text-slate-500">
                Sorting: Descending Estimated Treatment Effect (ITE τ̂_i)
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {}
              <div className="flex items-center bg-[#eaf5f9] p-0.5 rounded border border-[#bec8ce]/50">
                {(['joint', '20', '10'] as const).map(arm => (
                  <button
                    key={arm}
                    onClick={() => setCurrentArm(arm)}
                    className={`px-2.5 py-1 rounded font-label-code text-xs transition-all cursor-pointer ${
                      currentArm === arm
                        ? 'bg-white text-[#006481] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {arm === 'joint' ? 'Joint' : arm === '20' ? '$20 vs $0' : '$10 vs $0'}
                  </button>
                ))}
              </div>

              {}
              <button
                onClick={() => setMetricMode(metricMode === 'conversions' ? 'profit' : 'conversions')}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#eaf5f9] hover:bg-[#dfeaee] text-slate-800 border border-[#bec8ce]/60 font-label-code text-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs text-[#2e94b9]">swap_horiz</span>
                <span>{metricMode === 'conversions' ? 'Metric: Conversions' : 'Metric: Incremental Profit ($)'}</span>
              </button>
            </div>
          </div>

          {}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative w-full h-[380px] bg-[#f8fdff] border border-[#bec8ce]/40 rounded-lg p-4 overflow-hidden flex flex-col justify-between cursor-crosshair select-none"
          >
            {}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-[#bec8ce]/30" xmlns="http://www.w3.org/2000/svg">
              <line strokeDasharray="2,4" x1="10%" x2="95%" y1="15%" y2="15%"></line>
              <line strokeDasharray="2,4" x1="10%" x2="95%" y1="35%" y2="35%"></line>
              <line strokeDasharray="2,4" x1="10%" x2="95%" y1="55%" y2="55%"></line>
              <line strokeDasharray="2,4" x1="10%" x2="95%" y1="75%" y2="75%"></line>
              <line strokeDasharray="2,4" x1="31%" x2="31%" y1="10%" y2="85%"></line>
              <line strokeDasharray="2,4" x1="52%" x2="52%" y1="10%" y2="85%"></line>
              <line strokeDasharray="2,4" x1="73%" x2="73%" y1="10%" y2="85%"></line>
            </svg>

            {}
            <svg className="w-full h-full relative z-10 overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 360">
              <defs>
                <linearGradient id="primaryAreaGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2e94b9" stopOpacity="0.18"></stop>
                  <stop offset="100%" stopColor="#2e94b9" stopOpacity="0.0"></stop>
                </linearGradient>
              </defs>

              {}
              <path d={curves.area} fill="url(#primaryAreaGrad)"></path>

              {}
              <line opacity="0.6" stroke="#6f787e" strokeDasharray="4,4" strokeWidth="1.6" x1="70" x2="740" y1="310" y2="62"></line>

              {}
              <path d="M 70 310 L 220 50 L 740 50" fill="none" opacity="0.75" stroke="#475053" strokeDasharray="3,3" strokeWidth="1.6"></path>

              {}
              <path d={curves.naive} fill="none" opacity="0.9" stroke="#ba1a1a" strokeWidth="2"></path>

              {}
              <path d={curves.path} fill="none" stroke="#006481" strokeWidth="2.75"></path>

              {}
              <line stroke="#2e94b9" strokeDasharray="3,3" strokeWidth="1.5" x1={hoverPosition} x2={hoverPosition} y1="30" y2="310"></line>
              <circle cx={hoverPosition} cy={dotDmlY} fill="#006481" r="5" stroke="#ffffff" strokeWidth="2"></circle>
              <circle cx={hoverPosition} cy={dotNaiveY} fill="#ba1a1a" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
              <circle cx={hoverPosition} cy={dotRandomY} fill="#6f787e" r="3.5" stroke="#ffffff" strokeWidth="1.5"></circle>
            </svg>

            {}
            <div
              style={{
                left: hoverPosition > 450 ? `${Math.max(10, (hoverPosition / 800) * 100 - 32)}%` : `${(hoverPosition / 800) * 100 + 2}%`,
              }}
              className="absolute top-6 z-20 pointer-events-none bg-white/95 backdrop-blur-md p-3 rounded-lg border border-[#bec8ce] shadow-md flex flex-col gap-1 text-left min-w-[210px] transition-all duration-75"
            >
              <div className="flex items-center justify-between pb-1 border-b border-[#bec8ce]/40">
                <span className="font-label-code text-[10px] text-[#2e94b9] uppercase tracking-wider font-semibold">
                  Target Cutoff
                </span>
                <span className="font-label-code text-xs text-[#131d20] font-bold">
                  {hoverCutoff}% Population
                </span>
              </div>

              <div className="flex items-center justify-between font-label-code text-xs">
                <span className="flex items-center gap-1.5 text-[#006481] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#006481] inline-block"></span>
                  <span>CausalForest:</span>
                </span>
                <span className="font-bold text-[#131d20] font-data-metric">
                  {metricMode === 'conversions' ? `+${dmlOrders.toLocaleString()} orders` : `+$${dmlProfit.toLocaleString()} net`}
                </span>
              </div>

              <div className="flex items-center justify-between font-label-code text-xs">
                <span className="flex items-center gap-1.5 text-red-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
                  <span>Naive T-Learner:</span>
                </span>
                <span className="text-slate-600 font-data-metric">
                  {metricMode === 'conversions' ? `+${naiveOrders.toLocaleString()} orders` : `+$${naiveProfit.toLocaleString()} net`}
                </span>
              </div>

              <div className="flex items-center justify-between font-label-code text-xs">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                  <span>Random:</span>
                </span>
                <span className="text-slate-600 font-data-metric">
                  {metricMode === 'conversions' ? `+${randomOrders.toLocaleString()} orders` : `+$${randomProfit.toLocaleString()} net`}
                </span>
              </div>

              <div className="pt-1 mt-0.5 border-t border-[#bec8ce]/40 flex items-center justify-between font-label-code text-xs">
                <span className="text-slate-500">Efficiency Alpha:</span>
                <span className="text-[#006481] font-bold">
                  +{Math.round(((dmlOrders - naiveOrders) / Math.max(1, naiveOrders)) * 100)}% incremental
                </span>
              </div>
            </div>

            {}
            <div className="w-full flex justify-between px-8 pt-2 font-label-code text-xs text-slate-500">
              <span>0%</span>
              <span>20%</span>
              <span>40%</span>
              <span>60%</span>
              <span>80%</span>
              <span>100% (All Customers)</span>
            </div>
          </div>

          {}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 font-label-code text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 bg-[#006481] rounded-full"></span>
                <span className="text-[#131d20] font-semibold">EconML CausalForestDML (0.684)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 bg-[#ba1a1a] rounded-full"></span>
                <span className="text-slate-600">Naive T-Learner (0.485)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 bg-slate-400 rounded-full"></span>
                <span className="text-slate-500">Random (0.000)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 border-t border-dotted border-slate-700"></span>
                <span className="text-slate-600">Synthetic Oracle Bound</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <span className="material-symbols-outlined text-xs text-[#2e94b9]">speed</span>
              <span>Evaluated on 10,000 holdout tests</span>
            </div>
          </div>
        </div>

        {}
        <div className="xl:col-span-5 flex flex-col gap-6 min-w-0">
          {}
          <div className="bg-white border border-[#bec8ce]/50 rounded-lg p-5 sm:p-6 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2e94b9] text-base">bar_chart</span>
                <h3 className="font-serif text-lg text-[#131d20] font-semibold">ITE Heterogeneity Distribution</h3>
              </div>
              <span className="px-2 py-0.5 rounded border border-[#bec8ce]/50 bg-[#eaf5f9] font-label-code text-xs text-slate-600">
                N = 50,000
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Estimated Treatment Effect (Δ purchase probability) under promo discount. Notice bimodal separation between persuadables and indifferent cohorts.
            </p>

            {}
            <div className="w-full h-36 bg-[#f8fdff] border border-[#bec8ce]/40 rounded-lg p-2 relative flex flex-col justify-end">
              <div className="absolute top-2 left-4 px-2 py-0.5 rounded border border-red-300 bg-white/90 font-label-code text-[10px] text-red-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                <span>Sleeping Dogs &amp; Lost Causes (τ ≤ 0)</span>
              </div>
              <div className="absolute top-2 right-4 px-2 py-0.5 rounded border border-[#006481]/30 bg-white/90 font-label-code text-[10px] text-[#006481] flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006481]"></span>
                <span>Persuadables Cluster (+15% to +32%)</span>
              </div>

              <svg className="w-full h-24 overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 100">
                <line opacity="0.4" stroke="#ba1a1a" strokeDasharray="2,2" strokeWidth="1.5" x1="85" x2="85" y1="0" y2="100"></line>
                {}
                <rect fill="#ba1a1a" height="15" opacity="0.3" rx="1" width="12" x="25" y="85"></rect>
                <rect fill="#ba1a1a" height="28" opacity="0.45" rx="1" width="12" x="42" y="72"></rect>
                <rect fill="#6f787e" height="55" opacity="0.4" rx="1" width="12" x="60" y="45"></rect>
                <rect fill="#6f787e" height="80" opacity="0.6" rx="1" width="12" x="78" y="20"></rect>
                <rect fill="#6f787e" height="62" opacity="0.4" rx="1" width="12" x="96" y="38"></rect>
                <rect fill="#6f787e" height="32" opacity="0.3" rx="1" width="12" x="114" y="68"></rect>

                {}
                <rect fill="#475053" height="18" opacity="0.3" rx="1" width="12" x="135" y="82"></rect>
                <rect fill="#475053" height="22" opacity="0.4" rx="1" width="12" x="155" y="78"></rect>
                <rect fill="#2e94b9" height="35" opacity="0.3" rx="1" width="12" x="175" y="65"></rect>

                {}
                <rect fill="#006481" height="60" opacity="0.4" rx="1" width="12" x="195" y="40"></rect>
                <rect fill="#006481" height="75" opacity="0.6" rx="1" width="12" x="215" y="25"></rect>
                <rect fill="#006481" height="90" opacity="0.85" rx="1" width="12" x="235" y="10"></rect>
                <rect fill="#006481" height="84" opacity="0.75" rx="1" width="12" x="255" y="16"></rect>
                <rect fill="#006481" height="68" opacity="0.55" rx="1" width="12" x="275" y="32"></rect>
                <rect fill="#006481" height="45" opacity="0.4" rx="1" width="12" x="295" y="55"></rect>
                <rect fill="#006481" height="25" opacity="0.25" rx="1" width="12" x="315" y="75"></rect>
                <rect fill="#006481" height="12" opacity="0.15" rx="1" width="12" x="335" y="88"></rect>
              </svg>

              <div className="flex justify-between w-full pt-1.5 font-label-code text-[10px] text-slate-500">
                <span>-5% τ</span>
                <span className="text-red-600 font-semibold">0% (Baseline)</span>
                <span>+10%</span>
                <span className="text-[#006481] font-bold">+20%</span>
                <span>+35% τ</span>
              </div>
            </div>
          </div>

          {}
          <div className="bg-white border border-[#bec8ce]/50 rounded-lg p-5 sm:p-6 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#475053] text-base">dashboard_customize</span>
                <h3 className="font-serif text-lg text-[#131d20] font-semibold">4-Quadrant Causal Segmentation</h3>
              </div>
              <span className="font-label-code text-xs text-[#006481] font-semibold">
                Target Priority: Persuadables
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {}
              <div
                onClick={() => setActiveQuadrant(activeQuadrant === 'persuadables' ? null : 'persuadables')}
                className={`p-3.5 rounded border transition-all cursor-pointer ${
                  activeQuadrant === 'persuadables'
                    ? 'border-[#006481] bg-[#eaf5f9] ring-2 ring-[#006481]/30'
                    : 'border-[#2e94b9]/40 bg-[#f1fbff] hover:border-[#006481]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-serif text-sm font-bold text-[#006481]">1. Persuadables</span>
                    <span className="font-label-code text-[10px] text-slate-500">Low Base Buy, High Sensitivity</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-[#006481] text-white font-label-code text-[9px] uppercase font-bold">
                    Target
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-data-metric text-xl text-[#006481] font-bold">22.4%</span>
                    <span className="font-label-code text-xs text-[#006481] font-medium">11,200 users</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                    Only buy when discounted. Delivers 91% of total campaign net margin lift.
                  </p>
                </div>
              </div>

              {}
              <div
                onClick={() => setActiveQuadrant(activeQuadrant === 'sure_things' ? null : 'sure_things')}
                className={`p-3.5 rounded border transition-all cursor-pointer ${
                  activeQuadrant === 'sure_things'
                    ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-400'
                    : 'border-[#bec8ce]/50 bg-white hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-serif text-sm font-semibold text-[#131d20]">2. Sure Things</span>
                    <span className="font-label-code text-[10px] text-slate-500">High Base Buy (90%+), Δ ≈ 0</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-label-code text-[9px] uppercase">
                    Cannibal
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-data-metric text-xl text-[#131d20] font-semibold">31.8%</span>
                    <span className="font-label-code text-xs text-slate-500">15,900 users</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                    Buy regardless of discount. Offering promo burns margin with zero incremental conversions.
                  </p>
                </div>
              </div>

              {}
              <div
                onClick={() => setActiveQuadrant(activeQuadrant === 'lost_causes' ? null : 'lost_causes')}
                className={`p-3.5 rounded border transition-all cursor-pointer ${
                  activeQuadrant === 'lost_causes'
                    ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-400'
                    : 'border-[#bec8ce]/50 bg-white hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-serif text-sm font-semibold text-slate-500">3. Lost Causes</span>
                    <span className="font-label-code text-[10px] text-slate-400">Low Base Buy, Unresponsive</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-label-code text-[9px] uppercase">
                    Suppress
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-data-metric text-xl text-slate-500 font-semibold">38.6%</span>
                    <span className="font-label-code text-xs text-slate-400">19,300 users</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Zero conversion response under $10 or $20 promo. Exclude to preserve promotional budget.
                  </p>
                </div>
              </div>

              {}
              <div
                onClick={() => setActiveQuadrant(activeQuadrant === 'sleeping_dogs' ? null : 'sleeping_dogs')}
                className={`p-3.5 rounded border transition-all cursor-pointer ${
                  activeQuadrant === 'sleeping_dogs'
                    ? 'border-red-600 bg-red-50 ring-2 ring-red-300'
                    : 'border-red-200 bg-[#fff8f7] hover:border-red-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-serif text-sm font-bold text-red-600">4. Sleeping Dogs</span>
                    <span className="font-label-code text-[10px] text-slate-500">Negative Uplift (Churn)</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-label-code text-[9px] uppercase font-bold">
                    Exclude
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-data-metric text-xl text-red-600 font-semibold">7.2%</span>
                    <span className="font-label-code text-xs text-red-600 font-medium">3,600 users</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                    Unsubscribe or churn upon promotional contact. Strict negative treatment effect (τ &lt; 0).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="bg-white border border-[#bec8ce]/50 rounded-lg p-5 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#bec8ce]/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006481] text-base">tune</span>
            <h3 className="font-serif text-lg text-[#131d20] font-semibold">
              Decile Uplift Calibration &amp; Counterfactual Validation
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-label-code text-xs text-slate-500">Policy: SciPy MILP Constrained Maximizer</span>
            <button
              onClick={() => exportDecilesCSV(DECILE_DATA)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#bec8ce]/60 bg-white hover:bg-slate-50 text-[#131d20] font-label-code text-xs transition-colors cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-xs text-[#006481]">download</span>
              <span>Export Segment Deciles (CSV)</span>
            </button>
          </div>
        </div>

        {}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left font-label-code text-xs">
            <thead>
              <tr className="text-slate-500 text-[11px] uppercase tracking-wider bg-[#f8fdff] border-b border-[#bec8ce]/50">
                <th className="py-2.5 px-3 font-semibold">Targeting Decile</th>
                <th className="py-2.5 px-3 font-semibold">Population Size</th>
                <th className="py-2.5 px-3 font-semibold">Base Response Rate (Y₀)</th>
                <th className="py-2.5 px-3 font-semibold">Treated Response (Y₁)</th>
                <th className="py-2.5 px-3 text-right font-semibold">Estimated ITE (τ̂)</th>
                <th className="py-2.5 px-3 text-right font-semibold">Cumulative Qini</th>
                <th className="py-2.5 px-3 text-right font-semibold">Net Profit / Unit</th>
                <th className="py-2.5 px-3 text-center font-semibold">Quadrant Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bec8ce]/25">
              {DECILE_DATA.map((row) => {
                const isPersuadable = row.quadrant === 'Persuadable';
                const isSleepingDog = row.quadrant === 'Sleeping Dogs';
                return (
                  <tr key={row.decile} className={`hover:bg-[#f8fdff] ${isSleepingDog ? 'bg-red-50/30' : ''}`}>
                    <td className="py-2.5 px-3 font-semibold text-[#131d20] flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isPersuadable ? 'bg-[#006481]' : isSleepingDog ? 'bg-red-600' : 'bg-slate-400'
                      }`}></span>
                      <span>{row.decile}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-data-metric">{row.population_size.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-data-metric">{row.base_rate.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-slate-800 font-data-metric">{row.treated_rate.toFixed(1)}%</td>
                    <td className={`py-2.5 px-3 text-right font-semibold font-data-metric ${
                      row.ite > 0 ? 'text-[#006481]' : 'text-red-600'
                    }`}>
                      {row.ite > 0 ? `+${row.ite.toFixed(1)}%` : `${row.ite.toFixed(1)}%`}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">±{row.ite_se}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 font-data-metric">{row.cumulative_qini.toFixed(3)}</td>
                    <td className={`py-2.5 px-3 text-right font-bold font-data-metric ${
                      row.net_profit_unit > 0 ? 'text-[#006481]' : 'text-red-600'
                    }`}>
                      {row.net_profit_unit > 0 ? `+$${row.net_profit_unit.toFixed(2)}` : `-$${Math.abs(row.net_profit_unit).toFixed(2)}`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                        isPersuadable
                          ? 'border-[#2e94b9]/40 bg-[#2e94b9]/10 text-[#006481]'
                          : isSleepingDog
                          ? 'border-red-300 bg-red-100 text-red-800'
                          : 'border-slate-300 bg-slate-100 text-slate-600'
                      }`}>
                        {row.quadrant}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {}
      <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-[#bec8ce]/50 shadow-xs">
        <button
          onClick={() => onNavigate('causal-diagnostics')}
          className="px-4 py-2 rounded border border-[#bec8ce] text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xs">arrow_back</span>
          <span>Back: Causal Diagnostics</span>
        </button>

        <button
          onClick={() => onNavigate('budget-allocation')}
          className="px-4 py-2 rounded bg-[#006481] hover:bg-[#007ea2] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <span>Next: SciPy MILP Budget Allocation</span>
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
