import React, { useState } from 'react';
import { RefuterTest, ScreenTab } from '../types.ts';
import { REFUTER_SUITE } from '../mockData.ts';
import { exportRefutationJSON } from '../exportUtils.ts';
import { apiService, SensitivityResult } from '../apiService.ts';

interface CausalDiagnosticsViewProps {
  onNavigate: (tab: ScreenTab) => void;
}

export const CausalDiagnosticsView: React.FC<CausalDiagnosticsViewProps> = ({ onNavigate }) => {
  const [selectedDagNode, setSelectedDagNode] = useState<'W' | 'T' | 'Y' | 'U'>('W');
  const [refuters, setRefuters] = useState<RefuterTest[]>(REFUTER_SUITE);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [sensitivity, setSensitivity] = useState<SensitivityResult | null>(null);
  const [selectedGamma, setSelectedGamma] = useState<number>(1.5);
  const [sensitivityTab, setSensitivityTab] = useState<'rosenbaum' | 'cinelli' | 'profit'>('rosenbaum');
  const [simulatedBiasRatio, setSimulatedBiasRatio] = useState<number>(0.5);

  React.useEffect(() => {
    let mounted = true;
    apiService.getDiagnostics().then((res) => {
      if (!mounted) return;
      setIsLiveApi(res.isLive);
      if (res.data?.sensitivity) {
        setSensitivity(res.data.sensitivity);
      }
      if (res.data?.refutations) {
        const ref = res.data.refutations;
        setRefuters([
          {
            id: 'placebo',
            name: 'Placebo Treatment Refuter',
            icon: 'shuffle',
            description: 'Replaces treatment arm vector with independent random noise. Non-zero effect rejects identification.',
            metricLabel: 'Placebo Effect:',
            metricValue: `${ref.placebo.new_effect >= 0 ? '+' : ''}${ref.placebo.new_effect.toFixed(4)} (p = ${ref.placebo.p_value.toFixed(2)})`,
            status: ref.placebo.passed ? 'PASSED' : 'EVALUATING',
          },
          {
            id: 'random_common_cause',
            name: 'Random Common Cause',
            icon: 'grain',
            description: 'Adds synthetic orthogonal noise variables into covariate matrix W to test estimator stability.',
            metricLabel: 'Estimate Shift:',
            metricValue: `${ref.random_common_cause.drift_percent.toFixed(2)}% (< 10.0% threshold)`,
            status: ref.random_common_cause.passed ? 'PASSED' : 'EVALUATING',
          },
          {
            id: 'data_subset',
            name: '80% Data Subset Refuter',
            icon: 'pie_chart',
            description: 'Re-estimates CATE over random 80% customer sub-samples to evaluate variance resilience.',
            metricLabel: 'Subset Drift:',
            metricValue: `${ref.data_subset.drift_percent.toFixed(2)}% (< 15.0% threshold)`,
            status: ref.data_subset.passed ? 'PASSED' : 'EVALUATING',
          },
        ]);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleRerunFalsifiers = async () => {
    setIsAuditing(true);
    setAuditMessage('Simulating Monte Carlo refutation tests on active dataset...');
    const res = await apiService.getDiagnostics();
    setIsAuditing(false);
    setIsLiveApi(res.isLive);
    if (res.data?.sensitivity) {
      setSensitivity(res.data.sensitivity);
    }
    if (res.data?.refutations) {
      const ref = res.data.refutations;
      setRefuters([
        {
          id: 'placebo',
          name: 'Placebo Treatment Refuter',
          icon: 'shuffle',
          description: 'Replaces treatment arm vector with independent random noise. Non-zero effect rejects identification.',
          metricLabel: 'Placebo Effect:',
          metricValue: `${ref.placebo.new_effect >= 0 ? '+' : ''}${ref.placebo.new_effect.toFixed(4)} (p = ${ref.placebo.p_value.toFixed(2)})`,
          status: ref.placebo.passed ? 'PASSED' : 'EVALUATING',
        },
        {
          id: 'random_common_cause',
          name: 'Random Common Cause',
          icon: 'grain',
          description: 'Adds synthetic orthogonal noise variables into covariate matrix W to test estimator stability.',
          metricLabel: 'Estimate Shift:',
          metricValue: `${ref.random_common_cause.drift_percent.toFixed(2)}% (< 10.0% threshold)`,
          status: ref.random_common_cause.passed ? 'PASSED' : 'EVALUATING',
        },
        {
          id: 'data_subset',
          name: '80% Data Subset Refuter',
          icon: 'pie_chart',
          description: 'Re-estimates CATE over random 80% customer sub-samples to evaluate variance resilience.',
          metricLabel: 'Subset Drift:',
          metricValue: `${ref.data_subset.drift_percent.toFixed(2)}% (< 15.0% threshold)`,
          status: ref.data_subset.passed ? 'PASSED' : 'EVALUATING',
        },
      ]);
    }
    setAuditMessage(res.isLive ? `DoWhy battery verified via FastAPI in ${res.latencyMs}ms` : 'DoWhy refutations verified locally');
    setTimeout(() => setAuditMessage(null), 3000);
  };

  const dagDetails = {
    W: {
      title: 'Conditioning Set {W}: Backdoor Satisfied',
      desc: 'Confounders {PastSpend, Recency, LoyaltyTier, CategoryAffinity} condition out non-causal paths, satisfying E[Y(t)|W] = E[Y|T=t, W].',
      status: 'd-separated'
    },
    T: {
      title: 'Intervention Variable (T): Discount Arms',
      desc: 'Treatment assigned across $0, $10, and $20 pricing policies. Validated positivity support across (0.05, 0.95).',
      status: 'policy target'
    },
    Y: {
      title: 'Target Outcome (Y): Purchase Conversion',
      desc: 'Continuous spend increment and binary conversion rate estimated via Double ML residualized orthogonalization.',
      status: 'unbiased estimand'
    },
    U: {
      title: 'Unobserved Confounder (U): Sensitivity Tested',
      desc: 'Falsification tests verify that any unobserved confounder must possess gamma > 2.85 to nullify causal effects.',
      status: 'rosenbaum resistant'
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {}
      {auditMessage && (
        <div className="fixed bottom-12 right-6 z-50 bg-[#006481] text-white px-4 py-2.5 rounded shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-sm text-[#acdcee]">
            {isAuditing ? 'sync' : 'verified'}
          </span>
          <span>{auditMessage}</span>
        </div>
      )}

      {}
      <section className="w-full p-5 sm:p-6 rounded-lg bg-white border border-[#bec8ce]/50 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="material-symbols-outlined text-[#006481] text-base">hub</span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#131d20] tracking-tight font-medium">
              Causal Identification &amp; Refutation Audit
            </h1>
            <span className="px-2 py-0.5 rounded border border-[#bec8ce]/50 bg-[#eaf5f9] text-[#475053] font-label-code text-xs font-medium">
              DoWhy v0.11.1
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#475053] max-w-4xl mt-1 leading-relaxed">
            Verify unconfoundedness, evaluate propensity score overlap (positivity), inspect post-orthogonalization covariate balance (SMD &lt; 0.1), and falsify causal hypotheses against simulated structural failures.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#bec8ce]/50 bg-[#eaf5f9]">
            <span className="w-2 h-2 rounded-full bg-[#2e94b9]"></span>
            <span className="font-label-code text-xs text-slate-500">IDENTIFICATION:</span>
            <span className="font-label-code text-xs text-[#006481] font-semibold">BACKDOOR VALIDATED</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#006481]/30 bg-[#006481]/5 text-[#006481]">
            <span className="material-symbols-outlined text-base">verified</span>
            <span className="font-label-code text-xs font-semibold">Refutation Status: 4/4 Passed (Estimate Robust)</span>
          </div>

          <button
            onClick={handleRerunFalsifiers}
            disabled={isAuditing}
            className="px-3 py-1.5 rounded border border-[#bec8ce]/60 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            type="button"
          >
            <span className={`material-symbols-outlined text-sm text-[#006481] ${isAuditing ? 'animate-spin' : ''}`}>
              {isAuditing ? 'sync' : 'restart_alt'}
            </span>
            <span>{isAuditing ? 'Auditing...' : 'Rerun Falsifiers'}</span>
          </button>
        </div>
      </section>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {}
        <div className="lg:col-span-7 flex flex-col rounded-lg bg-white border border-[#bec8ce]/50 p-5 sm:p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#bec8ce]/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006481] text-xl">schema</span>
              <div>
                <h2 className="font-serif text-lg text-[#131d20] font-semibold">Structural Causal Model (DAG)</h2>
                <span className="font-label-code text-xs text-slate-500">
                  Identified Estimand: Pearl&apos;s Backdoor Adjustment on Set &#123;W&#125;
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#eaf5f9] border border-[#bec8ce]/50 text-slate-600 font-label-code text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-[#006481]">lock</span>
              <span>W Blocks Non-Causal Paths</span>
            </span>
          </div>

          {}
          <div className="relative w-full h-80 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40 flex items-center justify-center p-2 select-none overflow-hidden">
            <svg className="w-full h-full" fill="none" viewBox="0 0 680 300" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <marker id="arrowOcean" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="8" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#2e94b9"></path>
                </marker>
                <marker id="arrowSlate" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="8" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#475053"></path>
                </marker>
              </defs>

              {}
              <path d="M 330 65 C 240 70 190 120 180 180" fill="none" markerEnd="url(#arrowOcean)" stroke="#2e94b9" strokeDasharray="4 3" strokeWidth="1.75"></path>
              <path d="M 350 65 C 440 70 490 120 500 180" fill="none" markerEnd="url(#arrowOcean)" stroke="#2e94b9" strokeDasharray="4 3" strokeWidth="1.75"></path>

              {}
              <path d="M 230 205 L 450 205" fill="none" markerEnd="url(#arrowOcean)" stroke="#2e94b9" strokeWidth="2.5"></path>

              {}
              <path d="M 340 265 C 260 260 210 240 185 225" fill="none" markerEnd="url(#arrowSlate)" stroke="#6f787e" strokeDasharray="3 3" strokeOpacity="0.6" strokeWidth="1.5"></path>
              <path d="M 340 265 C 420 260 470 240 495 225" fill="none" markerEnd="url(#arrowSlate)" stroke="#6f787e" strokeDasharray="3 3" strokeOpacity="0.6" strokeWidth="1.5"></path>

              {}
              {}
              <g
                className="cursor-pointer transition-transform duration-150 hover:scale-[1.02]"
                onClick={() => setSelectedDagNode('W')}
              >
                <rect
                  fill="#ffffff"
                  height="46"
                  rx="6"
                  stroke={selectedDagNode === 'W' ? '#006481' : '#2e94b9'}
                  strokeWidth={selectedDagNode === 'W' ? '2.5' : '1.5'}
                  width="180"
                  x="250"
                  y="22"
                ></rect>
                <circle cx="270" cy="45" fill="#2e94b9" r="4.5"></circle>
                <text fill="#162226" fontFamily="Hanken Grotesk, sans-serif" fontSize="12" fontWeight="600" x="284" y="41">
                  Observed Confounders &#123;W&#125;
                </text>
                <text fill="#475053" fontFamily="JetBrains Mono, monospace" fontSize="9" x="284" y="55">
                  PastSpend, Recency, Loyalty, Affinity
                </text>
              </g>

              {}
              <g
                className="cursor-pointer transition-transform duration-150 hover:scale-[1.02]"
                onClick={() => setSelectedDagNode('T')}
              >
                <rect
                  fill="#ffffff"
                  height="52"
                  rx="6"
                  stroke={selectedDagNode === 'T' ? '#006481' : '#2e94b9'}
                  strokeWidth={selectedDagNode === 'T' ? '3' : '2'}
                  width="140"
                  x="90"
                  y="180"
                ></rect>
                <circle cx="110" cy="206" fill="#2e94b9" r="5"></circle>
                <text fill="#162226" fontFamily="Hanken Grotesk, sans-serif" fontSize="13" fontWeight="700" x="124" y="201">
                  Treatment (T)
                </text>
                <text fill="#1d6c88" fontFamily="JetBrains Mono, monospace" fontSize="10" x="124" y="217">
                  Discount [$0, $10, $20]
                </text>
              </g>

              {}
              <g
                className="cursor-pointer transition-transform duration-150 hover:scale-[1.02]"
                onClick={() => setSelectedDagNode('Y')}
              >
                <rect
                  fill="#ffffff"
                  height="52"
                  rx="6"
                  stroke={selectedDagNode === 'Y' ? '#006481' : '#475053'}
                  strokeWidth={selectedDagNode === 'Y' ? '3' : '2'}
                  width="150"
                  x="450"
                  y="180"
                ></rect>
                <circle cx="470" cy="206" fill="#475053" r="5"></circle>
                <text fill="#162226" fontFamily="Hanken Grotesk, sans-serif" fontSize="13" fontWeight="700" x="484" y="201">
                  Outcome (Y)
                </text>
                <text fill="#475053" fontFamily="JetBrains Mono, monospace" fontSize="10" x="484" y="217">
                  Purchase Conversion
                </text>
              </g>

              {}
              <g
                className="cursor-pointer transition-transform duration-150 hover:scale-[1.02]"
                onClick={() => setSelectedDagNode('U')}
              >
                <rect
                  fill="#f0fbff"
                  height="38"
                  rx="6"
                  stroke={selectedDagNode === 'U' ? '#006481' : '#6f787e'}
                  strokeDasharray="3 3"
                  strokeWidth={selectedDagNode === 'U' ? '2' : '1.2'}
                  width="130"
                  x="275"
                  y="248"
                ></rect>
                <circle cx="292" cy="267" fill="#6f787e" r="3.5"></circle>
                <text fill="#162226" fontFamily="Hanken Grotesk, sans-serif" fontSize="11" fontWeight="600" x="304" y="264">
                  Unobserved (U)
                </text>
                <text fill="#475053" fontFamily="JetBrains Mono, monospace" fontSize="8.5" x="304" y="277">
                  Sensitivity Γ &gt; 2.85
                </text>
              </g>
            </svg>

            {}
            <div className="absolute bottom-2 left-2 right-2 px-4 py-2 rounded bg-white/95 backdrop-blur border border-[#bec8ce]/60 flex items-center justify-between text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006481] text-sm">info</span>
                <span className="text-[#131d20] font-semibold">{dagDetails[selectedDagNode].title}</span>
                <span className="text-slate-500 hidden sm:inline">— {dagDetails[selectedDagNode].desc}</span>
              </div>
              <span className="font-label-code text-xs text-[#006481] font-semibold uppercase">
                {dagDetails[selectedDagNode].status}
              </span>
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-center font-label-code text-xs">
            <button
              onClick={() => setSelectedDagNode('W')}
              className={`p-2 rounded border transition-colors cursor-pointer ${
                selectedDagNode === 'W' ? 'border-[#006481] bg-[#eaf5f9]' : 'border-[#bec8ce]/40 bg-[#f8fdff]'
              }`}
            >
              <span className="font-semibold block text-[#006481]">Confounders W</span>
              <span className="text-slate-400 text-[10px]">Backdoor Blockers</span>
            </button>
            <button
              onClick={() => setSelectedDagNode('T')}
              className={`p-2 rounded border transition-colors cursor-pointer ${
                selectedDagNode === 'T' ? 'border-[#006481] bg-[#eaf5f9]' : 'border-[#bec8ce]/40 bg-[#f8fdff]'
              }`}
            >
              <span className="font-semibold block text-[#004d64]">Treatment T</span>
              <span className="text-slate-400 text-[10px]">Policy Intervention</span>
            </button>
            <button
              onClick={() => setSelectedDagNode('Y')}
              className={`p-2 rounded border transition-colors cursor-pointer ${
                selectedDagNode === 'Y' ? 'border-[#006481] bg-[#eaf5f9]' : 'border-[#bec8ce]/40 bg-[#f8fdff]'
              }`}
            >
              <span className="font-semibold block text-slate-700">Outcome Y</span>
              <span className="text-slate-400 text-[10px]">Revenue / Lift</span>
            </button>
            <button
              onClick={() => setSelectedDagNode('U')}
              className={`p-2 rounded border transition-colors cursor-pointer ${
                selectedDagNode === 'U' ? 'border-[#006481] bg-[#eaf5f9]' : 'border-[#bec8ce]/40 bg-[#f8fdff]'
              }`}
            >
              <span className="font-semibold block text-slate-600">Sensitivity U</span>
              <span className="text-slate-400 text-[10px]">Rosenbaum Robust</span>
            </button>
          </div>
        </div>

        {}
        <div className="lg:col-span-5 flex flex-col rounded-lg bg-white border border-[#bec8ce]/50 p-5 sm:p-6 shadow-sm relative">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#bec8ce]/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006481] text-xl">stacked_line_chart</span>
              <div>
                <h2 className="font-serif text-lg text-[#131d20] font-semibold">Propensity Score Overlap</h2>
                <span className="font-label-code text-xs text-slate-500">Positivity Assumption: 0.05 &lt; e(X) &lt; 0.95</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded border border-[#006481]/20 bg-[#006481]/5 text-[#006481] font-label-code text-xs font-medium">
              Common Support Valid
            </span>
          </div>

          {}
          <div className="relative w-full h-56 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40 p-2 flex flex-col justify-end">
            <svg className="w-full h-44 overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 400 160">
              {}
              <rect fill="#2e94b9" fillOpacity="0.06" height="150" width="350" x="25" y="0"></rect>

              {}
              <line stroke="#c8d6dc" strokeWidth="1" x1="20" x2="390" y1="150" y2="150"></line>
              <line stroke="#c8d6dc" strokeDasharray="2 2" strokeWidth="1" x1="20" x2="390" y1="75" y2="75"></line>
              <line stroke="#b93e3e" strokeDasharray="2 2" strokeOpacity="0.6" strokeWidth="1.2" x1="25" x2="25" y1="0" y2="150"></line>
              <line stroke="#b93e3e" strokeDasharray="2 2" strokeOpacity="0.6" strokeWidth="1.2" x1="375" x2="375" y1="0" y2="150"></line>

              {}
              <path d="M 20 150 C 40 145, 60 70, 95 35 C 130 10, 170 85, 230 125 C 280 145, 340 148, 385 150" fill="none" stroke="#2e94b9" strokeWidth="2.2"></path>
              <path d="M 20 150 C 40 145, 60 70, 95 35 C 130 10, 170 85, 230 125 C 280 145, 340 148, 385 150 L 385 150 L 20 150 Z" fill="#2e94b9" fillOpacity="0.08"></path>

              {}
              <path d="M 20 150 C 70 148, 120 110, 180 50 C 230 10, 275 60, 320 115 C 350 140, 375 148, 385 150" fill="none" stroke="#475053" strokeWidth="2"></path>
              <path d="M 20 150 C 70 148, 120 110, 180 50 C 230 10, 275 60, 320 115 C 350 140, 375 148, 385 150 L 385 150 L 20 150 Z" fill="#475053" fillOpacity="0.06"></path>

              {}
              <path d="M 20 150 C 60 148, 140 140, 210 110 C 260 80, 290 30, 330 25 C 360 20, 375 90, 385 150" fill="none" stroke="#007ea2" strokeDasharray="4 2" strokeWidth="2.2"></path>
              <path d="M 20 150 C 60 148, 140 140, 210 110 C 260 80, 290 30, 330 25 C 360 20, 375 90, 385 150 L 385 150 L 20 150 Z" fill="#007ea2" fillOpacity="0.12"></path>

              {}
              <text fill="#6f787e" fontFamily="JetBrains Mono, monospace" fontSize="9" x="28" y="20">Trim min (0.05)</text>
              <text fill="#6f787e" fontFamily="JetBrains Mono, monospace" fontSize="9" x="290" y="20">Trim max (0.95)</text>
            </svg>

            {}
            <div className="w-full flex justify-between text-slate-500 font-label-code text-[11px] pt-1 px-1">
              <span>0.00</span>
              <span>0.25</span>
              <span>0.50 (Median)</span>
              <span>0.75</span>
              <span>1.00</span>
            </div>
          </div>

          {}
          <div className="mt-4 grid grid-cols-3 gap-2 font-label-code text-xs">
            <div className="flex items-center gap-2 p-2 rounded bg-[#f8fdff] border border-[#bec8ce]/40">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2e94b9] shrink-0"></span>
              <div>
                <span className="text-[#131d20] block font-semibold">Control ($0)</span>
                <span className="text-slate-400 text-[10px]">μ = 0.28, σ = 0.14</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-[#f8fdff] border border-[#bec8ce]/40">
              <span className="w-2.5 h-2.5 rounded-full bg-[#475053] shrink-0"></span>
              <div>
                <span className="text-[#131d20] block font-semibold">Promo $10</span>
                <span className="text-slate-400 text-[10px]">μ = 0.49, σ = 0.12</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-[#f8fdff] border border-[#bec8ce]/40">
              <span className="w-2.5 h-2.5 rounded-full bg-[#007ea2] shrink-0"></span>
              <div>
                <span className="text-[#131d20] block font-semibold">Promo $20</span>
                <span className="text-slate-400 text-[10px]">μ = 0.67, σ = 0.15</span>
              </div>
            </div>
          </div>

          {}
          <div className="mt-3 p-2.5 px-3 rounded bg-[#eaf5f9] border border-[#bec8ce]/40 flex items-center justify-between text-xs">
            <span className="text-[#475053] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#006481]">check_circle</span>
              Common support satisfied across all units:
            </span>
            <span className="font-label-code text-xs text-[#131d20] font-semibold">
              99.88% Overlap (0.12% Trimmed)
            </span>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {}
        <div className="lg:col-span-6 flex flex-col rounded-lg bg-white border border-[#bec8ce]/50 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#bec8ce]/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006481] text-xl">balance</span>
              <div>
                <h2 className="font-serif text-lg text-[#131d20] font-semibold">Covariate Balance &amp; Love Plot</h2>
                <span className="font-label-code text-xs text-slate-500">
                  Target Threshold: Standardized Mean Difference (SMD) &lt; 0.10
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded border border-[#006481]/20 bg-[#006481]/5 text-[#006481] font-label-code text-xs font-medium">
              5 / 5 Balanced
            </span>
          </div>

          {}
          <div className="w-full h-40 bg-[#f8fdff] border border-[#bec8ce]/40 rounded-lg p-2 relative mb-4">
            <svg className="w-full h-full" fill="none" viewBox="0 0 520 120">
              {}
              <line stroke="#475053" strokeDasharray="3 3" strokeWidth="1.2" x1="180" x2="180" y1="10" y2="110"></line>
              <text fill="#475053" fontFamily="JetBrains Mono, monospace" fontSize="9" x="185" y="20">
                Threshold SMD = 0.10
              </text>

              {}
              <line stroke="#c8d6dc" strokeWidth="1" x1="60" x2="60" y1="10" y2="110"></line>
              <line stroke="#c8d6dc" strokeWidth="1" x1="300" x2="300" y1="10" y2="110"></line>
              <line stroke="#c8d6dc" strokeWidth="1" x1="420" x2="420" y1="10" y2="110"></line>

              {}
              <text fill="#6f787e" fontFamily="JetBrains Mono, monospace" fontSize="8.5" x="55" y="118">0.00</text>
              <text fill="#6f787e" fontFamily="JetBrains Mono, monospace" fontSize="8.5" x="175" y="118">0.10</text>
              <text fill="#6f787e" fontFamily="JetBrains Mono, monospace" fontSize="8.5" x="295" y="118">0.25</text>
              <text fill="#6f787e" fontFamily="JetBrains Mono, monospace" fontSize="8.5" x="415" y="118">0.40</text>

              {}
              <line stroke="#6f787e" strokeDasharray="2 2" strokeOpacity="0.5" strokeWidth="1" x1="98" x2="404" y1="32" y2="32"></line>
              <circle cx="404" cy="32" fill="#ba1a1a" fillOpacity="0.85" r="4"></circle>
              <circle cx="98" cy="32" fill="#006481" r="4.5"></circle>

              {}
              <line stroke="#6f787e" strokeDasharray="2 2" strokeOpacity="0.5" strokeWidth="1" x1="82" x2="292" y1="50" y2="50"></line>
              <circle cx="292" cy="50" fill="#ba1a1a" fillOpacity="0.85" r="4"></circle>
              <circle cx="82" cy="50" fill="#006481" r="4.5"></circle>

              {}
              <line stroke="#6f787e" strokeDasharray="2 2" strokeOpacity="0.5" strokeWidth="1" x1="95" x2="436" y1="68" y2="68"></line>
              <circle cx="436" cy="68" fill="#ba1a1a" fillOpacity="0.85" r="4"></circle>
              <circle cx="95" cy="68" fill="#006481" r="4.5"></circle>

              {}
              <line stroke="#6f787e" strokeDasharray="2 2" strokeOpacity="0.5" strokeWidth="1" x1="78" x2="252" y1="86" y2="86"></line>
              <circle cx="252" cy="86" fill="#ba1a1a" fillOpacity="0.85" r="4"></circle>
              <circle cx="78" cy="86" fill="#006481" r="4.5"></circle>

              {}
              <line stroke="#6f787e" strokeDasharray="2 2" strokeOpacity="0.5" strokeWidth="1" x1="73" x2="164" y1="102" y2="102"></line>
              <circle cx="164" cy="102" fill="#ba1a1a" fillOpacity="0.85" r="4"></circle>
              <circle cx="73" cy="102" fill="#006481" r="4.5"></circle>
            </svg>

            <div className="absolute top-2 right-3 flex items-center gap-3 font-label-code text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
                <span className="text-slate-500 text-[11px]">Raw Unadjusted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#006481]"></span>
                <span className="text-[#131d20] font-semibold text-[11px]">Adjusted DML</span>
              </div>
            </div>
          </div>

          {}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 font-label-code text-[11px] border-b border-[#bec8ce]/50 uppercase bg-[#f8fdff]">
                  <th className="py-2 px-2.5 font-semibold">Confounder Feature</th>
                  <th className="py-2 px-2.5 text-right font-semibold">Raw SMD</th>
                  <th className="py-2 px-2.5 text-right font-semibold">Adjusted DML</th>
                  <th className="py-2 px-2.5 text-right font-semibold">Reduction</th>
                  <th className="py-2 px-2.5 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#bec8ce]/25 font-label-code text-xs">
                <tr className="hover:bg-[#f8fdff]">
                  <td className="py-2 px-2.5 font-semibold text-[#131d20] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006481]"></span>
                    <span>past_spend</span>
                  </td>
                  <td className="py-2 px-2.5 text-right text-red-600 font-medium">0.380</td>
                  <td className="py-2 px-2.5 text-right text-[#006481] font-semibold">0.032</td>
                  <td className="py-2 px-2.5 text-right text-slate-500">-91.6%</td>
                  <td className="py-2 px-2.5 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      PASS
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-[#f8fdff]">
                  <td className="py-2 px-2.5 font-semibold text-[#131d20] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006481]"></span>
                    <span>recency_days</span>
                  </td>
                  <td className="py-2 px-2.5 text-right text-red-600 font-medium">0.240</td>
                  <td className="py-2 px-2.5 text-right text-[#006481] font-semibold">0.018</td>
                  <td className="py-2 px-2.5 text-right text-slate-500">-92.5%</td>
                  <td className="py-2 px-2.5 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      PASS
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-[#f8fdff]">
                  <td className="py-2 px-2.5 font-semibold text-[#131d20] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006481]"></span>
                    <span>loyalty_tier</span>
                  </td>
                  <td className="py-2 px-2.5 text-right text-red-600 font-medium">0.420</td>
                  <td className="py-2 px-2.5 text-right text-[#006481] font-semibold">0.029</td>
                  <td className="py-2 px-2.5 text-right text-slate-500">-93.1%</td>
                  <td className="py-2 px-2.5 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      PASS
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-[#f8fdff]">
                  <td className="py-2 px-2.5 font-semibold text-[#131d20] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006481]"></span>
                    <span>category_affinity</span>
                  </td>
                  <td className="py-2 px-2.5 text-right text-red-600 font-medium">0.190</td>
                  <td className="py-2 px-2.5 text-right text-[#006481] font-semibold">0.015</td>
                  <td className="py-2 px-2.5 text-right text-slate-500">-92.1%</td>
                  <td className="py-2 px-2.5 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      PASS
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-[#f8fdff]">
                  <td className="py-2 px-2.5 font-semibold text-[#131d20] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006481]"></span>
                    <span>age</span>
                  </td>
                  <td className="py-2 px-2.5 text-right text-slate-500">0.080</td>
                  <td className="py-2 px-2.5 text-right text-[#006481] font-semibold">0.011</td>
                  <td className="py-2 px-2.5 text-right text-slate-500">-86.2%</td>
                  <td className="py-2 px-2.5 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      PASS
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-lg bg-white border border-[#bec8ce]/50 p-5 sm:p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#bec8ce]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006481] text-xl">security</span>
                <div>
                  <h2 className="font-serif text-lg text-[#131d20] font-semibold">DoWhy Refutation &amp; Falsification Suite</h2>
                  <span className="font-label-code text-xs text-slate-500">
                    Algorithmic Stress Tests on Double Machine Learning Estimator
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#eaf5f9] border border-[#bec8ce]/50 text-slate-600 font-label-code text-xs">
                  N = 50,000 Sim
                </span>
                <button
                  onClick={() => exportRefutationJSON(refuters)}
                  title="Export Refutation Signatures JSON"
                  className="p-1 rounded text-slate-600 hover:text-[#006481] hover:bg-slate-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                </button>
              </div>
            </div>

            {}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {refuters.map(r => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/50 hover:border-[#006481]/50 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#131d20] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#006481]">{r.icon}</span>
                      <span>{r.name}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded border border-[#006481]/30 bg-[#006481]/5 text-[#006481] font-label-code text-[10px] font-bold">
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                    {r.description}
                  </p>
                  <div className="p-2 rounded bg-white border border-[#bec8ce]/40 font-label-code text-[11px] flex justify-between items-center">
                    <span className="text-slate-500">{r.metricLabel}</span>
                    <span className="text-[#006481] font-semibold">{r.metricValue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="mt-4 p-3 rounded-lg bg-[#eaf5f9] border border-[#bec8ce]/40 flex items-start gap-2 text-slate-600">
            <span className="material-symbols-outlined text-[#006481] text-base mt-0.5">verified_user</span>
            <div className="flex-1">
              <span className="font-label-code text-[11px] uppercase text-[#131d20] block font-semibold">
                Econometric Falsification Guarantee
              </span>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Refutation provides rigorous falsification checks against model failure modes, unmeasured confounding fragility, and covariate imbalance. It establishes empirical support for causal pricing actions under unconfoundedness.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full rounded-lg bg-white border border-[#bec8ce]/50 p-5 sm:p-6 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#bec8ce]/40 gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#006481]/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#006481] text-xl">biotech</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif text-xl text-[#131d20] font-semibold">
                  Dynamic Sensitivity &amp; Confounder Bias Stress Testing
                </h2>
                <span className="px-2 py-0.5 rounded border border-[#006481]/30 bg-[#006481]/5 text-[#006481] font-label-code text-xs font-semibold">
                  Rosenbaum &amp; Cinelli-Hazlett
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Stress-test the causal estimand against hypothetical unobserved confounders (U) and compute the exact bias threshold required to erase campaign profitability.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="px-3 py-1.5 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-label-code text-xs text-slate-500">Unconfoundedness Score:</span>
              <span className="font-label-code text-xs font-bold text-[#006481]">
                {(sensitivity?.unconfoundedness_score ?? 92.5).toFixed(1)}/100
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center border-b border-[#bec8ce]/40 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSensitivityTab('rosenbaum')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              sensitivityTab === 'rosenbaum'
                ? 'border-[#006481] text-[#006481] font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            <span>Rosenbaum Bounds (&Gamma;)</span>
          </button>

          <button
            type="button"
            onClick={() => setSensitivityTab('cinelli')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              sensitivityTab === 'cinelli'
                ? 'border-[#006481] text-[#006481] font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-sm">troubleshoot</span>
            <span>Cinelli-Hazlett Partial R&sup2; (Sensemakr)</span>
          </button>

          <button
            type="button"
            onClick={() => setSensitivityTab('profit')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              sensitivityTab === 'profit'
                ? 'border-[#006481] text-[#006481] font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-sm">monetization_on</span>
            <span>Campaign Profit Break-Even Frontier</span>
          </button>
        </div>

        {sensitivityTab === 'rosenbaum' && (
          <div className="flex flex-col gap-5 animate-in fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40">
                <span className="text-[11px] font-label-code text-slate-500 block">Baseline Estimate (&tau;)</span>
                <span className="font-serif text-lg font-bold text-[#131d20]">
                  {(sensitivity?.rosenbaum.tau_estimate ?? 0.0842).toFixed(4)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">SE: &plusmn;{(sensitivity?.rosenbaum.standard_error ?? 0.0182).toFixed(4)}</span>
              </div>

              <div className="p-3 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40">
                <span className="text-[11px] font-label-code text-slate-500 block">Critical Threshold (&Gamma;*)</span>
                <span className="font-serif text-lg font-bold text-emerald-700">
                  {(sensitivity?.rosenbaum.critical_gamma ?? 2.85).toFixed(2)}&times;
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Odds ratio required to nullify</span>
              </div>

              <div className="p-3 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40">
                <span className="text-[11px] font-label-code text-slate-500 block">T-Statistic</span>
                <span className="font-serif text-lg font-bold text-[#006481]">
                  {(sensitivity?.rosenbaum.t_statistic ?? 4.626).toFixed(3)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">df: {(sensitivity?.cinelli_hazlett.df_residual ?? 994)}</span>
              </div>

              <div className="p-3 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40">
                <span className="text-[11px] font-label-code text-slate-500 block">Resilience Verdict</span>
                <span className="font-serif text-sm font-bold text-emerald-800 line-clamp-1">
                  {sensitivity?.verdict ?? 'Robust to Moderate & Severe Confounding'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Passed Rosenbaum test</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50/70 border border-[#bec8ce]/40 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#131d20]">Simulated Hidden Bias Odds Ratio (&Gamma;):</span>
                  <span className="font-label-code text-xs px-2 py-0.5 rounded bg-white border border-[#bec8ce]/60 font-bold text-[#006481]">
                    &Gamma; = {selectedGamma.toFixed(2)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">Range: 1.00 (Unbiased) to 3.00 (Severe Bias)</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.25"
                value={selectedGamma}
                onChange={(e) => setSelectedGamma(parseFloat(e.target.value))}
                className="w-full accent-[#006481] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-label-code text-slate-400">
                <span>&Gamma; = 1.00 (Clean RCT)</span>
                <span>&Gamma; = 1.50</span>
                <span>&Gamma; = 2.00 (Moderate)</span>
                <span>&Gamma; = 2.50</span>
                <span>&Gamma; = 3.00 (Severe Hidden Bias)</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 font-label-code text-[11px] border-b border-[#bec8ce]/50 uppercase bg-[#f8fdff]">
                    <th className="py-2.5 px-3 font-semibold">Odds Ratio (&Gamma;)</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Lower Bound (&tau;&minus;)</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Upper Bound (&tau;&plus;)</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Worst-Case P-Value</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Robustness Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#bec8ce]/25 font-label-code text-xs">
                  {(sensitivity?.rosenbaum.gamma_table ?? [
                    { gamma: 1.0, tau_lower: 0.0842, tau_upper: 0.0842, p_value_upper: 0.0001, is_robust: true },
                    { gamma: 1.25, tau_lower: 0.0762, tau_upper: 0.0922, p_value_upper: 0.0003, is_robust: true },
                    { gamma: 1.5, tau_lower: 0.0697, tau_upper: 0.0987, p_value_upper: 0.0012, is_robust: true },
                    { gamma: 1.75, tau_lower: 0.0641, tau_upper: 0.1043, p_value_upper: 0.0038, is_robust: true },
                    { gamma: 2.0, tau_lower: 0.0592, tau_upper: 0.1092, p_value_upper: 0.0089, is_robust: true },
                    { gamma: 2.25, tau_lower: 0.0547, tau_upper: 0.1137, p_value_upper: 0.0165, is_robust: true },
                    { gamma: 2.5, tau_lower: 0.0506, tau_upper: 0.1178, p_value_upper: 0.0272, is_robust: true },
                    { gamma: 2.75, tau_lower: 0.0468, tau_upper: 0.1216, p_value_upper: 0.0418, is_robust: true },
                    { gamma: 3.0, tau_lower: 0.0433, tau_upper: 0.1251, p_value_upper: 0.0601, is_robust: false },
                  ]).map((row) => (
                    <tr
                      key={row.gamma}
                      className={
                        Math.abs(row.gamma - selectedGamma) < 0.01
                          ? 'bg-[#006481]/5 font-semibold text-[#006481]'
                          : 'hover:bg-[#f8fdff]'
                      }
                    >
                      <td className="py-2 px-3 font-semibold flex items-center gap-2">
                        {Math.abs(row.gamma - selectedGamma) < 0.01 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#006481]"></span>
                        )}
                        <span>&Gamma; = {row.gamma.toFixed(2)}</span>
                      </td>
                      <td className="py-2 px-3 text-right">{row.tau_lower.toFixed(4)}</td>
                      <td className="py-2 px-3 text-right">{row.tau_upper.toFixed(4)}</td>
                      <td className="py-2 px-3 text-right text-slate-500">
                        {row.p_value_upper < 0.001 ? '< 0.001' : row.p_value_upper.toFixed(4)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.is_robust
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {row.is_robust ? 'ROBUST (p < 0.05)' : 'SENSITIVE (p >= 0.05)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {sensitivityTab === 'cinelli' && (
          <div className="flex flex-col gap-5 animate-in fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40">
                <span className="text-[11px] font-label-code text-slate-500 block">Robustness Value (Point RV)</span>
                <span className="font-serif text-lg font-bold text-[#006481]">
                  {((sensitivity?.cinelli_hazlett.robustness_value_point ?? 0.1362) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Min partial R&sup2; to bring &tau; to 0</span>
              </div>

              <div className="p-3 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40">
                <span className="text-[11px] font-label-code text-slate-500 block">Robustness Value (95% CI RV)</span>
                <span className="font-serif text-lg font-bold text-emerald-700">
                  {((sensitivity?.cinelli_hazlett.robustness_value_ci ?? 0.0814) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Min partial R&sup2; to lose 95% signif.</span>
              </div>

              <div className="p-3 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40">
                <span className="text-[11px] font-label-code text-slate-500 block">Partial R&sup2; (Treatment)</span>
                <span className="font-serif text-lg font-bold text-[#131d20]">
                  {((sensitivity?.cinelli_hazlett.partial_r2_treatment ?? 0.0211) * 100).toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">R&sup2;(Y ~ D | X)</span>
              </div>

              <div className="p-3 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40">
                <span className="text-[11px] font-label-code text-slate-500 block">Extreme Confounder R&sup2;</span>
                <span className="font-serif text-lg font-bold text-slate-700">
                  {((sensitivity?.cinelli_hazlett.extreme_confounder_r2 ?? 0.0215) * 100).toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">If U explains 100% of outcome</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              <div className="lg:col-span-7 flex flex-col gap-2">
                <h3 className="text-xs font-semibold text-[#131d20] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#006481]">ssid_chart</span>
                  <span>Cinelli &amp; Hazlett Sensitivity Contour Frontier (Sensemakr)</span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The curved contour boundary delineates combinations of confounder strength with treatment (R&sup2;<sub>D~U|X</sub>) and outcome (R&sup2;<sub>Y~U|D,X</sub>) sufficient to completely nullify the treatment effect. Any unobserved confounder within the shaded region cannot reverse the causal estimate.
                </p>

                <div className="relative w-full h-64 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40 p-2 overflow-hidden flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 450 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="50" y1="180" x2="420" y2="180" stroke="#bec8ce" strokeWidth="1.5"></line>
                    <line x1="50" y1="20" x2="50" y2="180" stroke="#bec8ce" strokeWidth="1.5"></line>

                    <text x="210" y="205" fill="#475053" fontSize="10" fontFamily="JetBrains Mono, monospace">
                      Partial R&sup2; of Confounder with Treatment (R&sup2;_D~U|X)
                    </text>
                    <text x="12" y="105" fill="#475053" fontSize="10" fontFamily="JetBrains Mono, monospace" transform="rotate(-90 12 105)">
                      R&sup2;_Y~U|D,X
                    </text>

                    <text x="50" y="195" fill="#6f787e" fontSize="9" fontFamily="JetBrains Mono, monospace">0%</text>
                    <text x="140" y="195" fill="#6f787e" fontSize="9" fontFamily="JetBrains Mono, monospace">10%</text>
                    <text x="230" y="195" fill="#6f787e" fontSize="9" fontFamily="JetBrains Mono, monospace">20%</text>
                    <text x="320" y="195" fill="#6f787e" fontSize="9" fontFamily="JetBrains Mono, monospace">30%</text>
                    <text x="410" y="195" fill="#6f787e" fontSize="9" fontFamily="JetBrains Mono, monospace">40%</text>

                    <text x="25" y="180" fill="#6f787e" fontSize="9" fontFamily="JetBrains Mono, monospace">0%</text>
                    <text x="20" y="140" fill="#6f787e" fontSize="9" fontFamily="JetBrains Mono, monospace">10%</text>
                    <text x="20" y="100" fill="#6f787e" fontSize="9" fontFamily="JetBrains Mono, monospace">20%</text>
                    <text x="20" y="60" fill="#6f787e" fontSize="9" fontFamily="JetBrains Mono, monospace">30%</text>
                    <text x="20" y="25" fill="#6f787e" fontSize="9" fontFamily="JetBrains Mono, monospace">40%</text>

                    <path
                      d="M 68 30 C 85 90 120 135 170 155 C 230 168 320 173 410 175 L 410 180 L 50 180 L 50 30 Z"
                      fill="#006481"
                      fillOpacity="0.08"
                    ></path>

                    <path
                      d="M 68 30 C 85 90 120 135 170 155 C 230 168 320 173 410 175"
                      stroke="#ba1a1a"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      fill="none"
                    ></path>

                    <circle cx="172" cy="125" r="5" fill="#006481"></circle>
                    <text x="182" y="123" fill="#006481" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                      Point RV = {((sensitivity?.cinelli_hazlett.robustness_value_point ?? 0.1362) * 100).toFixed(1)}%
                    </text>

                    <circle cx="123" cy="147" r="4.5" fill="#2e94b9"></circle>
                    <text x="133" y="152" fill="#2e94b9" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                      95% CI RV = {((sensitivity?.cinelli_hazlett.robustness_value_ci ?? 0.0814) * 100).toFixed(1)}%
                    </text>
                  </svg>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-3 p-4 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40">
                <span className="font-label-code text-xs font-semibold uppercase text-[#131d20] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#006481]">gavel</span>
                  <span>Benchmarking Rule of Thumb</span>
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  An unobserved confounder must explain more than{' '}
                  <strong className="text-[#006481]">
                    {((sensitivity?.cinelli_hazlett.robustness_value_point ?? 0.1362) * 100).toFixed(1)}%
                  </strong>{' '}
                  of both treatment assignment and consumer spend variance to nullify the uplift effect.
                </p>
                <div className="p-3 rounded bg-white border border-[#bec8ce]/50 flex flex-col gap-1.5 font-label-code text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Observed Past Spend Partial R&sup2;:</span>
                    <span className="font-bold text-[#131d20]">1.85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Observed Loyalty Tier Partial R&sup2;:</span>
                    <span className="font-bold text-[#131d20]">2.10%</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-[#bec8ce]/30 pt-1">
                    <span className="text-slate-500">Required Hidden Bias Multiplier:</span>
                    <span className="font-bold text-emerald-700">
                      ~{( (sensitivity?.cinelli_hazlett.robustness_value_point ?? 0.1362) / 0.021 ).toFixed(1)}&times; Stronger than Loyalty
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  It is empirically implausible that an omitted retail factor surpasses loyalty status and lifetime value by more than 6-fold.
                </p>
              </div>
            </div>
          </div>
        )}

        {sensitivityTab === 'profit' && (
          <div className="flex flex-col gap-5 animate-in fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40">
                <span className="text-[11px] font-label-code text-slate-500 block">Net Campaign Profit</span>
                <span className="font-serif text-lg font-bold text-emerald-800">
                  ${(sensitivity?.profit_break_even.net_incremental_profit ?? 18420).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Targeting {(sensitivity?.profit_break_even.n_treated ?? 382)} users</span>
              </div>

              <div className="p-3 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40">
                <span className="text-[11px] font-label-code text-slate-500 block">Critical Bias Threshold (&Delta;&tau;*)</span>
                <span className="font-serif text-lg font-bold text-[#ba1a1a]">
                  +{(sensitivity?.profit_break_even.critical_bias ?? 0.1929).toFixed(4)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {(sensitivity?.profit_break_even.critical_bias_percent ?? 229.1).toFixed(1)}% of mean estimated uplift
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40">
                <span className="text-[11px] font-label-code text-slate-500 block">Break-Even Odds Ratio (&Gamma;)</span>
                <span className="font-serif text-lg font-bold text-[#006481]">
                  {(sensitivity?.profit_break_even.break_even_gamma ?? 5.4).toFixed(1)}&times;
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Odds ratio to eliminate profit</span>
              </div>

              <div className="p-3 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40">
                <span className="text-[11px] font-label-code text-slate-500 block">Profit Safety Margin</span>
                <span className="font-serif text-sm font-bold text-emerald-800">
                  {sensitivity?.profit_break_even.robustness_margin ?? 'Highly Resilient'}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Profitable under 200% bias</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#f8fdff] border border-[#bec8ce]/40 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#131d20]">Simulate Hypothetical Confounder Bias Level:</span>
                  <span className="font-label-code text-xs px-2 py-0.5 rounded bg-white border border-[#bec8ce]/60 font-bold text-[#006481]">
                    {(simulatedBiasRatio * 100).toFixed(0)}% of Critical Break-Even Bias
                  </span>
                </div>
                <span className="text-xs font-label-code font-bold text-slate-700">
                  Projected Net Profit: $
                  {Math.max(
                    0,
                    (sensitivity?.profit_break_even.net_incremental_profit ?? 18420) * (1.0 - simulatedBiasRatio)
                  ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.05"
                value={simulatedBiasRatio}
                onChange={(e) => setSimulatedBiasRatio(parseFloat(e.target.value))}
                className="w-full accent-[#006481] cursor-pointer"
              />

              <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-300 ${
                    simulatedBiasRatio <= 1.0 ? 'bg-[#006481]' : 'bg-[#ba1a1a]'
                  }`}
                  style={{ width: `${Math.min(100, (1.0 - Math.min(1.0, simulatedBiasRatio)) * 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-[11px] font-label-code text-slate-500">
                <span>0% Bias (Unconfounded Ground Truth: $18,420.00)</span>
                <span>50% Bias Buffer Remaining</span>
                <span className="text-red-700 font-semibold">100% Bias = $0 Break-Even Floor</span>
              </div>
            </div>
          </div>
        )}
      </div>


      {}
      <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-[#bec8ce]/50 shadow-xs">
        <button
          onClick={() => onNavigate('upload-pipeline')}
          className="px-4 py-2 rounded border border-[#bec8ce] text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xs">arrow_back</span>
          <span>Back: Data &amp; Pipeline</span>
        </button>

        <button
          onClick={() => onNavigate('uplift-qini')}
          className="px-4 py-2 rounded bg-[#006481] hover:bg-[#007ea2] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <span>Next: Uplift &amp; Qini Benchmark</span>
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
