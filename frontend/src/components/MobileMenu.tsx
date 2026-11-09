import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenTab } from '../types.ts';
import { TAB_CATEGORIES } from '../constants/routes.ts';
import { useTheme } from '../hooks/useTheme.ts';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: ScreenTab;
  onSelectTab: (tab: ScreenTab) => void;
  onRunPipeline: () => void;
  onOpenApiDocs: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  isPipelineRunning: boolean;
  isBackendLive: boolean | null;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  onRunPipeline,
  onOpenApiDocs,
  onOpenNotifications,
  onOpenSettings,
  isPipelineRunning,
  isBackendLive,
}) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-screen max-w-xs sm:max-w-sm bg-white dark:bg-[#1a2b30] shadow-2xl border-r border-[#bec8ce]/50 dark:border-[#2a3a3f] flex flex-col justify-between"
            >

              <div>
                <div className="p-4 border-b border-[#bec8ce]/40 dark:border-[#2a3a3f] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#006481] to-[#004d64] text-white flex items-center justify-center font-serif italic text-base font-bold shadow-xs">
                      Ec
                    </div>
                    <div>
                      <h2 className="font-serif text-base font-bold text-[#131d20] dark:text-[#e2ecef] leading-none">
                        EconoCausal
                      </h2>
                      <span className="font-mono text-[10px] text-[#2e94b9] uppercase mt-0.5 block">
                        Causal AI Engine v2.0
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    type="button"
                    className="p-2 rounded-lg hover:bg-[#eaf5f9] dark:hover:bg-[#111e22] text-[#475053] dark:text-[#a8b8be] min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Close navigation menu"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>

                <div className="px-4 py-2 bg-[#f1fbff] dark:bg-[#111e22] border-b border-[#bec8ce]/30 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-[#475053] dark:text-[#a8b8be]">
                      {isBackendLive ? 'API LIVE' : 'MOCK MODE'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Node-03</span>
                </div>

                <div className="p-3 overflow-y-auto max-h-[calc(100vh-220px)] space-y-4">
                  {TAB_CATEGORIES.map((cat) => (
                    <div key={cat.id} className="space-y-1">
                      <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                        {cat.name}
                      </div>
                      {cat.tabs.map((tab) => {
                        const isActive = currentTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              onSelectTab(tab.id);
                              onClose();
                            }}
                            className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl flex items-center justify-between text-xs font-medium transition-colors ${
                              isActive
                                ? 'bg-[#006481] text-white font-semibold shadow-xs'
                                : 'text-[#131d20] dark:text-[#e2ecef] hover:bg-[#eaf5f9] dark:hover:bg-[#111e22]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`material-symbols-outlined text-lg ${isActive ? 'text-white' : 'text-[#006481] dark:text-[#2e94b9]'}`}>
                                {tab.icon}
                              </span>
                              <span>{tab.label}</span>
                            </div>

                            {tab.badge && (
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}>
                                {tab.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-[#bec8ce]/40 dark:border-[#2a3a3f] bg-white dark:bg-[#1a2b30] space-y-2">
                <button
                  onClick={() => {
                    onClose();
                    onRunPipeline();
                  }}
                  disabled={isPipelineRunning}
                  type="button"
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-[#006481] hover:bg-[#007ea2] text-white font-medium text-xs font-mono shadow-xs"
                >
                  <span className={`material-symbols-outlined text-sm ${isPipelineRunning ? 'animate-spin' : ''}`}>
                    {isPipelineRunning ? 'sync' : 'play_arrow'}
                  </span>
                  <span>{isPipelineRunning ? 'Fitting Models...' : 'Run Pipeline'}</span>
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={toggleTheme}
                    type="button"
                    className="min-h-[44px] flex flex-col items-center justify-center p-2 rounded-lg border border-[#bec8ce]/50 text-xs font-mono text-[#475053] dark:text-[#a8b8be]"
                    aria-label="Toggle theme mode"
                  >
                    <span className="material-symbols-outlined text-base">
                      {isDark ? 'light_mode' : 'dark_mode'}
                    </span>
                    <span className="text-[10px] mt-0.5">{isDark ? 'Light' : 'Dark'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenNotifications();
                    }}
                    type="button"
                    className="min-h-[44px] flex flex-col items-center justify-center p-2 rounded-lg border border-[#bec8ce]/50 text-xs font-mono text-[#475053] dark:text-[#a8b8be]"
                    aria-label="Open notifications"
                  >
                    <span className="material-symbols-outlined text-base">notifications</span>
                    <span className="text-[10px] mt-0.5">Alerts</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    type="button"
                    className="min-h-[44px] flex flex-col items-center justify-center p-2 rounded-lg border border-[#bec8ce]/50 text-xs font-mono text-[#475053] dark:text-[#a8b8be]"
                    aria-label="Open settings"
                  >
                    <span className="material-symbols-outlined text-base">settings</span>
                    <span className="text-[10px] mt-0.5">Settings</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

