import React from 'react';

interface SkeletonCardProps {
  lines?: number;
  className?: string;
  showHeader?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ lines = 3, className = '', showHeader = true }) => (
  <div className={`bg-white dark:bg-[#1a2b30] rounded-xl border border-[#bec8ce]/50 dark:border-[#2a3a3f] p-5 animate-pulse ${className}`}>
    {showHeader && (
      <div className="mb-4">
        <div className="h-4 bg-[#eaf5f9] dark:bg-[#2a3a3f] rounded w-1/3 mb-2" />
        <div className="h-3 bg-[#eaf5f9] dark:bg-[#2a3a3f] rounded w-1/2" />
      </div>
    )}
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-[#eaf5f9] dark:bg-[#2a3a3f] rounded ${i === lines - 1 ? 'w-4/5' : 'w-full'}`} />
      ))}
    </div>
  </div>
);

