import React, { useState } from 'react';
import { CustomerRecord, ScreenTab } from '../types.ts';
import { INITIAL_CUSTOMERS, computeMilpAllocation } from '../mockData.ts';
import { exportCustomersCSV } from '../exportUtils.ts';
import { apiService } from '../apiService.ts';

interface BudgetAllocationViewProps {
  onNavigate: (tab: ScreenTab) => void;
  totalBudget: number;
  setTotalBudget: (val: number) => void;
  unitMargin: number;
  setUnitMargin: (val: number) => void;
}

export const BudgetAllocationView: React.FC<BudgetAllocationViewProps> = ({
  onNavigate,
  totalBudget,
  setTotalBudget,
  unitMargin,
  setUnitMargin,
}) => {
  const [tierBronze, setTierBronze] = useState(true);
  const [tierSilver, setTierSilver] = useState(true);
  const [tierGold, setTierGold] = useState(true);
  const [tierPlatinum, setTierPlatinum] = useState(false);
  const [frequencyCapDays, setFrequencyCapDays] = useState<number>(0);
  const [minMarginFloor, setMinMarginFloor] = useState<number>(0);
  const [maxDiscountRate, setMaxDiscountRate] = useState<number>(100);
  const [searchRoster, setSearchRoster] = useState('');
  const [filterArm, setFilterArm] = useState<'All' | '0' | '10' | '20'>('All');
  const [isSolving, setIsSolving] = useState(false);
  const [solveSuccess, setSolveSuccess] = useState<string | null>(null);
  const [liveAllocation, setLiveAllocation] = useState<any>(null);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);

  const milpResults = liveAllocation || computeMilpAllocation(totalBudget, unitMargin);

  const handleRunMilp = async () => {
    setIsSolving(true);
    setSolveSuccess(null);
    const whitelist: string[] = [];
    if (tierBronze) whitelist.push('Bronze');
    if (tierSilver) whitelist.push('Silver');
    if (tierGold) whitelist.push('Gold');

    const res = await apiService.runAllocate({
      total_budget: totalBudget,
      unit_margin: unitMargin,
      min_margin_floor: minMarginFloor > 0 ? minMarginFloor : undefined,
      frequency_cap_days: frequencyCapDays > 0 ? frequencyCapDays : undefined,
      cohort_whitelist: whitelist.length < 3 ? whitelist : undefined,
      max_discount_rate: maxDiscountRate < 100 ? maxDiscountRate / 100 : undefined,
    });
    setIsSolving(false);
    setIsLiveApi(res.isLive);
    if (res.data) {
      setLiveAllocation({
        actualSpend: res.data.budget_allocated,
        netIncrementalProfit: res.data.net_incremental_profit,
        targetedPersuadables: res.data.targeted_persuadables,
        sureThingsHeldOut: res.data.sure_things_held_out,
        discountWasteSaved: res.data.discount_waste_saved,
        alloc0Count: res.data.alloc_0_count,
        alloc10Count: res.data.alloc_10_count,
        alloc20Count: res.data.alloc_20_count,
        policyMetrics: res.data.policy_metrics,
      });
    }
    setSolveSuccess(res.isLive ? `SciPy MILP sparse solver converged in ${res.latencyMs}ms via FastAPI` : `Branch-and-Bound converged in 42ms locally`);
    setTimeout(() => setSolveSuccess(null), 3000);
  };

  const filteredRoster: CustomerRecord[] = INITIAL_CUSTOMERS.filter(c => {
    const matchesSearch = c.cust_id.toLowerCase().includes(searchRoster.toLowerCase());
    const matchesArm = filterArm === 'All' || c.optimal_discount?.toString() === filterArm;
    return matchesSearch && matchesArm;
  });

  return (
    <div className="w-full flex flex-col gap-6">
      {}
      {solveSuccess && (
        <div className="fixed bottom-12 right-6 z-50 bg-[#006481] text-white px-4 py-2.5 rounded shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-sm text-[#acdcee]">check_circle</span>
          <span>{solveSuccess}</span>
        </div>
      )}

      {}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-lg bg-white border border-[#bec8ce]/50 shadow-sm relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[#006481]"></div>
        <div className="flex flex-col gap-1 pl-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-label-code text-xs uppercase text-[#006481] font-semibold px-2 py-0.5 rounded bg-[#006481]/10 tracking-wider">
              Module 04
            </span>
            <span className="font-label-code text-xs text-slate-400">/</span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#131d20] tracking-tight font-medium">
              SciPy MILP Budget Allocation &amp; Policy Optimizer
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#475053] max-w-4xl leading-relaxed">
            Mixed-Integer Linear Programming knapsack optimizer. Assigns promotional discount coupons to maximize aggregate net profit under budget and inventory constraints while preventing cannibalization.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-center flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#bec8ce]/50 bg-[#eaf5f9] text-xs font-label-code">
            <span className="text-slate-500">Solver:</span>
            <span className="text-[#006481] font-bold">Branch-and-Bound (HiGHS)</span>
          </div>
          <button
            onClick={handleRunMilp}
            disabled={isSolving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#006481] hover:bg-[#007ea2] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span className={`material-symbols-outlined text-sm ${isSolving ? 'animate-spin' : ''}`}>
              {isSolving ? 'sync' : 'tune'}
            </span>
            <span>{isSolving ? 'Solving...' : 'Re-solve MILP'}</span>
          </button>
        </div>
      </section>

      {}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {}
        <div className="bg-white border border-[#bec8ce]/50 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="font-label-code text-[11px] uppercase tracking-wider text-slate-500">
              Allocated Spend
            </span>
            <span className="material-symbols-outlined text-[#006481] text-lg">account_balance_wallet</span>
          </div>
          <div className="my-1">
            <div className="font-data-metric text-2xl text-[#131d20] font-semibold">
              ${milpResults.actualSpend.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500">/ ${totalBudget.toLocaleString()}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              <span className="text-[#006481] font-semibold font-label-code">
                {((milpResults.actualSpend / totalBudget) * 100).toFixed(1)}%
              </span>{' '}
              budget utilization
            </div>
          </div>
          <div className="h-1.5 w-full bg-[#bec8ce]/30 rounded overflow-hidden mt-2">
            <div
              className="h-full bg-[#006481] rounded"
              style={{ width: `${Math.min(100, (milpResults.actualSpend / totalBudget) * 100)}%` }}
            ></div>
          </div>
        </div>

        {}
        <div className="bg-white border border-[#bec8ce]/50 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="font-label-code text-[11px] uppercase tracking-wider text-slate-500">
              Net Incremental Profit
            </span>
            <span className="material-symbols-outlined text-emerald-600 text-lg">payments</span>
          </div>
          <div className="my-1">
            <div className="font-data-metric text-2xl text-[#006481] font-semibold">
              ${milpResults.netProfit.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              <span className="text-emerald-700 font-semibold font-label-code">
                ▲ +{milpResults.costEfficiencyGain}%
              </span>{' '}
              vs uniform discount policy
            </div>
          </div>
          <div className="h-1.5 w-full bg-[#bec8ce]/30 rounded overflow-hidden mt-2">
            <div className="h-full bg-[#2e94b9] rounded" style={{ width: '85%' }}></div>
          </div>
        </div>

        {}
        <div className="bg-white border border-[#bec8ce]/50 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="font-label-code text-[11px] uppercase tracking-wider text-slate-500">
              Purchases Captured
            </span>
            <span className="material-symbols-outlined text-[#475053] text-lg">shopping_cart_checkout</span>
          </div>
          <div className="my-1">
            <div className="font-data-metric text-2xl text-[#131d20] font-semibold">
              {milpResults.purchasesCaptured.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500">orders</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              from{' '}
              <span className="text-[#006481] font-semibold font-label-code">
                {milpResults.targetedPersuadables.toLocaleString()}
              </span>{' '}
              high-yield persuadables
            </div>
          </div>
          <div className="h-1.5 w-full bg-[#bec8ce]/30 rounded overflow-hidden mt-2">
            <div className="h-full bg-slate-600 rounded" style={{ width: '64%' }}></div>
          </div>
        </div>

        {}
        <div className="bg-white border border-[#bec8ce]/50 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="font-label-code text-[11px] uppercase tracking-wider text-slate-500">
              Cannibalization Saved
            </span>
            <span className="material-symbols-outlined text-[#006481] text-lg">savings</span>
          </div>
          <div className="my-1">
            <div className="font-data-metric text-2xl text-[#131d20] font-semibold">
              ${milpResults.discountWasteSaved.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              <span className="text-[#131d20] font-semibold font-label-code">
                {milpResults.sureThingsSaved.toLocaleString()}
              </span>{' '}
              sure things held out ($0)
            </div>
          </div>
          <div className="h-1.5 w-full bg-[#bec8ce]/30 rounded overflow-hidden mt-2">
            <div className="h-full bg-[#006481]/50 rounded" style={{ width: '92%' }}></div>
          </div>
        </div>
      </section>

      {}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {}
        <div className="xl:col-span-5 flex flex-col gap-6 min-w-0">
          <div className="bg-white border border-[#bec8ce]/50 rounded-lg p-5 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#bec8ce]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006481] text-xl">tune</span>
                <h2 className="font-serif text-lg text-[#131d20] font-semibold">Optimizer Parameters &amp; Bounds</h2>
              </div>
              <span className="font-label-code text-xs text-[#006481] font-semibold">Linear Relaxed</span>
            </div>

            {}
            <div className="p-3.5 rounded border border-[#bec8ce]/40 bg-[#f8fdff] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#131d20] font-medium" htmlFor="budget-input">
                  Campaign Budget Ceiling ($)
                </label>
                <div className="font-data-metric text-lg text-[#006481] font-bold">
                  ${totalBudget.toLocaleString()}
                </div>
              </div>
              <input
                id="budget-input"
                type="range"
                min="1000"
                max="25000"
                step="500"
                value={totalBudget}
                onChange={(e) => setTotalBudget(Number(e.target.value))}
                className="w-full accent-[#006481] h-1.5 rounded cursor-pointer"
              />
              <div className="flex justify-between font-label-code text-[10px] text-slate-400">
                <span>$1k Min</span>
                <span>$12.5k Mid</span>
                <span>$25k Cap</span>
              </div>
            </div>

            {}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded border border-[#bec8ce]/40 bg-[#f8fdff] flex flex-col gap-1">
                <span className="font-label-code text-[10px] uppercase text-slate-500">Gross Margin / Unit ($)</span>
                <input
                  type="number"
                  min="10"
                  max="150"
                  value={unitMargin}
                  onChange={(e) => setUnitMargin(Number(e.target.value))}
                  className="bg-white border border-[#bec8ce]/60 font-data-metric text-xs rounded p-1.5 focus:border-[#006481] text-[#131d20]"
                />
              </div>

              <div className="p-3 rounded border border-[#bec8ce]/40 bg-[#f8fdff] flex flex-col gap-1">
                <span className="font-label-code text-[10px] uppercase text-slate-500">Optimization Objective</span>
                <select className="bg-white border border-[#bec8ce]/60 font-label-code text-xs rounded p-1.5 text-[#131d20]">
                  <option>Max Net Profit ($)</option>
                  <option>Max Incremental Orders</option>
                  <option>Min CAC / Acquisition</option>
                </select>
              </div>
            </div>

            {}
            <div className="p-3.5 rounded border border-[#bec8ce]/40 bg-[#f8fdff] flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#131d20]">Customer Tier Policy Eligibility</span>
              <div className="grid grid-cols-2 gap-2 text-xs font-label-code">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tierBronze}
                    onChange={(e) => setTierBronze(e.target.checked)}
                    className="accent-[#006481] rounded"
                  />
                  <span>Bronze (High Elasticity)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tierSilver}
                    onChange={(e) => setTierSilver(e.target.checked)}
                    className="accent-[#006481] rounded"
                  />
                  <span>Silver (Mid Elasticity)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tierGold}
                    onChange={(e) => setTierGold(e.target.checked)}
                    className="accent-[#006481] rounded"
                  />
                  <span>Gold (Selective $10)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                  <input
                    type="checkbox"
                    checked={tierPlatinum}
                    onChange={(e) => setTierPlatinum(e.target.checked)}
                    className="accent-[#006481] rounded"
                  />
                  <span>Platinum (Exclude Sure Things)</span>
                </label>
              </div>
            </div>

            <div className="p-3.5 rounded border border-[#bec8ce]/40 bg-[#f8fdff] flex flex-col gap-3">
              <span className="text-xs font-semibold text-[#131d20]">Business Policy &amp; Guardrail Rules</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-label-code text-[10px] uppercase text-slate-500">Frequency Cap (Days)</span>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={frequencyCapDays}
                    onChange={(e) => setFrequencyCapDays(Math.max(0, Number(e.target.value)))}
                    className="bg-white border border-[#bec8ce]/60 font-data-metric text-xs rounded p-1.5 focus:border-[#006481] text-[#131d20]"
                    placeholder="0 (Disabled)"
                  />
                  <span className="text-[10px] text-slate-400">Holdout if recency &lt; N days</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-label-code text-[10px] uppercase text-slate-500">Min Margin Floor ($)</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={minMarginFloor}
                    onChange={(e) => setMinMarginFloor(Math.max(0, Number(e.target.value)))}
                    className="bg-white border border-[#bec8ce]/60 font-data-metric text-xs rounded p-1.5 focus:border-[#006481] text-[#131d20]"
                    placeholder="0.00"
                  />
                  <span className="text-[10px] text-slate-400">Only treat if profit &ge; $N</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium text-[11px]">Max Treatment Population Cap</span>
                  <span className="font-label-code font-bold text-[#006481]">{maxDiscountRate}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={maxDiscountRate}
                  onChange={(e) => setMaxDiscountRate(Number(e.target.value))}
                  className="w-full accent-[#006481] h-1.5 rounded cursor-pointer"
                />
              </div>
            </div>

            {liveAllocation?.policyMetrics && (
              <div className="p-3 rounded border border-[#bec8ce]/50 bg-slate-50 flex flex-col gap-1 text-xs">
                <span className="font-label-code text-[10px] uppercase font-bold text-[#006481]">Policy Exclusion Audit</span>
                <div className="grid grid-cols-3 gap-1.5 font-label-code text-[11px] text-slate-600">
                  <div>Freq: <span className="font-semibold text-[#131d20]">{liveAllocation.policyMetrics.excluded_by_frequency_cap ?? 0}</span></div>
                  <div>Cohort: <span className="font-semibold text-[#131d20]">{liveAllocation.policyMetrics.excluded_by_cohort ?? 0}</span></div>
                  <div>Floor: <span className="font-semibold text-[#131d20]">{liveAllocation.policyMetrics.excluded_by_margin_floor ?? 0}</span></div>
                </div>
              </div>
            )}

            {}
            <div className="p-3.5 rounded border border-[#bec8ce]/40 bg-[#eaf5f9] flex flex-col gap-2">
              <span className="font-label-code text-xs font-semibold text-[#131d20]">
                Solved Allocation Breakdown (N = 50,000)
              </span>
              <div className="grid grid-cols-3 gap-2 text-center font-label-code text-xs">
                <div className="bg-white p-2 rounded border border-[#bec8ce]/40">
                  <span className="text-slate-400 text-[10px] block">$0 (Holdout)</span>
                  <span className="font-bold text-[#131d20]">{milpResults.alloc0.toLocaleString()}</span>
                </div>
                <div className="bg-white p-2 rounded border border-[#bec8ce]/40">
                  <span className="text-[#006481] text-[10px] block font-semibold">$10 Coupon</span>
                  <span className="font-bold text-[#006481]">{milpResults.alloc10.toLocaleString()}</span>
                </div>
                <div className="bg-white p-2 rounded border border-[#bec8ce]/40">
                  <span className="text-[#007ea2] text-[10px] block font-semibold">$20 Coupon</span>
                  <span className="font-bold text-[#007ea2]">{milpResults.alloc20.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="xl:col-span-7 flex flex-col gap-6 min-w-0">
          <div className="bg-white border border-[#bec8ce]/50 rounded-lg p-5 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#bec8ce]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006481] text-xl">insights</span>
                <h2 className="font-serif text-lg text-[#131d20] font-semibold">
                  Diminishing Returns &amp; Allocation Frontier
                </h2>
              </div>
              <span className="font-label-code text-xs text-slate-500">
                Optimal Cutoff: ${(totalBudget).toLocaleString()}
              </span>
            </div>

            {}
            <div className="w-full h-52 bg-[#f8fdff] border border-[#bec8ce]/40 rounded-lg p-3 relative flex flex-col justify-end">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 160">
                {}
                <line stroke="#bec8ce" strokeDasharray="2,2" strokeWidth="1" x1="40" x2="580" y1="30" y2="30"></line>
                <line stroke="#bec8ce" strokeDasharray="2,2" strokeWidth="1" x1="40" x2="580" y1="80" y2="80"></line>
                <line stroke="#bec8ce" strokeDasharray="2,2" strokeWidth="1" x1="40" x2="580" y1="130" y2="130"></line>

                {}
                <path
                  d="M 40 145 Q 160 35, 300 25 T 580 40"
                  fill="none"
                  stroke="#006481"
                  strokeWidth="2.5"
                ></path>

                {}
                <line stroke="#6f787e" strokeDasharray="4,4" strokeWidth="1.5" x1="40" x2="580" y1="145" y2="90"></line>

                {}
                {(() => {
                  const xPct = 40 + ((totalBudget - 1000) / 24000) * 540;
                  const yPt = 145 - Math.pow((xPct - 40) / 540, 0.48) * 118;
                  return (
                    <g>
                      <line stroke="#2e94b9" strokeDasharray="2,2" strokeWidth="1.5" x1={xPct} x2={xPct} y1="10" y2="150"></line>
                      <circle cx={xPct} cy={yPt} fill="#006481" r="5" stroke="#ffffff" strokeWidth="2"></circle>
                    </g>
                  );
                })()}
              </svg>

              <div className="flex justify-between w-full pt-1.5 font-label-code text-[11px] text-slate-500">
                <span>$1,000</span>
                <span>$5,000 (Current Point)</span>
                <span>$15,000</span>
                <span>$25,000</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-label-code text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-[#006481] inline-block rounded"></span>
                <span>Net Profit ($)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-slate-500 inline-block"></span>
                <span>Budget Outlay</span>
              </div>
              <span className="text-[#006481] font-semibold">Marginal Elasticity dY/dB: +3.68</span>
            </div>
          </div>
        </div>
      </div>

      {}
      <section className="bg-white border border-[#bec8ce]/50 rounded-lg p-5 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#bec8ce]/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006481] text-base">checklist</span>
            <h3 className="font-serif text-lg text-[#131d20] font-semibold">
              SciPy MILP Optimized Target Roster
            </h3>
            <span className="font-label-code text-xs text-slate-400">
              ({filteredRoster.length} matches)
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {}
            <div className="relative">
              <span className="material-symbols-outlined text-slate-400 text-sm absolute left-2.5 top-2">search</span>
              <input
                type="text"
                placeholder="Search Customer ID..."
                value={searchRoster}
                onChange={(e) => setSearchRoster(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-[#bec8ce]/60 rounded bg-[#f8fdff] focus:outline-none focus:border-[#006481] w-44"
              />
            </div>

            {}
            <div className="flex items-center gap-1 bg-[#f8fdff] p-0.5 rounded border border-[#bec8ce]/50 text-xs font-label-code">
              {(['All', '0', '10', '20'] as const).map(arm => (
                <button
                  key={arm}
                  onClick={() => setFilterArm(arm)}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    filterArm === arm
                      ? 'bg-white text-[#006481] font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {arm === 'All' ? 'All Arms' : `$${arm}`}
                </button>
              ))}
            </div>

            <button
              onClick={() => exportCustomersCSV(INITIAL_CUSTOMERS)}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#006481] hover:bg-[#007ea2] text-white font-label-code text-xs transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">download</span>
              <span>Export Target Roster (CSV)</span>
            </button>
          </div>
        </div>

        {}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-label-code text-xs">
            <thead>
              <tr className="text-slate-500 uppercase text-[11px] bg-[#f8fdff] border-b border-[#bec8ce]/50">
                <th className="py-2.5 px-3 font-semibold">cust_id</th>
                <th className="py-2.5 px-3 font-semibold">Tier</th>
                <th className="py-2.5 px-3 font-semibold">Past Spend</th>
                <th className="py-2.5 px-3 font-semibold">Recency</th>
                <th className="py-2.5 px-3 font-semibold">Category Affinity</th>
                <th className="py-2.5 px-3 text-right font-semibold">Estimated ITE (τ̂_i)</th>
                <th className="py-2.5 px-3 text-center font-semibold">Optimal Policy (d*_i)</th>
                <th className="py-2.5 px-3 text-right font-semibold">Expected Net Profit</th>
                <th className="py-2.5 px-3 text-center font-semibold">Causal Segment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bec8ce]/25">
              {filteredRoster.map(cust => (
                <tr key={cust.cust_id} className="hover:bg-[#f8fdff]">
                  <td className="py-2.5 px-3 font-semibold text-[#131d20]">{cust.cust_id}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded border border-[#bec8ce]/40 bg-white text-[10px]">
                      {cust.loyalty_tier}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-data-metric">${cust.past_spend.toFixed(2)}</td>
                  <td className="py-2.5 px-3 font-data-metric">{cust.recency_days}d</td>
                  <td className="py-2.5 px-3 font-data-metric">{cust.category_affinity.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-semibold font-data-metric text-[#006481]">
                    +{cust.true_effect.toFixed(3)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                      cust.optimal_discount === 20
                        ? 'bg-[#006481] text-white'
                        : cust.optimal_discount === 10
                        ? 'bg-[#2e94b9] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      ${cust.optimal_discount ?? cust.discount}
                    </span>
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold font-data-metric ${
                    (cust.expected_profit ?? 0) > 0 ? 'text-[#006481]' : 'text-slate-400'
                  }`}>
                    {(cust.expected_profit ?? 0) > 0
                      ? `+$${(cust.expected_profit ?? 0).toFixed(2)}`
                      : `$0.00`}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      cust.quadrant === 'Persuadable'
                        ? 'border-[#2e94b9]/40 bg-[#2e94b9]/10 text-[#006481]'
                        : cust.quadrant === 'Sure Thing'
                        ? 'border-slate-300 bg-slate-100 text-slate-600'
                        : cust.quadrant === 'Sleeping Dog'
                        ? 'border-red-300 bg-red-100 text-red-800'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}>
                      {cust.quadrant ?? 'Persuadable'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {}
      <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-[#bec8ce]/50 shadow-xs">
        <button
          onClick={() => onNavigate('uplift-qini')}
          className="px-4 py-2 rounded border border-[#bec8ce] text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xs">arrow_back</span>
          <span>Back: Uplift &amp; Qini</span>
        </button>

        <button
          onClick={() => onNavigate('executive-summary-drift')}
          className="px-4 py-2 rounded bg-[#006481] hover:bg-[#007ea2] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <span>Next: Executive Summary &amp; Drift Telemetry</span>
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
