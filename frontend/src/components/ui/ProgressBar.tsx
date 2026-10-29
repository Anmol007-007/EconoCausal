import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const variantBg: Record<string, string> = {
  primary: 'bg-[#006481]',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

const heightClass: Record<string, string> = { sm: 'h-1', md: 'h-2', lg: 'h-3' };

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercent = false,
  variant = 'primary',
  size = 'md',
  animated = false,
  className = '',
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={className}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-[#475053] dark:text-[#a8b8be]">{label}</span>}
          {showPercent && <span className="text-xs font-mono text-[#006481] dark:text-[#2e94b9]">{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div className={`w-full bg-[#eaf5f9] dark:bg-[#1a2b30] rounded-full overflow-hidden ${heightClass[size]}`}>
        <div
          className={`${heightClass[size]} ${variantBg[variant]} rounded-full transition-all duration-700 ease-out ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};

