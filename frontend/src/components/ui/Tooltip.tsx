
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', className = '' }) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const positions = {
      top: { top: rect.top - 36 + window.scrollY, left: rect.left + rect.width / 2 + window.scrollX },
      bottom: { top: rect.bottom + 8 + window.scrollY, left: rect.left + rect.width / 2 + window.scrollX },
      left: { top: rect.top + rect.height / 2 + window.scrollY, left: rect.left - 8 + window.scrollX },
      right: { top: rect.top + rect.height / 2 + window.scrollY, left: rect.right + 8 + window.scrollX },
    };
    setCoords(positions[position]);
  };

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => { updateCoords(); setVisible(true); }}
        onMouseLeave={() => setVisible(false)}
        className={`inline-flex items-center ${className}`}
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <div
            className="fixed z-[9999] px-2 py-1 bg-[#131d20] dark:bg-[#e2ecef] text-white dark:text-[#131d20] text-xs rounded shadow-lg pointer-events-none -translate-x-1/2 whitespace-nowrap"
            style={{ top: coords.top, left: coords.left }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};

