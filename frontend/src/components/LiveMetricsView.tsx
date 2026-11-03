import React, { useState, useEffect } from 'react';
import { ScreenTab, LiveMetric } from '../types.ts';
import { apiService } from '../apiService.ts';
import { LIVE_METRICS_DATA } from '../mockData.ts';
import { MetricCard } from './ui/MetricCard.tsx';
import { Badge } from './ui/Badge.tsx';
import { ChartContainer } from './ui/ChartContainer.tsx';
import { usePageTitle } from '../hooks/usePageTitle.ts';

interface LiveMetricsViewProps {
  onNavigate: (tab: ScreenTab) => void;
}

export const LiveMetricsView: React.FC<LiveMetricsViewProps> = ({ onNavigate }) => {
  usePageTitle('Live Metrics & Ops');
  const [metrics, setMetrics] = useState<LiveMetric[]>(LIVE_METRICS_DATA);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [latency, setLatency] = useState<number>(0);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'ml' | 'business' | 'system'>('all');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [streamEvents, setStreamEvents] = useState<Array<{ id: number; time: string; msg: string; type: string }>>([
    { id: 1, time: '14:02:11', msg: 'DML Cross-Fit Fold 5 evaluated: PEHE = 0.0281', type: 'info' },
    { id: 2, time: '14:02:24', msg: 'MILP solver branch pruned 1,420 non-persuadable candidates', type: 'success' },
    { id: 3, time: '14:02:39', msg: 'Vectorized KS statistic computed over 50,000 records (p=0.42)', type: 'info' },
    { id: 4, time: '14:02:51', msg: 'Sure Thing coupon suppression lock active: $11,240 saved', type: 'success' },
  ]);

  useEffect(() => {
    let mounted = true;
    const fetchMetrics = () => {
      apiService.getLiveMetrics().then((res) => {
        if (mounted) {
          setMetrics(res.data);
          setIsLiveApi(res.isLive);
          setLatency(res.latencyMs);
        }
      });
    };

    fetchMetrics();
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchMetrics();
        // simulate streaming events
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        const sampleMsgs = [
          { msg: 'FastAPI worker 03: /uplift inference completed in 1.82s', type: 'info' },
          { msg: 'DoWhy backdoor identification graph verified with zero unobserved paths', type: 'success' },
          { msg: 'Cluster node memory stable at 38.2% allocation', type: 'info' },
          { msg: 'Batch scoring checkpoint saved to internal cache', type: 'success' },
        ];
        const randomItem = sampleMsgs[Math.floor(Math.random() * sampleMsgs.length)];
        setStreamEvents((prev) => [
          { id: Date.now(), time: timeStr, msg: randomItem.msg, type: randomItem.type },
          ...prev.slice(0, 7),
        ]);
      }
    }, 4000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [autoRefresh]);

  const filteredMetrics = categoryFilter === 'all'
    ? metrics
    : metrics.filter((m) => m.category === categoryFilter);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl bg-white dark:bg-[#1a2b30] border border-[#bec8ce]/50 dark:border-[#2a3a3f] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#131d20] dark:text-[#e2ecef]">
              Live Metrics & Operational Health
            </h1>
            <Badge label={isLiveApi ? 'FASTAPI LIVE' : 'TELEMETRY SIMULATOR'} variant={isLiveApi ? 'success' : 'primary'} dot />
          </div>
          <p className="text-xs text-[#475053] dark:text-[#a8b8be] mt-1 font-mono">
            Real-time telemetry from CausalForestDML cross-fitting, SciPy MILP knapsack allocation, and FastAPI cluster node.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 bg-[#eaf5f9] dark:bg-[#111e22] p-1 rounded-lg border border-[#bec8ce]/40 dark:border-[#2a3a3f]">
            {(['all', 'ml', 'business', 'system'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                type="button"
                className={`px-3 py-1 text-xs font-mono font-medium rounded-md transition-colors ${
                  categoryFilter === cat
                    ? 'bg-[#006481] text-white shadow-xs'
                    : 'text-[#475053] dark:text-[#a8b8be] hover:bg-white dark:hover:bg-[#1a2b30]'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            type="button"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <span className={`material-symbols-outlined text-sm ${autoRefresh ? 'animate-spin' : ''}`}>sync</span>
            <span>{autoRefresh ? 'STREAMING' : 'PAUSED'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredMetrics.map((m) => (
          <MetricCard
            key={m.id}
            label={m.label}
            value={m.value}
            unit={m.unit}
            icon={m.icon}
            trend={m.trend ? { value: m.trend, label: 'vs last window' } : undefined}
            variant={m.category === 'business' ? 'primary' : m.category === 'ml' ? 'default' : 'default'}
          />
        ))}
      </div>

      {/* Main Charts & Stream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Throughput / Latency SVG Chart */}
        <div className="lg:col-span-2">
          <ChartContainer
            title="Inference Throughput & Cluster Latency (Last 60 Seconds)"
            subtitle="Vectors processed per second (cyan) and P95 latency in ms (amber)"
            height="h-80"
          >
            <div className="w-full h-full flex flex-col justify-between py-2">
              <svg className="w-full h-64 overflow-visible" viewBox="0 0 700 240">
                <defs>
                  <linearGradient id="liveThroughputGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#006481" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#006481" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal gridlines */}
                {[40, 90, 140, 190].map((y) => (
                  <line key={y} x1="50" y1={y} x2="680" y2={y} stroke="#bec8ce" strokeOpacity="0.25" strokeDasharray="3 3" />
                ))}

                {/* Y-axis labels */}
                <text x="40" y="45" textAnchor="end" fill="#6f787e" fontSize="10" fontFamily="monospace">16k</text>
                <text x="40" y="95" textAnchor="end" fill="#6f787e" fontSize="10" fontFamily="monospace">14k</text>
                <text x="40" y="145" textAnchor="end" fill="#6f787e" fontSize="10" fontFamily="monospace">12k</text>
                <text x="40" y="195" textAnchor="end" fill="#6f787e" fontSize="10" fontFamily="monospace">10k</text>

                {/* Throughput Area */}
                <path
                  d="M 50 140 Q 120 110, 190 95 T 330 80 T 470 70 T 610 65 T 680 60 L 680 200 L 50 200 Z"
                  fill="url(#liveThroughputGrad)"
                />
                {/* Throughput Line */}
                <path
                  d="M 50 140 Q 120 110, 190 95 T 330 80 T 470 70 T 610 65 T 680 60"
                  fill="none"
                  stroke="#006481"
                  strokeWidth="2.5"
                />

                {/* Latency Line (Amber) */}
                <path
                  d="M 50 180 Q 120 160, 190 150 T 330 155 T 470 145 T 610 135 T 680 130"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />

                {/* Data points */}
                {[
                  { cx: 190, cy: 95 },
                  { cx: 330, cy: 80 },
                  { cx: 470, cy: 70 },
                  { cx: 680, cy: 60 },
                ].map((pt, i) => (
                  <circle key={i} cx={pt.cx} cy={pt.cy} r="4" fill="#006481" stroke="#ffffff" strokeWidth="2" />
                ))}
              </svg>

              <div className="flex items-center justify-center gap-6 text-xs font-mono text-[#475053] dark:text-[#a8b8be] pt-2 border-t border-[#bec8ce]/30">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#006481]"></span>
                  <span>Throughput: 14,250 records/sec</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-[#f59e0b]"></span>
                  <span>P95 Latency: 142 ms</span>
                </div>
              </div>
            </div>
          </ChartContainer>
        </div>

        {/* Live Operational Stream Events */}
        <div>
          <div className="bg-white dark:bg-[#1a2b30] rounded-xl border border-[#bec8ce]/50 dark:border-[#2a3a3f] p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#006481]">terminal</span>
                <h3 className="text-sm font-semibold text-[#131d20] dark:text-[#e2ecef]">Live Execution Log</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-300">
                ACTIVE
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs pr-1">
              {streamEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-lg border border-[#bec8ce]/30 dark:border-[#2a3a3f] bg-[#f1fbff] dark:bg-[#111e22] text-[#131d20] dark:text-[#e2ecef]"
                >
                  <div className="flex items-center justify-between text-[10px] text-[#475053] dark:text-[#a8b8be] mb-1">
                    <span>{evt.time}</span>
                    <span className={evt.type === 'success' ? 'text-emerald-600 font-bold' : 'text-[#006481] font-bold'}>
                      {evt.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="leading-snug">{evt.msg}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 mt-3 border-t border-[#bec8ce]/30 flex items-center justify-between text-[11px] font-mono text-[#475053] dark:text-[#a8b8be]">
              <span>Latency: {latency > 0 ? `${latency}ms` : '< 120ms'}</span>
              <button
                onClick={() => onNavigate('causal-diagnostics')}
                type="button"
                className="text-[#006481] dark:text-[#2e94b9] hover:underline"
              >
                Inspect Diagnostics →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

