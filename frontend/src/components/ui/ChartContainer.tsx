import React from 'react';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
  actions?: React.ReactNode;
  height?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  loading = false,
  empty = false,
  emptyMessage = 'No data available',
  className = '',
  actions,
  height = 'h-72',
}) => (
  <div className={`bg-white dark:bg-[#1a2b30] rounded-xl border border-[#bec8ce]/50 dark:border-[#2a3a3f] p-5 ${className}`}>
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-[#131d20] dark:text-[#e2ecef]">{title}</h3>
        {subtitle && <p className="text-xs text-[#475053] dark:text-[#a8b8be] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
    <div className={`${height} flex items-center justify-center`}>
      {loading ? (
        <Spinner size="lg" />
      ) : empty ? (
        <EmptyState icon="bar_chart" title={emptyMessage} description="Run the pipeline to generate chart data." />
      ) : (
        children
      )}
    </div>
  </div>
);

