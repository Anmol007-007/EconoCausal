import React, { useState, useEffect } from 'react';
import { ScreenTab, RoiScenario } from '../types.ts';
import { apiService } from '../apiService.ts';
import { ROI_SCENARIOS_DATA } from '../mockData.ts';
import { Badge } from './ui/Badge.tsx';
import { MetricCard } from './ui/MetricCard.tsx';
import { ChartContainer } from './ui/ChartContainer.tsx';
import { usePageTitle } from '../hooks/usePageTitle.ts';

interface RoiSimulatorViewProps {
  onNavigate: (tab: ScreenTab) => void;
  totalBudget?: number;
  setTotalBudget?: (b: number) => void;
  unitMargin?: number;
  setUnitMargin?: (m: number) => void;
}

export const RoiSimulatorView: React.FC<RoiSimulatorViewProps> = ({
  onNavigate,
  totalBudget = 5000,
  setTotalBudget,
  unitMargin = 45,
  setUnitMargin,
}) => {
  usePageTitle('ROI Scenario Simulator');
  const [budget, setBudget] = useState<number>(totalBudget);
  const [margin, setMargin] = useState<number>(unitMargin);
  const [strategy, setStrategy] = useState<'persuadables_only' | 'top_decile' | 'all_customers'>('persuadables_only');
  const [discountDepth, setDiscountDepth] = useState<10 | 20>(10);
  const [scenarios, setScenarios] = useState<RoiScenario[]>(ROI_SCENARIOS_DATA);

  useEffect(() => {
    let mounted = true;
    apiService.simulateRoi({ budget, unit_margin: margin, targeting_strategy: strategy }).then((res) => {
      if (mounted) setScenarios(res.data);
    });
    return () => {
      mounted = false;
    };
  }, [budget, margin, strategy]);

  const handleBudgetChange = (val: number) => {
    setBudget(val);
    if (setTotalBudget) setTotalBudget(val);
  };

  const handleMarginChange = (val: number) => {
    setMargin(val);
    if (setUnitMargin) setUnitMargin(val);
  };

  const efficiencyMultiplier = strategy === 'persuadables_only' ? 3.68 : strategy === 'top_decile' ? 2.45 : 0.85;
  const customersTargeted = Math.round(budget / discountDepth);
  const conversionRate = strategy === 'persuadables_only' ? 0.28 : strategy === 'top_decile' ? 0.18 : 0.04;
  const incrementalPurchases = Math.round(customersTargeted * conversionRate);
  const grossIncrementalRev = incrementalPurchases * margin;
  const netIncrementalProfit = grossIncrementalRev - budget;
  const projectedRoiPct = budget > 0 ? (netIncrementalProfit / budget) * 100 : 0;
  const deadweightLossPrevented = strategy === 'persuadables_only' ? Math.round(budget * 2.25) : 0;

  return (
    <div className="flex flex-col gap-6">

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl bg-white dark:bg-[#1a2b30] border border-[#bec8ce]/50 dark:border-[#2a3a3f] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#131d20] dark:text-[#e2ecef]">
              Promotional Campaign ROI & Scenario Planner
            </h1>
            <Badge label="Interactive Monte Carlo Simulator" variant="primary" />
          </div>
          <p className="text-xs text-[#475053] dark:text-[#a8b8be] mt-1 font-mono">
            Simulate incremental profit, customer conversion counts, and coupon cannibalization risk across targeting policies.
          </p>
        </div>

        <button
          onClick={() => onNavigate('budget-allocation')}
          type="button"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#006481] hover:bg-[#007ea2] text-white text-xs font-medium transition-all shadow-xs"
        >
          <span className="material-symbols-outlined text-sm">lock</span>
          <span>Commit Scenario to MILP Solver</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Simulated Net Incremental Profit"
          value={`$${netIncrementalProfit.toLocaleString()}`}
          unit="USD"
          trend={{ value: projectedRoiPct, label: 'ROI' }}
          icon="trending_up"
          variant={netIncrementalProfit > 0 ? 'success' : 'warning'}
        />
        <MetricCard
          label="Projected Campaign ROI"
          value={`${projectedRoiPct.toFixed(1)}%`}
          subtitle={`On $${budget.toLocaleString()} capital outlay`}
          icon="percent"
          variant={projectedRoiPct > 100 ? 'success' : 'default'}
        />
        <MetricCard
          label="Targeted Customers"
          value={customersTargeted.toLocaleString()}
          subtitle={`Estimated ${incrementalPurchases.toLocaleString()} incremental orders`}
          icon="group"
        />
        <MetricCard
          label="Organic Margin Safeguard"
          value={`$${deadweightLossPrevented.toLocaleString()}`}
          unit="USD"
          subtitle="Saved by withholding from Sure Things"
          icon="savings"
          variant="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="bg-white dark:bg-[#1a2b30] rounded-xl border border-[#bec8ce]/50 dark:border-[#2a3a3f] p-5 flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-[#131d20] dark:text-[#e2ecef] mb-4">
            Campaign Parameters & Constraints
          </h3>

          <div className="space-y-5">

            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-[#475053] dark:text-[#a8b8be]">Total Marketing Budget:</span>
                <span className="font-bold text-[#006481] dark:text-[#2e94b9]">${budget.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={1000}
                max={25000}
                step={500}
                value={budget}
                onChange={(e) => handleBudgetChange(Number(e.target.value))}
                className="w-full accent-[#006481] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#6f787e] mt-1">
                <span>$1,000</span>
                <span>$12,500</span>
                <span>$25,000</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-[#475053] dark:text-[#a8b8be]">Unit Contribution Margin:</span>
                <span className="font-bold text-[#006481] dark:text-[#2e94b9]">${margin} / unit</span>
              </div>
              <input
                type="range"
                min={15}
                max={120}
                step={5}
                value={margin}
                onChange={(e) => handleMarginChange(Number(e.target.value))}
                className="w-full accent-[#006481] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#6f787e] mt-1">
                <span>$15</span>
                <span>$65</span>
                <span>$120</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-mono text-[#475053] dark:text-[#a8b8be] block mb-2">
                Targeting Policy:
              </span>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-[#bec8ce]/40 dark:border-[#2a3a3f] cursor-pointer hover:bg-[#eaf5f9] dark:hover:bg-[#111e22]">
                  <input
                    type="radio"
                    name="strategy"
                    checked={strategy === 'persuadables_only'}
                    onChange={() => setStrategy('persuadables_only')}
                    className="accent-[#006481]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#131d20] dark:text-[#e2ecef] block">
                      Persuadables Only (Causal DML Optimal)
                    </span>
                    <span className="text-[10px] text-[#475053] dark:text-[#a8b8be]">
                      Targets top τ(x) elasticity; zero coupon waste
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-[#bec8ce]/40 dark:border-[#2a3a3f] cursor-pointer hover:bg-[#eaf5f9] dark:hover:bg-[#111e22]">
                  <input
                    type="radio"
                    name="strategy"
                    checked={strategy === 'top_decile'}
                    onChange={() => setStrategy('top_decile')}
                    className="accent-[#006481]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#131d20] dark:text-[#e2ecef] block">
                      Top Decile Uplift Rank
                    </span>
                    <span className="text-[10px] text-[#475053] dark:text-[#a8b8be]">
                      Greedy ranking without knapsack duals
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-[#bec8ce]/40 dark:border-[#2a3a3f] cursor-pointer hover:bg-[#eaf5f9] dark:hover:bg-[#111e22]">
                  <input
                    type="radio"
                    name="strategy"
                    checked={strategy === 'all_customers'}
                    onChange={() => setStrategy('all_customers')}
                    className="accent-[#006481]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#131d20] dark:text-[#e2ecef] block">
                      Naive Broadcast (No Causal Selection)
                    </span>
                    <span className="text-[10px] text-[#475053] dark:text-[#a8b8be]">
                      High cannibalization of Sure Things
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <span className="text-xs font-mono text-[#475053] dark:text-[#a8b8be] block mb-1.5">
                Coupon Treatment Arm:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountDepth(10)}
                  className={`flex-1 py-1.5 text-xs font-mono rounded-lg border transition-colors ${
                    discountDepth === 10
                      ? 'bg-[#006481] text-white font-bold border-[#006481]'
                      : 'border-[#bec8ce] text-[#475053] dark:text-[#a8b8be]'
                  }`}
                >
                  $10 Voucher
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountDepth(20)}
                  className={`flex-1 py-1.5 text-xs font-mono rounded-lg border transition-colors ${
                    discountDepth === 20
                      ? 'bg-[#006481] text-white font-bold border-[#006481]'
                      : 'border-[#bec8ce] text-[#475053] dark:text-[#a8b8be]'
                  }`}
                >
                  $20 Voucher
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <ChartContainer
            title="Economic Profit Waterfall Comparison"
            subtitle={`Gross Revenue ($${grossIncrementalRev.toLocaleString()}) vs Marketing Cost ($${budget.toLocaleString()}) = Net Profit ($${netIncrementalProfit.toLocaleString()})`}
            height="h-72"
          >
            <div className="w-full h-full flex flex-col justify-around py-3">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="font-bold text-[#131d20] dark:text-[#e2ecef]">1. Gross Incremental Revenue</span>
                    <span className="text-emerald-600 font-bold">+${grossIncrementalRev.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-[#eaf5f9] dark:bg-[#111e22] h-4 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="font-bold text-[#131d20] dark:text-[#e2ecef]">2. Marketing Voucher Outlay</span>
                    <span className="text-red-500 font-bold">-${budget.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-[#eaf5f9] dark:bg-[#111e22] h-4 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full"
                      style={{ width: `${Math.min(85, (budget / Math.max(1, grossIncrementalRev)) * 85)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="font-bold text-[#006481] dark:text-[#2e94b9]">3. Net Incremental Bottom-Line Lift</span>
                    <span className={netIncrementalProfit > 0 ? 'text-[#006481] dark:text-[#2e94b9] font-bold' : 'text-red-500 font-bold'}>
                      {netIncrementalProfit > 0 ? `+$${netIncrementalProfit.toLocaleString()}` : `-$${Math.abs(netIncrementalProfit).toLocaleString()}`}
                    </span>
                  </div>
                  <div className="w-full bg-[#eaf5f9] dark:bg-[#111e22] h-4 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${netIncrementalProfit > 0 ? 'bg-[#006481]' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(85, Math.max(10, (netIncrementalProfit / Math.max(1, grossIncrementalRev)) * 85))}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#bec8ce]/30 flex justify-between items-center text-xs font-mono text-[#6f787e]">
                <span>Strategy Multiplier: {efficiencyMultiplier}x lift efficiency</span>
                <span className="font-semibold text-emerald-600">Break-even at $32 margin/unit</span>
              </div>
            </div>
          </ChartContainer>

          <div className="bg-white dark:bg-[#1a2b30] rounded-xl border border-[#bec8ce]/50 dark:border-[#2a3a3f] p-5">
            <h3 className="text-sm font-semibold text-[#131d20] dark:text-[#e2ecef] mb-3">
              Preset Strategic Scenarios Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead className="bg-[#eaf5f9] dark:bg-[#111e22] text-[#475053] dark:text-[#a8b8be]">
                  <tr>
                    <th className="px-3 py-2 text-left uppercase">Scenario Preset</th>
                    <th className="px-3 py-2 text-right uppercase">Budget</th>
                    <th className="px-3 py-2 text-right uppercase">Targeted</th>
                    <th className="px-3 py-2 text-right uppercase">Gross Rev</th>
                    <th className="px-3 py-2 text-right uppercase">Net Profit</th>
                    <th className="px-3 py-2 text-right uppercase">ROI %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#bec8ce]/30 dark:divide-[#2a3a3f]">
                  {scenarios.map((scen) => (
                    <tr
                      key={scen.scenario_id}
                      className="hover:bg-[#f1fbff] dark:hover:bg-[#1e303a] transition-colors"
                    >
                      <td className="px-3 py-2.5 font-bold text-[#131d20] dark:text-[#e2ecef]">
                        {scen.name}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[#475053] dark:text-[#a8b8be]">
                        ${scen.budget.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[#475053] dark:text-[#a8b8be]">
                        {scen.customers_targeted}
                      </td>
                      <td className="px-3 py-2.5 text-right text-emerald-600 font-medium">
                        +${scen.projected_incremental_revenue.toLocaleString()}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-bold ${scen.net_incremental_profit > 0 ? 'text-[#006481] dark:text-[#2e94b9]' : 'text-red-500'}`}>
                        {scen.net_incremental_profit > 0 ? `+$${scen.net_incremental_profit.toLocaleString()}` : `-$${Math.abs(scen.net_incremental_profit).toLocaleString()}`}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-bold ${scen.projected_roi_pct > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {scen.projected_roi_pct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

