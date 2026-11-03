import React, { useState } from 'react';
import { exportAuditBundle, exportCustomersCSV, exportDecilesCSV, exportRefutationJSON } from '../exportUtils.ts';
import { DECILE_DATA, INITIAL_CUSTOMERS, REFUTER_SUITE, SHAP_IMPORTANCE_DATA, CUSTOMER_SEGMENTS_DATA } from '../mockData.ts';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [includeRefutations, setIncludeRefutations] = useState(true);
  const [includeDrift, setIncludeDrift] = useState(true);
  const [includeRoster, setIncludeRoster] = useState(true);
  const [includeShap, setIncludeShap] = useState(true);
  const [includeSegments, setIncludeSegments] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (includeRefutations) {
      exportRefutationJSON(REFUTER_SUITE);
    }
    if (includeDrift) {
      exportDecilesCSV(DECILE_DATA);
    }
    if (includeRoster) {
      exportCustomersCSV(INITIAL_CUSTOMERS);
    }
    if (includeShap) {
      const shapCsv = 'feature,mean_abs_shap,direction,relative_weight\n' +
        SHAP_IMPORTANCE_DATA.map((s) => `${s.feature},${s.mean_abs_shap},${s.direction},${s.relative_weight}`).join('\n');
      const blob = new Blob([shapCsv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'shap_feature_importance.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
    if (includeSegments) {
      const segCsv = 'quadrant,count,percentage,avg_uplift,avg_past_spend,recommended_action\n' +
        CUSTOMER_SEGMENTS_DATA.map((s) => `${s.quadrant},${s.count},${s.percentage},${s.avg_uplift},${s.avg_past_spend},"${s.recommended_action}"`).join('\n');
      const blob = new Blob([segCsv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customer_segments_summary.csv';
      a.click();
      URL.revokeObjectURL(url);
    }

    exportAuditBundle(DECILE_DATA, REFUTER_SUITE);

    setDownloadSuccess('Audit bundle and selected artifacts generated successfully!');
    setTimeout(() => {
      setDownloadSuccess(null);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#131d20]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a2b30] border border-[#bec8ce] dark:border-[#2a3a3f] w-full max-w-lg rounded-xl p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-[#bec8ce]/50 dark:border-[#2a3a3f]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006481] dark:text-[#2e94b9] text-xl">file_download</span>
            <h3 className="font-serif text-xl text-[#131d20] dark:text-[#e2ecef] font-medium">Institutional Artifact Packaging</h3>
          </div>
          <button
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-100 dark:hover:bg-[#111e22] transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <p className="text-sm text-[#475053] dark:text-[#a8b8be] leading-relaxed">
          Select model estimation logs, causal identification DAG representations, and covariate stability matrices to bundle into the audit archive:
        </p>

        <div className="flex flex-col gap-2 text-xs">
          <label className="flex items-start gap-3 p-3 rounded-lg border border-[#bec8ce]/50 dark:border-[#2a3a3f] bg-[#f8fdff] dark:bg-[#111e22] hover:bg-[#eaf5f9] cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeRefutations}
              onChange={(e) => setIncludeRefutations(e.target.checked)}
              className="mt-0.5 accent-[#006481] rounded w-4 h-4 cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-[#131d20] dark:text-[#e2ecef]">DoWhy Refutation Artifacts</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">3-fold placebo & unobserved confounder tests (.json)</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-[#bec8ce]/50 dark:border-[#2a3a3f] bg-[#f8fdff] dark:bg-[#111e22] hover:bg-[#eaf5f9] cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeDrift}
              onChange={(e) => setIncludeDrift(e.target.checked)}
              className="mt-0.5 accent-[#006481] rounded w-4 h-4 cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-[#131d20] dark:text-[#e2ecef]">Full Covariate Drift Matrix</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">PSI & Kolmogorov–Smirnov Two-Sample Tables (.csv)</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-[#bec8ce]/50 dark:border-[#2a3a3f] bg-[#f8fdff] dark:bg-[#111e22] hover:bg-[#eaf5f9] cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeRoster}
              onChange={(e) => setIncludeRoster(e.target.checked)}
              className="mt-0.5 accent-[#006481] rounded w-4 h-4 cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-[#131d20] dark:text-[#e2ecef]">SciPy MILP Optimized Target Roster</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Individual customer IDs with optimal pricing assignments (.csv)</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-[#bec8ce]/50 dark:border-[#2a3a3f] bg-[#f8fdff] dark:bg-[#111e22] hover:bg-[#eaf5f9] cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeShap}
              onChange={(e) => setIncludeShap(e.target.checked)}
              className="mt-0.5 accent-[#006481] rounded w-4 h-4 cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-[#131d20] dark:text-[#e2ecef]">TreeSHAP CATE Feature Attributions</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Relative weights and direction of uplift drivers (.csv)</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-[#bec8ce]/50 dark:border-[#2a3a3f] bg-[#f8fdff] dark:bg-[#111e22] hover:bg-[#eaf5f9] cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeSegments}
              onChange={(e) => setIncludeSegments(e.target.checked)}
              className="mt-0.5 accent-[#006481] rounded w-4 h-4 cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-[#131d20] dark:text-[#e2ecef]">Causal 2x2 Quadrant Cohort Summary</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Persuadables, Sure Things, Lost Causes, Sleeping Dogs (.csv)</span>
            </div>
          </label>
        </div>

        {downloadSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{downloadSuccess}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#bec8ce]/50 dark:border-[#2a3a3f]">
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg border border-[#bec8ce] dark:border-[#2a3a3f] bg-white dark:bg-[#111e22] text-slate-700 dark:text-slate-300 text-xs hover:bg-slate-50 font-medium transition-colors cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-1.5 rounded-lg bg-[#006481] hover:bg-[#007ea2] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            onClick={handleDownload}
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Download Bundle (.tar.gz)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
