import React from 'react';
import { Tooltip } from './Tooltip';

interface HelpTooltipProps {
  text: string;
  className?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ text, className = '' }) => (
  <Tooltip content={text}>
    <span
      className={`material-symbols-outlined text-sm text-[#bec8ce] dark:text-[#3a4d52] hover:text-[#006481] dark:hover:text-[#2e94b9] cursor-help transition-colors ${className}`}
    >
      info
    </span>
  </Tooltip>
);

