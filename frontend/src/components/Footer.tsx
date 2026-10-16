import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-[#bec8ce]/50 z-30">
      <div className="h-9 w-full px-4 sm:px-8 xl:px-10 flex items-center justify-between font-label-code text-xs text-[#576063]">
        <div className="flex items-center gap-4 lg:gap-6 overflow-x-auto py-1">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-slate-400">DoWhy Estimand:</span>
            <span className="text-[#006481] font-medium">Identified</span>
          </div>
          <span className="text-[#bec8ce]">|</span>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-slate-400">EconML Engine:</span>
            <span className="text-[#2e94b9] font-medium">CausalForestDML (cv=5)</span>
          </div>
          <span className="text-[#bec8ce]">|</span>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-slate-400">Optimizer:</span>
            <span className="text-[#131d20] font-medium">SciPy MILP</span>
          </div>
          <span className="text-[#bec8ce]">|</span>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-slate-400">Memory:</span>
            <span className="text-[#131d20] font-medium">50,000 customers indexed</span>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-4 whitespace-nowrap">
          <span className="text-slate-400">LATENCY: 42ms</span>
          <span className="text-[#bec8ce]">|</span>
          <span className="text-[#006481] font-semibold">DOUBLE ML CONVERGED</span>
        </div>
      </div>
    </footer>
  );
};
