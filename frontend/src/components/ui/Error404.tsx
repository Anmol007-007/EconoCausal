import React from 'react';

export const Error404: React.FC<{ onGoHome?: () => void }> = ({ onGoHome }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
    <span className="text-6xl font-bold font-mono text-[#bec8ce] dark:text-[#2a3a3f]">404</span>
    <p className="text-base font-semibold text-[#131d20] dark:text-[#e2ecef]">Page not found</p>
    <p className="text-sm text-[#475053] dark:text-[#a8b8be]">The view you are looking for does not exist.</p>
    {onGoHome && (
      <button
        onClick={onGoHome}
        type="button"
        className="mt-2 px-4 py-2 bg-[#006481] text-white text-sm rounded-lg hover:bg-[#007ea2] transition-colors"
      >
        Go to Dashboard
      </button>
    )}
  </div>
);

