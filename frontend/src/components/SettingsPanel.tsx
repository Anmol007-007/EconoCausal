import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPreferences } from '../types.ts';
import { DEFAULT_PREFERENCES } from '../mockData.ts';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';
import { useTheme } from '../hooks/useTheme.ts';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [prefs, setPrefs] = useLocalStorage<UserPreferences>('ec-user-preferences', DEFAULT_PREFERENCES);
  const { theme, toggleTheme, isDark } = useTheme();

  const handleReset = () => {
    setPrefs(DEFAULT_PREFERENCES);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-screen max-w-md bg-white dark:bg-[#1a2b30] shadow-2xl border-l border-[#bec8ce]/50 dark:border-[#2a3a3f] flex flex-col justify-between"
            >
              {/* Header */}
              <div>
                <div className="p-5 border-b border-[#bec8ce]/40 dark:border-[#2a3a3f] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#006481] dark:text-[#2e94b9]">settings</span>
                    <div>
                      <h2 className="text-base font-bold text-[#131d20] dark:text-[#e2ecef]">
                        Platform Preferences
                      </h2>
                      <span className="text-xs font-mono text-[#475053] dark:text-[#a8b8be]">
                        Causal solver defaults & UI configuration
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    type="button"
                    className="p-1 rounded-lg hover:bg-[#eaf5f9] dark:hover:bg-[#111e22] text-[#475053] dark:text-[#a8b8be]"
                    aria-label="Close settings panel"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>

                {/* Form Body */}
                <div className="p-5 space-y-5 overflow-y-auto">
                  {/* Theme Mode */}
                  <div>
                    <label className="text-xs font-bold font-mono text-[#131d20] dark:text-[#e2ecef] block mb-1">
                      Visual Interface Theme
                    </label>
                    <p className="text-[11px] text-[#475053] dark:text-[#a8b8be] mb-2">
                      Toggle high-contrast daylight vs quantitative night operations mode.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { if (isDark) toggleTheme(); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono rounded-lg border transition-colors ${
                          !isDark ? 'bg-[#006481] text-white border-[#006481]' : 'border-[#bec8ce] text-[#475053] dark:text-[#a8b8be]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">light_mode</span>
                        <span>Light Mode</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (!isDark) toggleTheme(); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono rounded-lg border transition-colors ${
                          isDark ? 'bg-[#006481] text-white border-[#006481]' : 'border-[#bec8ce] text-[#475053] dark:text-[#a8b8be]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">dark_mode</span>
                        <span>Dark Mode</span>
                      </button>
                    </div>
                  </div>

                  {/* Default Budget */}
                  <div>
                    <label className="text-xs font-bold font-mono text-[#131d20] dark:text-[#e2ecef] block mb-1">
                      Default Campaign Budget ($ USD)
                    </label>
                    <input
                      type="number"
                      value={prefs.defaultBudget}
                      onChange={(e) => setPrefs({ ...prefs, defaultBudget: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-[#bec8ce] dark:border-[#2a3a3f] bg-white dark:bg-[#111e22] text-[#131d20] dark:text-[#e2ecef]"
                    />
                  </div>

                  {/* Default Unit Margin */}
                  <div>
                    <label className="text-xs font-bold font-mono text-[#131d20] dark:text-[#e2ecef] block mb-1">
                      Default Unit Contribution Margin ($ USD)
                    </label>
                    <input
                      type="number"
                      value={prefs.defaultUnitMargin}
                      onChange={(e) => setPrefs({ ...prefs, defaultUnitMargin: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-[#bec8ce] dark:border-[#2a3a3f] bg-white dark:bg-[#111e22] text-[#131d20] dark:text-[#e2ecef]"
                    />
                  </div>

                  {/* Confidence Interval Alpha */}
                  <div>
                    <label className="text-xs font-bold font-mono text-[#131d20] dark:text-[#e2ecef] block mb-1">
                      CATE Significance Level (α)
                    </label>
                    <select
                      value={prefs.confidenceAlpha}
                      onChange={(e) => setPrefs({ ...prefs, confidenceAlpha: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-[#bec8ce] dark:border-[#2a3a3f] bg-white dark:bg-[#111e22] text-[#131d20] dark:text-[#e2ecef]"
                    >
                      <option value={0.01}>α = 0.01 (99% Confidence Interval)</option>
                      <option value={0.05}>α = 0.05 (95% Confidence Interval — Default)</option>
                      <option value={0.10}>α = 0.10 (90% Confidence Interval)</option>
                    </select>
                  </div>

                  {/* Export Format Preference */}
                  <div>
                    <label className="text-xs font-bold font-mono text-[#131d20] dark:text-[#e2ecef] block mb-1">
                      Default Report Export Format
                    </label>
                    <div className="flex gap-2">
                      {(['csv', 'json', 'pdf'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setPrefs({ ...prefs, exportFormat: fmt })}
                          className={`flex-1 py-1.5 text-xs font-mono rounded-lg border uppercase transition-colors ${
                            prefs.exportFormat === fmt
                              ? 'bg-[#006481] text-white border-[#006481] font-bold'
                              : 'border-[#bec8ce] text-[#475053] dark:text-[#a8b8be]'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggle Streaming Stream */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xs font-bold font-mono text-[#131d20] dark:text-[#e2ecef] block">
                        Live Stream Telemetry
                      </span>
                      <span className="text-[11px] text-[#475053] dark:text-[#a8b8be]">
                        Poll background synthetic events every 4s
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs.autoRefreshStream}
                      onChange={(e) => setPrefs({ ...prefs, autoRefreshStream: e.target.checked })}
                      className="h-4 w-4 accent-[#006481] rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-[#bec8ce]/40 dark:border-[#2a3a3f] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-mono text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg bg-[#006481] hover:bg-[#007ea2] text-white text-xs font-medium font-mono shadow-xs"
                >
                  Save & Apply
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

