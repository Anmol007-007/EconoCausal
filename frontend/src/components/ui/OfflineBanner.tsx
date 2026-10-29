import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { AnimatePresence, motion } from 'motion/react';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[99999] bg-amber-500 text-white text-xs font-medium flex items-center justify-center gap-2 py-1.5 overflow-hidden"
        >
          <span className="material-symbols-outlined text-sm">wifi_off</span>
          You are offline — some features may be unavailable
        </motion.div>
      )}
    </AnimatePresence>
  );
};

