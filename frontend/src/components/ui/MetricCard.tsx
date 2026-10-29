import React from 'react';
import { motion } from 'motion/react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
  trend?: { value: number; label: string };
  subtitle?: string;
  className?: string;
  loading?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

const variantStyles: Record<string, string> = {
  default: 'bg-white dark:bg-[#1a2b30] border-[#bec8ce]/50 dark:border-[#2a3a3f]',
  primary: 'bg-[#eaf5f9] dark:bg-[#006481]/10 border-[#006481]/20',
  success: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200/50',
  warning: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200/50',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  icon,
  trend,
  subtitle,
  className = '',
  loading = false,
  variant = 'default',
}) => {
  if (loading) {
    return (
      <div className={`rounded-xl border p-4 animate-pulse ${variantStyles[variant]} ${className}`}>
        <div className="h-3 bg-[#eaf5f9] dark:bg-[#2a3a3f] rounded w-1/2 mb-3" />
        <div className="h-6 bg-[#eaf5f9] dark:bg-[#2a3a3f] rounded w-2/3" />
      </div>
    );
  }

  const trendPositive = trend && trend.value >= 0;

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(0,100,129,0.08)' }}
      transition={{ duration: 0.15 }}
      className={`rounded-xl border p-4 ${variantStyles[variant]} ${className}`}
    >
      <div className="flex items-start justify-between mb-1.5">
        <span className="text-xs font-mono text-[#475053] dark:text-[#a8b8be] uppercase tracking-wider">{label}</span>
        {icon && <span className="material-symbols-outlined text-base text-[#2e94b9] dark:text-[#2e94b9]">{icon}</span>}
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-2xl font-bold font-mono text-[#131d20] dark:text-[#e2ecef] leading-none">{value}</span>
        {unit && <span className="text-xs text-[#475053] dark:text-[#a8b8be] mb-0.5">{unit}</span>}
      </div>
      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-1.5">
          {trend && (
            <span className={`text-xs font-mono font-medium ${trendPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {trendPositive ? '▲' : '▼'} {Math.abs(trend.value).toFixed(1)}%
            </span>
          )}
          {subtitle && <span className="text-xs text-[#475053] dark:text-[#a8b8be]">{subtitle}</span>}
        </div>
      )}
    </motion.div>
  );
};

