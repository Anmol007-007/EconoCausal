import React, { useState, useEffect } from 'react';
import { ScreenTab, CustomerSegment, CustomerRecord } from '../types.ts';
import { apiService } from '../apiService.ts';
import { CUSTOMER_SEGMENTS_DATA, INITIAL_CUSTOMERS } from '../mockData.ts';
import { Badge } from './ui/Badge.tsx';
import { MetricCard } from './ui/MetricCard.tsx';
import { ChartContainer } from './ui/ChartContainer.tsx';
import { usePageTitle } from '../hooks/usePageTitle.ts';

interface SegmentExplorerViewProps {
  onNavigate: (tab: ScreenTab) => void;
}

export const SegmentExplorerView: React.FC<SegmentExplorerViewProps> = ({ onNavigate }) => {
  usePageTitle('Causal Segment Explorer');
  const [segments, setSegments] = useState<CustomerSegment[]>(CUSTOMER_SEGMENTS_DATA);
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>('Persuadable');
  const [customers, setCustomers] = useState<CustomerRecord[]>(INITIAL_CUSTOMERS);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    apiService.getSegments().then((res) => {
      if (mounted) setSegments(res.data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const activeSegment = segments.find((s) => s.quadrant === selectedQuadrant) || segments[0];

  const filteredCustomers = customers.filter((c) => {
    const matchesQuadrant = !selectedQuadrant || c.quadrant === selectedQuadrant;
    const matchesSearch = !searchTerm || c.cust_id.toLowerCase().includes(searchTerm.toLowerCase()) || c.loyalty_tier.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesQuadrant && matchesSearch;
  });

  const getQuadrantColor = (q: string) => {
    switch (q) {
      case 'Persuadable':
        return 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300';
      case 'Sure Thing':
        return 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300';
      case 'Lost Cause':
        return 'border-slate-400 bg-slate-50/50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300';
      case 'Sleeping Dog':
        return 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-800 dark:text-red-300';
      default:
        return 'border-[#bec8ce] bg-white';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl bg-white dark:bg-[#1a2b30] border border-[#bec8ce]/50 dark:border-[#2a3a3f] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#131d20] dark:text-[#e2ecef]">
              Causal Quadrant & Segment Explorer
            </h1>
            <Badge label="2x2 Treatment Sensitivity Matrix" variant="primary" />
          </div>
          <p className="text-xs text-[#475053] dark:text-[#a8b8be] mt-1 font-mono">
            Isolating Persuadables (High Incremental Lift) from Sure Things (Organic Cannibalization) and Sleeping Dogs (Negative Response).
          </p>
        </div>

        <button
          onClick={() => onNavigate('budget-allocation')}
          type="button"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#006481] hover:bg-[#007ea2] text-white text-xs font-medium transition-all shadow-xs"
        >
          <span className="material-symbols-outlined text-sm">payments</span>
          <span>Allocate Budget to Persuadables</span>
        </button>
      </div>

      {/* 4 Quadrants Interactive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {segments.map((s) => {
          const isSelected = selectedQuadrant === s.quadrant;
          return (
            <div
              key={s.quadrant}
              onClick={() => setSelectedQuadrant(isSelected ? null : s.quadrant)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${getQuadrantColor(s.quadrant)} ${
                isSelected ? 'ring-2 ring-offset-2 ring-[#006481] shadow-md scale-[1.01]' : 'hover:border-opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wide">{s.quadrant}</span>
                <span className="text-xs font-mono font-bold">{s.percentage}%</span>
              </div>
              <div className="text-2xl font-bold font-mono leading-none mb-1">
                {s.count.toLocaleString()}
              </div>
              <p className="text-[11px] opacity-80 mb-2">Customers in population</p>
              <div className="pt-2 border-t border-current/20 flex justify-between text-[11px] font-mono">
                <span>Avg Uplift:</span>
                <span className="font-bold">
                  {s.avg_uplift >= 0 ? `+${(s.avg_uplift * 100).toFixed(1)}%` : `${(s.avg_uplift * 100).toFixed(1)}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Segment Details & Recommendations */}
      {activeSegment && (
        <div className="bg-white dark:bg-[#1a2b30] rounded-xl border border-[#bec8ce]/50 dark:border-[#2a3a3f] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#bec8ce]/30">
            <div>
              <span className="text-xs font-mono text-[#006481] dark:text-[#2e94b9] uppercase font-bold">
                Selected Cohort Deep Dive
              </span>
              <h2 className="text-lg font-bold text-[#131d20] dark:text-[#e2ecef]">
                {activeSegment.quadrant} ({activeSegment.count.toLocaleString()} customers • {activeSegment.percentage}%)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                label={`Risk: ${activeSegment.risk_profile}`}
                variant={activeSegment.risk_profile === 'Low' ? 'success' : activeSegment.risk_profile === 'Severe' ? 'danger' : 'warning'}
              />
              <Badge
                label={`Projected ROI: ${activeSegment.projected_roi > 0 ? `+${activeSegment.projected_roi}%` : `${activeSegment.projected_roi}%`}`}
                variant={activeSegment.projected_roi > 0 ? 'success' : 'danger'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-[#eaf5f9] dark:bg-[#111e22] rounded-lg border border-[#bec8ce]/30">
              <span className="text-[11px] text-[#475053] dark:text-[#a8b8be] font-mono">Prescribed Action</span>
              <p className="text-xs font-semibold text-[#131d20] dark:text-[#e2ecef] mt-1">
                {activeSegment.recommended_action}
              </p>
            </div>
            <div className="p-3 bg-[#eaf5f9] dark:bg-[#111e22] rounded-lg border border-[#bec8ce]/30">
              <span className="text-[11px] text-[#475053] dark:text-[#a8b8be] font-mono">Average Past Spend</span>
              <p className="text-xs font-semibold text-[#131d20] dark:text-[#e2ecef] mt-1 font-mono">
                ${activeSegment.avg_past_spend.toFixed(2)} USD
              </p>
            </div>
            <div className="p-3 bg-[#eaf5f9] dark:bg-[#111e22] rounded-lg border border-[#bec8ce]/30">
              <span className="text-[11px] text-[#475053] dark:text-[#a8b8be] font-mono">Average Recency</span>
              <p className="text-xs font-semibold text-[#131d20] dark:text-[#e2ecef] mt-1 font-mono">
                {activeSegment.avg_recency} Days since last purchase
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Customer Record Table Filtered */}
      <div className="bg-white dark:bg-[#1a2b30] rounded-xl border border-[#bec8ce]/50 dark:border-[#2a3a3f] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[#131d20] dark:text-[#e2ecef]">
              Micro-Segment Samples ({filteredCustomers.length} records shown)
            </h3>
            <p className="text-xs text-[#475053] dark:text-[#a8b8be]">
              Showing individual treatment effect τ(x) estimates and assigned discount recommendations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search Customer ID or Tier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono rounded-lg border border-[#bec8ce] dark:border-[#2a3a3f] bg-white dark:bg-[#111e22] text-[#131d20] dark:text-[#e2ecef] focus:outline-none focus:ring-1 focus:ring-[#006481]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="bg-[#eaf5f9] dark:bg-[#111e22] text-[#475053] dark:text-[#a8b8be]">
              <tr>
                <th className="px-4 py-2 text-left uppercase">Cust ID</th>
                <th className="px-4 py-2 text-left uppercase">Tier</th>
                <th className="px-4 py-2 text-right uppercase">Past Spend</th>
                <th className="px-4 py-2 text-right uppercase">Recency</th>
                <th className="px-4 py-2 text-right uppercase">Affinity</th>
                <th className="px-4 py-2 text-right uppercase">True τ(x)</th>
                <th className="px-4 py-2 text-center uppercase">Quadrant</th>
                <th className="px-4 py-2 text-center uppercase">Recommended Coupon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bec8ce]/30 dark:divide-[#2a3a3f]">
              {filteredCustomers.slice(0, 10).map((c) => (
                <tr key={c.cust_id} className="hover:bg-[#f1fbff] dark:hover:bg-[#1e303a] transition-colors">
                  <td className="px-4 py-2 font-bold text-[#006481] dark:text-[#2e94b9]">{c.cust_id}</td>
                  <td className="px-4 py-2 text-[#131d20] dark:text-[#e2ecef]">{c.loyalty_tier}</td>
                  <td className="px-4 py-2 text-right text-[#131d20] dark:text-[#e2ecef]">${c.past_spend.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-[#131d20] dark:text-[#e2ecef]">{c.recency_days}d</td>
                  <td className="px-4 py-2 text-right text-[#131d20] dark:text-[#e2ecef]">{(c.category_affinity * 100).toFixed(0)}%</td>
                  <td className={`px-4 py-2 text-right font-bold ${c.true_effect >= 0.1 ? 'text-emerald-600' : c.true_effect < 0 ? 'text-red-500' : 'text-slate-600'}`}>
                    {c.true_effect >= 0 ? `+${(c.true_effect * 100).toFixed(1)}%` : `${(c.true_effect * 100).toFixed(1)}%`}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Badge
                      label={c.quadrant || 'Unknown'}
                      variant={
                        c.quadrant === 'Persuadable' ? 'success' :
                        c.quadrant === 'Sure Thing' ? 'info' :
                        c.quadrant === 'Sleeping Dog' ? 'danger' : 'neutral'
                      }
                    />
                  </td>
                  <td className="px-4 py-2 text-center font-bold">
                    {c.optimal_discount ? `$${c.optimal_discount} OFF` : 'HOLD OUT ($0)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

