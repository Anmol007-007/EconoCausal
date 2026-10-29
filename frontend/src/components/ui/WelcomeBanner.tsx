import React from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { motion, AnimatePresence } from 'motion/react';

export const WelcomeBanner: React.FC = () => {
  const [dismissed, setDismissed] = useLocalStorage('ec-welcome-dismissed', false);
  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gradient-to-r from-[#006481] to-[#2e94b9] text-white rounded-xl p-4 flex items-center justify-between gap-4 shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl">waving_hand</span>
            <div>
              <p className="text-sm font-semibold">Welcome to EconoCausal v2.0</p>
              <p className="text-xs opacity-80 mt-0.5">Upload your dataset, run the causal ML pipeline, and optimize your campaign budget — all in one place.</p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            type="button"
            className="flex-shrink-0 p-1 rounded opacity-70 hover:opacity-100 hover:bg-white/10 transition-all"
            aria-label="Dismiss welcome banner"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

