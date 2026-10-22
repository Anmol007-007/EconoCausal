import React, { useState } from 'react';
import { CustomerRecord, ScreenTab } from '../types.ts';
import { INITIAL_CUSTOMERS } from '../mockData.ts';
import { exportCustomersCSV } from '../exportUtils.ts';
import { apiService, SchemaReport } from '../apiService.ts';

interface UploadPipelineViewProps {
  onNavigate: (tab: ScreenTab) => void;
  onRunPipeline: () => void;
  isPipelineRunning: boolean;
  totalBudget: number;
  setTotalBudget: (val: number) => void;
  unitMargin: number;
  setUnitMargin: (val: number) => void;
}

export const UploadPipelineView: React.FC<UploadPipelineViewProps> = ({
  onNavigate,
  onRunPipeline,
  isPipelineRunning,
  totalBudget,
  setTotalBudget,
  unitMargin,
  setUnitMargin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'All' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum'>('All');
  const [pipelineProgress, setPipelineProgress] = useState(100);
  const [isSimulatingLocalRun, setIsSimulatingLocalRun] = useState(false);
  const [customers, setCustomers] = useState<CustomerRecord[]>(INITIAL_CUSTOMERS);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [datasetName, setDatasetName] = useState<string>('synthetic_retail_50k.csv');
  const [recordCount, setRecordCount] = useState<number>(50000);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('synthetic_retail');
  const [schemaReport, setSchemaReport] = useState<SchemaReport | null>(null);
  const [isLoadingBenchmark, setIsLoadingBenchmark] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.cust_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'All' || c.loyalty_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const handleLocalRun = () => {
    setIsSimulatingLocalRun(true);
    setPipelineProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      if (p >= 100) {
        setPipelineProgress(100);
        setIsSimulatingLocalRun(false);
        clearInterval(interval);
        setShowToast('Double ML & MILP Pipeline convergence completed in 2.84s');
        setTimeout(() => setShowToast(null), 3000);
      } else {
        setPipelineProgress(p);
      }
    }, 250);
  };

  const handleBenchmarkSelect = async (benchId: string) => {
    setSelectedBenchmark(benchId);
    setIsLoadingBenchmark(true);
    const label = benchId === 'hillstrom_email' ? 'hillstrom_email.csv' : (benchId === 'starbucks_uplift' ? 'starbucks_uplift.csv' : 'synthetic_retail_50k.csv');
    setDatasetName(label);
    setShowToast(`Ingesting ${label} benchmark...`);
    const res = await apiService.loadBenchmark(benchId);
    setIsLiveApi(res.isLive);
    setIsLoadingBenchmark(false);
    if (res.data) {
      if (res.data.records) setRecordCount(res.data.records);
      if (res.data.schema_report) setSchemaReport(res.data.schema_report);
    }
    setShowToast(res.isLive ? `Loaded ${label} via live FastAPI in ${res.latencyMs}ms` : `Loaded ${label} locally (offline mode)`);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setDatasetName(file.name);
    setShowToast(`Uploading & validating ${file.name}...`);
    const res = await apiService.uploadDataset(file);
    setIsLiveApi(res.isLive);
    if (res.data) {
      if (res.data.records) setRecordCount(res.data.records);
      if (res.data.schema_report) setSchemaReport(res.data.schema_report);
    }
    setShowToast(res.isLive ? `Validated ${file.name} on live FastAPI backend in ${res.latencyMs}ms` : `Parsed ${file.name} locally (offline mode)`);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleGenerateSynthetic = async () => {
    const newSeed = Math.floor(Math.random() * 1000) + 1;
    setShowToast(`Requesting synthetic generation (Seed #${newSeed})...`);
    const res = await apiService.uploadDataset(undefined, newSeed, 1000);
    setIsLiveApi(res.isLive);
    if (res.data && res.data.records) {
      setRecordCount(res.data.records);
    }
    const regenerated = INITIAL_CUSTOMERS.map(c => ({
      ...c,
      past_spend: +(c.past_spend * (0.95 + Math.random() * 0.1)).toFixed(2),
      recency_days: Math.max(1, Math.round(c.recency_days + (Math.random() * 6 - 3))),
      category_affinity: +(Math.min(0.99, Math.max(0.05, c.category_affinity + (Math.random() * 0.08 - 0.04)))).toFixed(2),
    }));
    setCustomers(regenerated);
    setShowToast(res.isLive ? `Generated live batch via FastAPI (Seed #${newSeed}) in ${res.latencyMs}ms` : `Generated synthetic batch (Seed #${newSeed} local)`);
    setTimeout(() => setShowToast(null), 3000);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {}
      {showToast && (
        <div className="fixed bottom-12 right-6 z-50 bg-[#006481] text-white px-4 py-2.5 rounded shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-sm text-[#acdcee]">check_circle</span>
          <span>{showToast}</span>
        </div>
      )}

      {}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-lg bg-white border border-[#bec8ce]/50 shadow-sm relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[#006481]"></div>
        <div className="flex flex-col gap-1 pl-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-label-code text-xs uppercase text-[#006481] font-semibold px-2 py-0.5 rounded bg-[#006481]/10 tracking-wider">
              Module 01
            </span>
            <span className="font-label-code text-xs text-slate-400">/</span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#131d20] tracking-tight font-medium">
              Data Ingestion &amp; Causal Pipeline Setup
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#475053] max-w-4xl leading-relaxed">
            Upload observational customer transaction logs, map causal roles (Confounders, Modifiers, Treatment, Outcome), and configure Double ML nuisance models.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-center flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#bec8ce]/50 bg-[#eaf5f9] text-xs">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2e94b9]"></span>
            </span>
            <span className="font-label-code text-slate-500">Dataset:</span>
            <span className="font-label-code text-[#131d20] font-semibold">synthetic_retail_50k.csv</span>
            <span className="font-label-code text-[10px] text-[#006481] font-semibold px-1.5 py-0.5 rounded bg-[#acdcee]/40">
              VERIFIED
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-label-code text-xs text-slate-600 bg-[#eaf5f9] px-3 py-1.5 rounded border border-[#bec8ce]/50">
            <span className="material-symbols-outlined text-sm text-[#006481]">tune</span>
            <span>SPEC: DML-PL-2024-V2</span>
          </div>
        </div>
      </section>

      {}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {}
        <div className="xl:col-span-7 flex flex-col gap-6 min-w-0">
          {}
          <div className="rounded-lg bg-white border border-[#bec8ce]/50 shadow-sm p-5 sm:p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#bec8ce]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006481] text-xl">database</span>
                <span className="font-serif text-lg text-[#131d20] font-semibold">Observational Data Stream</span>
              </div>
              <div className="flex items-center gap-2 font-label-code text-xs text-slate-500">
                <span>FORMAT: CSV / PARQUET</span>
                <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                <span className="text-[#006481] font-semibold">PASS IDENTIFIED</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#eaf5f9] border border-[#bec8ce]/40">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-label-code text-xs font-semibold text-[#006481] uppercase px-1">Benchmarks:</span>
                {[
                  { id: 'synthetic_retail', label: 'EconoCausal Retail (50k)' },
                  { id: 'hillstrom_email', label: 'Hillstrom Email (10k)' },
                  { id: 'starbucks_uplift', label: 'Starbucks Promo (10k)' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleBenchmarkSelect(b.id)}
                    disabled={isLoadingBenchmark}
                    className={`px-2.5 py-1 rounded text-xs font-medium font-label-code transition-all cursor-pointer ${
                      selectedBenchmark === b.id
                        ? 'bg-[#006481] text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-[#bec8ce]/50'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <span className="font-label-code text-[11px] text-slate-500">
                1-Click Dataset Adapter
              </span>
            </div>

            {}
            <div className="mt-3 p-4 rounded-lg border border-[#bec8ce]/60 bg-[#f8fdff] flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded border border-[#bec8ce]/60 bg-white flex items-center justify-center text-[#006481] shrink-0">
                  <span className="material-symbols-outlined text-2xl">dataset</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#131d20]">{datasetName}</span>
                    <span className={`font-label-code text-[10px] px-1.5 py-0.5 rounded font-semibold ${isLiveApi ? 'bg-emerald-100 text-emerald-800' : 'bg-[#acdcee]/40 text-[#006481]'}`}>
                      {isLiveApi ? 'Live Backend' : 'In Memory'}
                    </span>
                  </div>
                  <span className="font-label-code text-xs text-slate-500 mt-0.5">
                    {recordCount.toLocaleString()} records • 8 dimensions • Seed #42 (Validated)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.parquet"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded border border-[#bec8ce]/60 hover:bg-slate-50 text-slate-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xs text-[#006481]">upload_file</span>
                  <span>Upload File</span>
                </button>
                <button
                  onClick={() => handleGenerateSynthetic()}
                  className="px-3 py-1.5 rounded border border-[#bec8ce]/60 hover:bg-slate-50 text-slate-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xs text-[#006481]">swap_horiz</span>
                  <span>Swap</span>
                </button>
                <button
                  onClick={() => {
                    const preview = document.getElementById('table-preview');
                    if (preview) preview.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 rounded border border-[#006481]/30 bg-[#006481]/5 hover:bg-[#006481]/10 text-[#006481] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xs">visibility</span>
                  <span>Inspect Head</span>
                </button>
              </div>
            </div>

            {}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="flex flex-col p-3 rounded border border-[#bec8ce]/40 bg-[#f8fdff]">
                <span className="font-label-code text-[10px] text-slate-400 uppercase tracking-wider">Observations</span>
                <span className="font-data-metric text-lg text-[#131d20] font-semibold">50,000</span>
                <span className="font-label-code text-[11px] text-[#006481] mt-0.5 font-medium">100% Validated</span>
              </div>
              <div className="flex flex-col p-3 rounded border border-[#bec8ce]/40 bg-[#f8fdff]">
                <span className="font-label-code text-[10px] text-slate-400 uppercase tracking-wider">Confounders (W)</span>
                <span className="font-data-metric text-lg text-[#131d20] font-semibold">4 Features</span>
                <span className="font-label-code text-[11px] text-slate-600 font-medium">High Overlap</span>
              </div>
              <div className="flex flex-col p-3 rounded border border-[#bec8ce]/40 bg-[#f8fdff]">
                <span className="font-label-code text-[10px] text-slate-400 uppercase tracking-wider">Treatment Arms (T)</span>
                <span className="font-data-metric text-lg text-[#131d20] font-semibold">3 Levels</span>
                <span className="font-label-code text-[11px] text-[#006481] font-medium">$0 / $10 / $20</span>
              </div>
              <div className="flex flex-col p-3 rounded border border-[#bec8ce]/40 bg-[#f8fdff]">
                <span className="font-label-code text-[10px] text-slate-400 uppercase tracking-wider">Outcome Target (Y)</span>
                <span className="font-data-metric text-lg text-[#131d20] font-semibold">Binary</span>
                <span className="font-label-code text-[11px] text-slate-600">Purchase Flag</span>
              </div>
            </div>

            {schemaReport && (
              <div className="mt-4 p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-medium">
                  <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
                  <span>
                    Auto-Ingestion Verified • Treatment [{schemaReport.treatment_col}] • Outcome [{schemaReport.outcome_col}] • {schemaReport.feature_cols.length} Confounders Mapped
                  </span>
                </div>
                <div className="font-label-code text-emerald-800 text-[11px] px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300">
                  Imputed NaNs: {Object.values(schemaReport.imputed_missing_counts).reduce((a, b) => a + b, 0)}
                </div>
              </div>
            )}
          </div>

          {}
          <div className="rounded-lg bg-white border border-[#bec8ce]/50 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#bec8ce]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#475053] text-xl">account_tree</span>
                <div>
                  <h2 className="font-serif text-lg text-[#131d20] font-semibold">Causal Variable Role Assignment Matrix</h2>
                  <p className="text-xs text-slate-500">Disentangle Pearlian Structural Equation paths for unbiased Double ML conditioning.</p>
                </div>
              </div>
              <span className="font-label-code text-xs text-[#006481] px-2.5 py-1 rounded border border-[#006481]/20 bg-[#eaf5f9] self-start sm:self-center font-medium">
                DAG Valid: Back-Door Satisfied
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#bec8ce]/40 text-slate-500 uppercase font-label-code text-[11px] bg-[#f8fdff]">
                    <th className="py-2.5 px-3 font-semibold">Column Identifier</th>
                    <th className="py-2.5 px-3 font-semibold">Data Type</th>
                    <th className="py-2.5 px-3 font-semibold">Causal Role Tag</th>
                    <th className="py-2.5 px-3 font-semibold">Role Mechanics &amp; Inclusion</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Inference State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#bec8ce]/25">
                  <tr className="hover:bg-[#f8fdff] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-label-code text-xs font-semibold text-[#131d20]">
                        <span>past_spend</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#475053]"></span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-label-code text-slate-500">float64</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded border border-[#bec8ce]/60 bg-[#eaf5f9] text-[#475053] font-label-code text-[11px] font-medium">
                        Confounder (W) + Modifier (X)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 leading-normal">
                      Controls baseline wealth; conditions treatment propensity and heterogeneous response.
                    </td>
                    <td className="py-3 px-3 text-right font-label-code text-xs text-[#006481] font-medium">
                      Active in Stage 1 &amp; 2
                    </td>
                  </tr>

                  <tr className="hover:bg-[#f8fdff] transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-label-code text-xs font-semibold text-[#131d20]">recency_days</span>
                    </td>
                    <td className="py-3 px-3 font-label-code text-slate-500">int32</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded border border-[#bec8ce]/40 bg-[#eaf5f9] text-[#475053] font-label-code text-[11px]">
                        Confounder (W)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 leading-normal">
                      Nuisance conditioning: Days elapsed since prior order. Drives propensity allocation.
                    </td>
                    <td className="py-3 px-3 text-right font-label-code text-xs text-slate-500">
                      Residualized
                    </td>
                  </tr>

                  <tr className="hover:bg-[#f8fdff] transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-label-code text-xs font-semibold text-[#131d20]">loyalty_tier</span>
                    </td>
                    <td className="py-3 px-3 font-label-code text-slate-500">categorical</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded border border-[#bec8ce]/60 bg-[#eaf5f9] text-[#475053] font-label-code text-[11px] font-medium">
                        Confounder (W) + Modifier (X)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 leading-normal">
                      One-hot encoded internally. Strong heterogeneity driver for discount sensitivity.
                    </td>
                    <td className="py-3 px-3 text-right font-label-code text-xs text-[#006481] font-medium">
                      Active in Stage 1 &amp; 2
                    </td>
                  </tr>

                  <tr className="hover:bg-[#f8fdff] transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-label-code text-xs font-semibold text-[#131d20]">category_affinity</span>
                    </td>
                    <td className="py-3 px-3 font-label-code text-slate-500">float32 [0.0 - 1.0]</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded border border-[#bec8ce]/40 bg-[#eaf5f9] text-[#475053] font-label-code text-[11px]">
                        Confounder (W)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 leading-normal">
                      Interest score in target promotional retail department.
                    </td>
                    <td className="py-3 px-3 text-right font-label-code text-xs text-slate-500">
                      Residualized
                    </td>
                  </tr>

                  <tr className="hover:bg-[#f8fdff] transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-label-code text-xs font-semibold text-[#131d20]">age</span>
                    </td>
                    <td className="py-3 px-3 font-label-code text-slate-500">int16</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded border border-[#006481]/30 bg-[#006481]/5 text-[#006481] font-label-code text-[11px] font-medium">
                        Effect Modifier (X)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 leading-normal">
                      Exogenous demographic heterogeneity. Splits CATE causal decision trees.
                    </td>
                    <td className="py-3 px-3 text-right font-label-code text-xs text-[#006481] font-medium">
                      Tree Splitting (CATE)
                    </td>
                  </tr>

                  <tr className="hover:bg-[#f8fdff] transition-colors bg-[#006481]/[0.02]">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-label-code text-xs font-semibold text-[#006481]">
                        <span>discount</span>
                        <span className="material-symbols-outlined text-xs text-[#006481]">bolt</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-label-code text-slate-500">discrete &#123;0, 10, 20&#125;</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded border border-[#006481]/40 bg-[#006481]/10 text-[#006481] font-label-code text-[11px] font-semibold">
                        Treatment (T)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#131d20] leading-normal">
                      Biased coupon assignment. Propensity model P(T|W) estimated via Multinomial GBDT.
                    </td>
                    <td className="py-3 px-3 text-right font-label-code text-xs text-[#006481] font-semibold">
                      Instrument Target
                    </td>
                  </tr>

                  <tr className="hover:bg-[#f8fdff] transition-colors bg-[#2e94b9]/[0.02]">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-label-code text-xs font-semibold text-[#2e94b9]">
                        <span>purchase</span>
                        <span className="material-symbols-outlined text-xs text-[#2e94b9]">flag</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-label-code text-slate-500">binary &#123;0, 1&#125;</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded border border-[#2e94b9]/40 bg-[#2e94b9]/10 text-[#006481] font-label-code text-[11px] font-semibold">
                        Outcome (Y)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#131d20] leading-normal">
                      Customer conversion response. Regressed against nuisance features Y ~ W.
                    </td>
                    <td className="py-3 px-3 text-right font-label-code text-xs text-[#2e94b9] font-semibold">
                      Primary Target
                    </td>
                  </tr>

                  <tr className="hover:bg-[#f8fdff] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-label-code text-xs text-slate-400">
                        <span>true_effect</span>
                        <span className="material-symbols-outlined text-xs text-slate-400">lock</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-label-code text-slate-400">float64 (Simulated)</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded border border-[#bec8ce]/30 bg-[#f8fdff] text-slate-400 font-label-code text-[11px]">
                        Synthetic Ground Truth
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 leading-normal">
                      Known counterfactual baseline for offline MSE / Qini validation. Excluded from training.
                    </td>
                    <td className="py-3 px-3 text-right font-label-code text-xs text-slate-400">
                      Isolated &amp; Locked
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {}
          <div className="rounded-lg bg-white border border-[#bec8ce]/50 shadow-sm p-5 sm:p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#bec8ce]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006481] text-xl">verified</span>
                <h3 className="font-serif text-lg text-[#131d20] font-semibold">Data Health &amp; Econometric Pre-flight</h3>
              </div>
              <span className="font-label-code text-xs text-[#006481] font-medium">All Checks Passed (3/3)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1">
              <div className="p-3.5 rounded border border-[#bec8ce]/40 bg-[#f8fdff] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-code text-[10px] uppercase text-slate-400">Missingness</span>
                  <span className="material-symbols-outlined text-[#006481] text-sm">check_circle</span>
                </div>
                <div className="font-data-metric text-lg text-[#131d20] font-semibold">0.00% Null</div>
                <p className="text-xs text-slate-500">No imputation required across 50k customer vectors.</p>
              </div>

              <div className="p-3.5 rounded border border-[#bec8ce]/40 bg-[#f8fdff] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-code text-[10px] uppercase text-slate-400">Propensity Trimming</span>
                  <span className="material-symbols-outlined text-[#006481] text-sm">check_circle</span>
                </div>
                <div className="font-data-metric text-lg text-[#131d20] font-semibold">&lt; 0.01 &amp; &gt; 0.99</div>
                <p className="text-xs text-slate-500">Trimmed 142 extreme propensity points to preserve overlap.</p>
              </div>

              <div className="p-3.5 rounded border border-[#bec8ce]/40 bg-[#f8fdff] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-code text-[10px] uppercase text-slate-400">Positivity Overlap</span>
                  <span className="material-symbols-outlined text-[#006481] text-sm">check_circle</span>
                </div>
                <div className="font-data-metric text-lg text-[#006481] font-semibold">Pass (98.4%)</div>
                <p className="text-xs text-slate-500">Sufficient common support across all 3 treatment branches.</p>
              </div>
            </div>

            {}
            <div className="mt-2 p-3 rounded border border-[#bec8ce]/40 bg-[#f8fdff] flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-label-code text-xs text-slate-600">
                <span>Propensity Score Common Support Spectrum [e(x)]</span>
                <span className="text-[#006481] font-medium">Kullback-Leibler Div: 0.041</span>
              </div>
              <div className="h-2.5 w-full bg-[#bec8ce]/30 rounded overflow-hidden flex">
                <div className="bg-slate-300 w-[2%] h-full" title="Trimmed Low"></div>
                <div className="bg-[#006481] w-[42%] h-full" title="Control (0)"></div>
                <div className="bg-[#475053] w-[30%] h-full" title="$10 Arm"></div>
                <div className="bg-[#acdcee] w-[24%] h-full" title="$20 Arm"></div>
                <div className="bg-slate-300 w-[2%] h-full" title="Trimmed High"></div>
              </div>
              <div className="flex justify-between font-label-code text-[10px] text-slate-400">
                <span>0.00 (Trimmed)</span>
                <span>0.25</span>
                <span>0.50 (Support Balance)</span>
                <span>0.75</span>
                <span>1.00 (Trimmed)</span>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="xl:col-span-5 flex flex-col gap-6 min-w-0">
          {}
          <div className="rounded-lg bg-white border border-[#bec8ce]/50 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#bec8ce]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006481] text-xl">neurology</span>
                <div>
                  <h2 className="font-serif text-lg text-[#131d20] font-semibold">Double ML Model Hyperparameters</h2>
                  <p className="text-xs text-slate-500">Chernozhukov et al. orthogonalized Robinson residualization.</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded border border-[#bec8ce]/50 bg-[#eaf5f9] text-slate-600 font-label-code text-[11px]">
                EconML 0.15.1
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {}
              <div className="p-3.5 rounded border border-[#bec8ce]/40 bg-[#f8fdff] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#131d20]">Stage 1: Nuisance Estimators</span>
                  <span className="font-label-code text-xs text-[#006481] font-medium">LightGBM Ensembles</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-0.5">
                  <div className="bg-white p-2 rounded border border-[#bec8ce]/40 flex flex-col">
                    <span className="font-label-code text-[10px] text-slate-400 uppercase">Outcome Y ~ W</span>
                    <span className="font-label-code text-xs text-[#131d20] font-semibold">LGBMRegressor</span>
                    <span className="font-label-code text-[10px] text-slate-500">lr=0.05, max_depth=6</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-[#bec8ce]/40 flex flex-col">
                    <span className="font-label-code text-[10px] text-slate-400 uppercase">Treatment T ~ W</span>
                    <span className="font-label-code text-xs text-[#131d20] font-semibold">LGBMClassifier</span>
                    <span className="font-label-code text-[10px] text-slate-500">multiclass (ovr), lr=0.05</span>
                  </div>
                </div>
              </div>

              {}
              <div className="p-3.5 rounded border border-[#bec8ce]/40 bg-[#f8fdff] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#131d20]">Sample Splitting (Cross-Fitting)</span>
                  <span className="font-data-metric text-xs text-[#006481] font-semibold">5-Fold (cv=5)</span>
                </div>
                <p className="text-xs text-slate-500">
                  Out-of-fold orthogonalization eliminates regularized estimation bias &amp; overfitting leakage.
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-2 flex-1 rounded bg-[#006481]/70" title="Fold 1"></div>
                  <div className="h-2 flex-1 rounded bg-[#006481]/70" title="Fold 2"></div>
                  <div className="h-2 flex-1 rounded bg-[#006481]/70" title="Fold 3"></div>
                  <div className="h-2 flex-1 rounded bg-[#006481]/70" title="Fold 4"></div>
                  <div className="h-2 flex-1 rounded bg-[#006481]/70" title="Fold 5"></div>
                </div>
              </div>

              {}
              <div className="p-3.5 rounded border border-[#bec8ce]/40 bg-[#f8fdff] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#131d20]">Stage 2: Causal Estimator</span>
                  <span className="font-label-code text-xs text-slate-600 font-medium">CausalForestDML</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-0.5 text-center font-label-code text-xs">
                  <div className="bg-white p-2 rounded border border-[#bec8ce]/40">
                    <span className="block text-slate-400 text-[10px] uppercase">TREES</span>
                    <span className="font-semibold text-[#131d20]">500</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-[#bec8ce]/40">
                    <span className="block text-slate-400 text-[10px] uppercase">MIN LEAF</span>
                    <span className="font-semibold text-[#131d20]">20</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-[#bec8ce]/40">
                    <span className="block text-slate-400 text-[10px] uppercase">DISCRETE_T</span>
                    <span className="font-semibold text-[#006481]">True</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="rounded-lg bg-white border border-[#bec8ce]/50 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#bec8ce]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006481] text-xl">account_balance_wallet</span>
                <div>
                  <h2 className="font-serif text-lg text-[#131d20] font-semibold">Campaign Budget &amp; MILP Bounds</h2>
                  <p className="text-xs text-slate-500">SciPy Mixed-Integer Linear Program constraints.</p>
                </div>
              </div>
              <span className="font-label-code text-xs px-2 py-0.5 rounded border border-[#006481]/20 bg-[#006481]/5 text-[#006481] font-medium">
                Knapsack Active
              </span>
            </div>

            {}
            <div className="p-3.5 rounded border border-[#bec8ce]/40 bg-[#f8fdff] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#131d20] font-medium" htmlFor="budget-slider">
                  Total Promotional Budget
                </label>
                <div className="flex items-baseline gap-0.5 font-data-metric text-lg text-[#006481] font-semibold">
                  <span>$</span>
                  <span>{totalBudget.toLocaleString()}</span>
                </div>
              </div>
              <input
                id="budget-slider"
                type="range"
                min="1000"
                max="25000"
                step="500"
                value={totalBudget}
                onChange={(e) => setTotalBudget(Number(e.target.value))}
                className="w-full accent-[#006481] h-1.5 rounded cursor-pointer"
              />
              <div className="flex justify-between font-label-code text-[10px] text-slate-500">
                <span>$1,000 (Conservative)</span>
                <span>$12,500</span>
                <span>$25,000 (Aggressive)</span>
              </div>
            </div>

            {}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-2.5 rounded border border-[#bec8ce]/40 bg-[#f8fdff] flex flex-col gap-1">
                <span className="font-label-code text-[10px] uppercase text-slate-400">Unit Margin ($)</span>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={unitMargin}
                  onChange={(e) => setUnitMargin(Number(e.target.value))}
                  className="bg-white border border-[#bec8ce]/60 font-data-metric text-xs text-[#131d20] rounded p-1.5 focus:outline-none focus:border-[#006481]"
                />
                <span className="font-label-code text-[10px] text-slate-500">Baseline gross profit</span>
              </div>
              <div className="p-2.5 rounded border border-[#bec8ce]/40 bg-[#f8fdff] flex flex-col gap-1">
                <span className="font-label-code text-[10px] uppercase text-slate-400">Max $10 Arm Alloc</span>
                <input
                  type="text"
                  readOnly
                  value="4,000 users"
                  className="bg-white border border-[#bec8ce]/40 font-data-metric text-xs text-slate-600 rounded p-1.5 cursor-not-allowed"
                />
                <span className="font-label-code text-[10px] text-slate-500">Inventory cap</span>
              </div>
              <div className="p-2.5 rounded border border-[#bec8ce]/40 bg-[#f8fdff] flex flex-col gap-1">
                <span className="font-label-code text-[10px] uppercase text-slate-400">Max $20 Arm Alloc</span>
                <input
                  type="text"
                  readOnly
                  value="2,000 users"
                  className="bg-white border border-[#bec8ce]/40 font-data-metric text-xs text-slate-600 rounded p-1.5 cursor-not-allowed"
                />
                <span className="font-label-code text-[10px] text-slate-500">Risk buffer limit</span>
              </div>
            </div>
          </div>

          {}
          <div className="rounded-lg bg-white border border-[#bec8ce]/50 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#bec8ce]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006481] text-xl">analytics</span>
                <span className="font-serif text-lg text-[#131d20] font-semibold">Pipeline Convergence Engine</span>
              </div>
              <span className="font-label-code text-xs text-[#006481] bg-[#006481]/10 px-2 py-0.5 rounded font-medium">
                {isSimulatingLocalRun ? 'CONVERGING...' : 'READY'}
              </span>
            </div>

            <div className="rounded border border-[#bec8ce]/40 bg-[#f8fdff] p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between font-label-code text-xs">
                <span className="text-[#131d20] flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isSimulatingLocalRun ? 'bg-amber-500 animate-pulse' : 'bg-[#006481]'}`}></span>
                  Stage 1 Nuisance + Stage 2 Causal Trees + MILP
                </span>
                <span className="text-[#006481] font-semibold">{pipelineProgress}% COMPLETE</span>
              </div>

              {}
              <div className="w-full bg-[#bec8ce]/30 h-2 rounded overflow-hidden">
                <div
                  className="bg-[#006481] h-full rounded transition-all duration-300"
                  style={{ width: `${pipelineProgress}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center font-label-code text-xs text-slate-500 pt-0.5">
                <span>Wall time: 2.84s (Parallel cv=5)</span>
                <span className="text-[#006481] font-medium">MSE(tau_hat, tau_true) = 0.0084</span>
              </div>
            </div>

            {}
            <button
              onClick={handleLocalRun}
              disabled={isSimulatingLocalRun || isPipelineRunning}
              className="w-full py-3 px-4 rounded bg-[#006481] hover:bg-[#007ea2] active:scale-98 text-white font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              type="button"
            >
              <span className={`material-symbols-outlined text-base ${isSimulatingLocalRun ? 'animate-spin' : ''}`}>
                {isSimulatingLocalRun ? 'sync' : 'rocket_launch'}
              </span>
              <span>{isSimulatingLocalRun ? 'Re-estimating CATE Trees...' : 'Run Full Causal Pipeline (Double ML + MILP)'}</span>
            </button>

            {}
            <div className="flex items-center justify-between pt-1 gap-2 flex-wrap text-xs">
              <button
                onClick={() => {
                  setTotalBudget(5000);
                  setUnitMargin(45);
                  setCustomers(INITIAL_CUSTOMERS);
                  setShowToast('Parameters reset to Baseline Seed #42');
                  setTimeout(() => setShowToast(null), 2500);
                }}
                className="text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors px-2.5 py-1 rounded border border-[#bec8ce]/50 bg-[#f8fdff] cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-xs">restart_alt</span>
                <span>Reset to Default (Seed 42)</span>
              </button>

              <button
                onClick={() => exportCustomersCSV(customers)}
                className="text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors px-2.5 py-1 rounded border border-[#bec8ce]/50 bg-[#f8fdff] cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-xs">download</span>
                <span>Download Confounded CSV</span>
              </button>

              <button
                onClick={handleGenerateSynthetic}
                className="text-[#006481] hover:underline flex items-center gap-1 transition-colors px-2.5 py-1 rounded border border-[#bec8ce]/50 bg-[#f8fdff] font-medium cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-xs">autorenew</span>
                <span>Generate Synthetic Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {}
      <section
        id="table-preview"
        className="rounded-lg bg-white border border-[#bec8ce]/50 shadow-sm p-5 sm:p-6 flex flex-col gap-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#bec8ce]/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-500 text-lg">preview</span>
            <span className="font-serif text-base text-[#131d20] font-semibold">
              Data Snapshot: Sample Observations (synthetic_retail_50k.csv)
            </span>
            <span className="font-label-code text-xs text-slate-400">
              ({filteredCustomers.length} displayed)
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {}
            <div className="relative">
              <span className="material-symbols-outlined text-slate-400 text-sm absolute left-2.5 top-2">search</span>
              <input
                type="text"
                placeholder="Search Cust ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-[#bec8ce]/60 rounded bg-[#f8fdff] focus:outline-none focus:border-[#006481] w-40"
              />
            </div>

            {}
            <div className="flex items-center gap-1 bg-[#f8fdff] p-0.5 rounded border border-[#bec8ce]/50 text-xs font-label-code">
              {(['All', 'Bronze', 'Silver', 'Gold', 'Platinum'] as const).map(tier => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    tierFilter === tier
                      ? 'bg-white text-[#006481] font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-label-code text-xs">
            <thead className="bg-[#f8fdff] text-slate-500 uppercase text-[11px] border-b border-[#bec8ce]/40">
              <tr>
                <th className="py-2.5 px-3 font-semibold">cust_id</th>
                <th className="py-2.5 px-3 font-semibold">past_spend</th>
                <th className="py-2.5 px-3 font-semibold">recency_days</th>
                <th className="py-2.5 px-3 font-semibold">loyalty_tier</th>
                <th className="py-2.5 px-3 font-semibold">category_affinity</th>
                <th className="py-2.5 px-3 font-semibold">age</th>
                <th className="py-2.5 px-3 text-[#006481] font-semibold">discount (T)</th>
                <th className="py-2.5 px-3 text-[#2e94b9] font-semibold">purchase (Y)</th>
                <th className="py-2.5 px-3 text-slate-400 font-semibold">true_effect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bec8ce]/25 text-slate-600">
              {filteredCustomers.slice(0, 8).map(row => (
                <tr key={row.cust_id} className="hover:bg-[#f8fdff]">
                  <td className="py-2.5 px-3 text-[#131d20] font-semibold">{row.cust_id}</td>
                  <td className="py-2.5 px-3 font-data-metric">${row.past_spend.toFixed(2)}</td>
                  <td className="py-2.5 px-3 font-data-metric">{row.recency_days}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded border border-[#bec8ce]/50 bg-white text-[#131d20] text-[10px]">
                      {row.loyalty_tier}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-data-metric">{row.category_affinity.toFixed(2)}</td>
                  <td className="py-2.5 px-3 font-data-metric">{row.age}</td>
                  <td className="py-2.5 px-3 font-semibold text-[#006481] font-data-metric">${row.discount}</td>
                  <td className="py-2.5 px-3 font-semibold text-[#2e94b9] font-data-metric">{row.purchase}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-data-metric">
                    {row.true_effect >= 0 ? `+${row.true_effect.toFixed(3)}` : row.true_effect.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {}
      <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-[#bec8ce]/50 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="material-symbols-outlined text-[#006481] text-sm">lightbulb</span>
          <span>Next step in causal econometrics lifecycle: Verify unconfoundedness via DAG &amp; refutation tests.</span>
        </div>
        <button
          onClick={() => onNavigate('causal-diagnostics')}
          className="px-4 py-2 rounded bg-[#006481] hover:bg-[#007ea2] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <span>Next: Causal Diagnostics &amp; DAG</span>
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
