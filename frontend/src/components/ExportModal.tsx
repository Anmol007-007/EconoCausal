import React, { useState } from 'react';
import { exportAuditBundle, exportCustomersCSV, exportDecilesCSV, exportRefutationJSON } from '../utils/exportUtils.ts';
import { DECILE_DATA, INITIAL_CUSTOMERS, REFUTER_SUITE } from '../data/mockData.ts';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [includeRefutations, setIncludeRefutations] = useState(true);
  const [includeDrift, setIncludeDrift] = useState(true);
  const [includeRoster, setIncludeRoster] = useState(true);
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
    exportAuditBundle(DECILE_DATA, REFUTER_SUITE);

    setDownloadSuccess('Audit bundle and selected artifacts generated successfully!');
    setTimeout(() => {
      setDownloadSuccess(null);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#131d20]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#bec8ce] w-full max-w-lg rounded-lg p-6 shadow-xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-[#bec8ce]/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006481] text-xl">file_download</span>
            <h3 className="font-serif text-xl text-[#131d20] font-medium">Institutional Artifact Packaging</h3>
          </div>
          <button
            className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <p className="text-sm text-[#475053] leading-relaxed">
          Select which model estimation logs, causal identification DAG representations, and covariate stability matrices to bundle into the audit archive:
        </p>

        <div className="flex flex-col gap-2 text-xs">
          <label className="flex items-start gap-3 p-3 rounded border border-[#bec8ce]/50 bg-[#f8fdff] hover:bg-[#eaf5f9] cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeRefutations}
              onChange={(e) => setIncludeRefutations(e.target.checked)}
              className="mt-0.5 accent-[#006481] rounded w-4 h-4 cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-[#131d20]">DoWhy Refutation Artifacts</span>
              <span className="text-slate-500 text-[11px]">3-fold placebo & unobserved confounder tests (.json)</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded border border-[#bec8ce]/50 bg-[#f8fdff] hover:bg-[#eaf5f9] cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeDrift}
              onChange={(e) => setIncludeDrift(e.target.checked)}
              className="mt-0.5 accent-[#006481] rounded w-4 h-4 cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-[#131d20]">Full Covariate Drift Matrix</span>
              <span className="text-slate-500 text-[11px]">PSI & Kolmogorov–Smirnov Two-Sample Tables (.csv)</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded border border-[#bec8ce]/50 bg-[#f8fdff] hover:bg-[#eaf5f9] cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeRoster}
              onChange={(e) => setIncludeRoster(e.target.checked)}
              className="mt-0.5 accent-[#006481] rounded w-4 h-4 cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-[#131d20]">SciPy MILP Optimized Target Roster</span>
              <span className="text-slate-500 text-[11px]">Individual customer IDs with optimal pricing assignments (.csv)</span>
            </div>
          </label>
        </div>

        {downloadSuccess && (
          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{downloadSuccess}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#bec8ce]/50">
          <button
            type="button"
            className="px-3.5 py-1.5 rounded border border-[#bec8ce] bg-white text-slate-700 text-xs hover:bg-slate-50 font-medium transition-colors cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-1.5 rounded bg-[#006481] hover:bg-[#007ea2] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
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
