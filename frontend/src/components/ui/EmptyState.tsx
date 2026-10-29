import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = 'inbox', title, description, action, className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
    <span className="material-symbols-outlined text-5xl text-[#bec8ce] dark:text-[#2a3a3f] mb-4">{icon}</span>
    <h3 className="text-base font-semibold text-[#131d20] dark:text-[#e2ecef] mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-[#475053] dark:text-[#a8b8be] max-w-sm">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

