import React, { useState, useEffect } from 'react';
import { ScreenTab, ModelBenchmarkResult } from '../types.ts';
import { apiService } from '../apiService.ts';
import { MODEL_BENCHMARK_DATA } from '../mockData.ts';
import { Badge } from './ui/Badge.tsx';
import { ChartContainer } from './ui/ChartContainer.tsx';
import { MetricCard } from './ui/MetricCard.tsx';
import { usePageTitle } from '../hooks/usePageTitle.ts';

interface ModelComparisonViewProps {
  onNavigate: (tab: ScreenTab) => void;
}

export const ModelComparisonView: React.FC<ModelComparisonViewProps> = ({ onNavigate }) => {
  usePageTitle('Causal Model Benchmark');
  const [benchmarks, setBenchmarks] = useState<ModelBenchmarkResult[]>(MODEL_BENCHMARK_DATA);
  const [selectedMetric, setSelectedMetric] = useState<'pehe' | 'auqc' | 'qini' | 'training_time'>('pehe');

  useEffect(() => {
    let mounted = true;
    apiService.getModelComparison().then((res) => {
      if (mounted) setBenchmarks(res.data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const winner = benchmarks.find((b) => b.is_winner) || benchmarks[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl bg-white dark:bg-[#1a2b30] border border-[#bec8ce]/50 dark:border-[#2a3a3f] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#131d20] dark:text-[#e2ecef]">
              Meta-Learner vs Double Machine Learning Benchmark
            </h1>
            <Badge label="Neyman Orthogonal Cross-Fit" variant="primary" />
          </div>
          <p className="text-xs text-[#475053] dark:text-[#a8b8be] mt-1 font-mono">
            Ground-truth PEHE RMSE, AUQC ranking efficiency, and compute footprint comparison across 50,000 synthetic retail profiles.
          </p>
        </div>

        <button
          onClick={() => onNavigate('uplift-qini')}
          type="button"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#006481] hover:bg-[#007ea2] text-white text-xs font-medium transition-all shadow-xs"
        >
          <span className="material-symbols-outlined text-sm">trending_up</span>
          <span>View Uplift Qini Curves</span>
        </button>
      </div>

      {/* Top Winner Card Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Top Performing Estimator"
          value={winner.learner}
          subtitle="EconML Neyman Cross-Fitted"
          icon="emoji_events"
          variant="primary"
        />
        <MetricCard
          label="Best PEHE (Ground Truth RMSE)"
          value={winner.pehe.toFixed(4)}
          unit="rmse"
          trend={{ value: -75.1, label: 'vs S-Learner baseline' }}
          icon="adjust"
          variant="success"
        />
        <MetricCard
          label="Max Qini Area (AUQC)"
          value={winner.auqc.toFixed(3)}
          unit="score"
          trend={{ value: +91.6, label: 'vs S-Learner baseline' }}
          icon="analytics"
          variant="success"
        />
        <MetricCard
          label="Inference Latency"
          value={`${winner.inference_time_ms} ms`}
          subtitle="Vectorized batch evaluation"
          icon="bolt"
        />
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div className="bg-white dark:bg-[#1a2b30] rounded-xl border border-[#bec8ce]/50 dark:border-[#2a3a3f] p-5">
        <h3 className="text-sm font-semibold text-[#131d20] dark:text-[#e2ecef] mb-3">
          Model Evaluation Matrix (Ground-Truth Confounded DGP)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="bg-[#eaf5f9] dark:bg-[#111e22] text-[#475053] dark:text-[#a8b8be]">
              <tr>
                <th className="px-4 py-2.5 text-left uppercase">Estimator Architecture</th>
                <th className="px-4 py-2.5 text-right uppercase">PEHE RMSE ↓</th>
                <th className="px-4 py-2.5 text-right uppercase">AUQC Score ↑</th>
                <th className="px-4 py-2.5 text-right uppercase">Qini Top 20%</th>
                <th className="px-4 py-2.5 text-right uppercase">Train Time</th>
                <th className="px-4 py-2.5 text-right uppercase">Latency (p95)</th>
                <th className="px-4 py-2.5 text-center uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bec8ce]/30 dark:divide-[#2a3a3f]">
              {benchmarks.map((row) => (
                <tr
                  key={row.learner}
                  className={`transition-colors ${
                    row.is_winner
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 font-semibold'
                      : 'hover:bg-[#f1fbff] dark:hover:bg-[#1e303a]'
                  }`}
                >
                  <td className="px-4 py-3 text-[#131d20] dark:text-[#e2ecef]">
                    <div className="flex items-center gap-2">
                      {row.is_winner && (
                        <span className="material-symbols-outlined text-sm text-amber-500">star</span>
                      )}
                      <span>{row.displayName}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-right ${row.is_winner ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}>
                    {row.pehe.toFixed(4)}
                  </td>
                  <td className={`px-4 py-3 text-right ${row.is_winner ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}>
                    {row.auqc.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.qini_score.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.training_time_s.toFixed(2)}s
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.inference_time_ms}ms
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      label={row.is_winner ? 'CHAMPION' : 'BENCHMARK'}
                      variant={row.is_winner ? 'success' : 'neutral'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Chart Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Estimation Error (PEHE RMSE) — Lower is Superior"
          subtitle="Measures error between estimated CATE and true individual treatment effect"
          height="h-72"
        >
          <div className="w-full h-full flex flex-col justify-between py-2">
            <div className="flex-1 flex flex-col justify-around">
              {benchmarks.map((b) => {
                const maxPehe = 0.12;
                const pct = Math.min(100, (b.pehe / maxPehe) * 100);
                return (
                  <div key={b.learner} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#131d20] dark:text-[#e2ecef] font-medium">{b.learner}</span>
                      <span className={b.is_winner ? 'text-emerald-600 font-bold' : 'text-[#475053]'}>
                        {b.pehe.toFixed(4)} RMSE
                      </span>
                    </div>
                    <div className="w-full bg-[#eaf5f9] dark:bg-[#111e22] rounded-full h-3.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          b.is_winner ? 'bg-emerald-500' : 'bg-[#006481]/70'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] font-mono text-[#475053] dark:text-[#a8b8be] pt-2 border-t border-[#bec8ce]/30">
              * CausalForestDML exhibits 75% lower PEHE than S-Learner due to nuisance residualization removing selection bias.
            </p>
          </div>
        </ChartContainer>

        <ChartContainer
          title="Uplift Area (AUQC) — Higher is Superior"
          subtitle="Cumulative uplift ranking capability for maximizing promotional budget ROI"
          height="h-72"
        >
          <div className="w-full h-full flex flex-col justify-between py-2">
            <div className="flex-1 flex flex-col justify-around">
              {benchmarks.map((b) => {
                const maxAuqc = 0.45;
                const pct = Math.min(100, (b.auqc / maxAuqc) * 100);
                return (
                  <div key={b.learner} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#131d20] dark:text-[#e2ecef] font-medium">{b.learner}</span>
                      <span className={b.is_winner ? 'text-emerald-600 font-bold' : 'text-[#475053]'}>
                        {b.auqc.toFixed(3)} AUQC
                      </span>
                    </div>
                    <div className="w-full bg-[#eaf5f9] dark:bg-[#111e22] rounded-full h-3.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          b.is_winner ? 'bg-[#006481]' : 'bg-[#2e94b9]/60'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] font-mono text-[#475053] dark:text-[#a8b8be] pt-2 border-t border-[#bec8ce]/30">
              * AUQC is 1.9x higher with DML compared to naive single-model estimation.
            </p>
          </div>
        </ChartContainer>
      </div>
    </div>
  );
};

