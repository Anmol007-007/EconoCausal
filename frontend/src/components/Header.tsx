import React, { useEffect, useState } from 'react';
import { ScreenTab } from '../types.ts';
import { apiService } from '../apiService.ts';
import { useTheme } from '../hooks/useTheme.ts';
import { TAB_CATEGORIES } from '../constants/routes.ts';
import { SYSTEM_NOTIFICATIONS_DATA } from '../mockData.ts';

interface HeaderProps {
  currentTab: ScreenTab;
  onSelectTab: (tab: ScreenTab) => void;
  onOpenApiDocs: () => void;
  onRunPipeline: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  isPipelineRunning: boolean;
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenApiDocs,
  onRunPipeline,
  onOpenSearch,
  onOpenNotifications,
  onOpenSettings,
  isPipelineRunning,
  onToggleMobileMenu,
}) => {
  const [isBackendLive, setIsBackendLive] = useState<boolean | null>(null);
  const { toggleTheme, isDark } = useTheme();
  const unreadAlerts = SYSTEM_NOTIFICATIONS_DATA.filter((n) => !n.read).length;

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const live = await apiService.checkHealth();
      if (mounted) setIsBackendLive(live);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="fixed top-0 w-full z-40 bg-white/95 dark:bg-[#111e22]/95 backdrop-blur-md border-b border-[#bec8ce]/50 dark:border-[#2a3a3f] shadow-[0_1px_3px_rgba(19,29,32,0.04)]">
      <div className="w-full px-4 sm:px-8 xl:px-12 flex flex-col justify-between">

        <div className="h-16 flex items-center justify-between gap-3 sm:gap-4">

          <div className="flex items-center gap-3 sm:gap-5">
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => onSelectTab('upload-pipeline')}
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#006481] to-[#004d64] text-white flex items-center justify-center font-serif italic text-base font-bold shadow-xs">
                Ec
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg font-semibold tracking-tight text-[#131d20] dark:text-[#e2ecef] leading-none">
                  EconoCausal
                </span>
                <span className="font-label-code text-[10px] text-[#2e94b9] uppercase tracking-wider mt-0.5">
                  Causal-AI • Ref: ITS/DSML/1150
                </span>
              </div>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded border border-[#bec8ce]/50 dark:border-[#2a3a3f] bg-[#eaf5f9] dark:bg-[#1a2b30] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#2e94b9]"></span>
              <span className="font-label-code text-slate-500 dark:text-slate-400">Campaign:</span>
              <span className="font-label-code text-[#131d20] dark:text-[#e2ecef] font-semibold">
                Q4 Persuadable Promo • Synthetic Retail 50k
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">

            <button
              onClick={onOpenSearch}
              type="button"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#bec8ce]/50 dark:border-[#2a3a3f] bg-[#f1fbff] dark:bg-[#1a2b30] hover:bg-[#eaf5f9] text-xs text-[#475053] dark:text-[#a8b8be] font-mono transition-colors"
              title="Search views, models, and actions (⌘K)"
            >
              <span className="material-symbols-outlined text-sm text-[#006481] dark:text-[#2e94b9]">search</span>
              <span className="text-[11px]">Quick Search</span>
              <kbd className="px-1.5 py-0.2 bg-white dark:bg-[#111e22] border border-[#bec8ce]/60 dark:border-[#2a3a3f] rounded text-[10px]">
                ⌘K
              </kbd>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#bec8ce]/50 dark:border-[#2a3a3f] bg-[#eaf5f9] dark:bg-[#1a2b30] text-[#475053] dark:text-[#a8b8be] font-label-code text-xs">
              <span className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-emerald-500 animate-pulse' : isBackendLive === false ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
              <span>{isBackendLive ? 'API: LIVE' : 'API: MOCK'}</span>
            </div>

            <button
              onClick={onOpenNotifications}
              type="button"
              className="relative flex items-center justify-center w-8 h-8 rounded-lg border border-[#bec8ce]/50 dark:border-[#2a3a3f] hover:bg-[#eaf5f9] dark:hover:bg-[#1a2b30] text-[#475053] dark:text-[#a8b8be] transition-colors"
              title="Notifications"
              aria-label="View notifications"
            >
              <span className="material-symbols-outlined text-base">notifications</span>
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold font-mono flex items-center justify-center">
                  {unreadAlerts}
                </span>
              )}
            </button>

            <button
              onClick={onOpenSettings}
              type="button"
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#bec8ce]/50 dark:border-[#2a3a3f] hover:bg-[#eaf5f9] dark:hover:bg-[#1a2b30] text-[#475053] dark:text-[#a8b8be] transition-colors"
              title="Preferences & Settings"
              aria-label="Open settings"
            >
              <span className="material-symbols-outlined text-base">settings</span>
            </button>

            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#bec8ce]/50 dark:border-[#2a3a3f] hover:bg-[#eaf5f9] dark:hover:bg-[#1a2b30] text-[#475053] dark:text-[#a8b8be] transition-colors cursor-pointer"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              type="button"
              aria-label="Toggle dark mode"
            >
              <span className="material-symbols-outlined text-base">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>

            <button
              onClick={onOpenApiDocs}
              className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#bec8ce]/50 dark:border-[#2a3a3f] hover:bg-[#eaf5f9] dark:hover:bg-[#1a2b30] text-[#475053] dark:text-[#a8b8be] font-label-code text-xs transition-colors cursor-pointer"
              title="Inspect OpenAPI Microservice Endpoints"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">terminal</span>
              <span>API Specs</span>
            </button>

            <button
              onClick={onRunPipeline}
              disabled={isPipelineRunning}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium text-xs text-white tracking-wide shadow-xs transition-all cursor-pointer ${
                isPipelineRunning
                  ? 'bg-[#2e94b9] opacity-80 cursor-wait'
                  : 'bg-[#006481] hover:bg-[#007ea2] active:scale-95'
              }`}
              type="button"
            >
              <span className={`material-symbols-outlined text-sm ${isPipelineRunning ? 'animate-spin' : ''}`}>
                {isPipelineRunning ? 'sync' : 'play_arrow'}
              </span>
              <span className="hidden sm:inline">{isPipelineRunning ? 'Fitting...' : 'Run Pipeline'}</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#bec8ce]/50 dark:border-[#2a3a3f]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#006481] to-[#2e94b9] text-white flex items-center justify-center font-semibold text-xs shadow-xs ring-2 ring-[#006481]/20">
                AS
              </div>
            </div>

            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden min-h-[44px] min-w-[44px] p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 rounded-lg flex items-center justify-center"
              aria-label="Toggle Mobile Navigation"
              type="button"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
          </div>
        </div>

        <div className="hidden lg:flex h-11 items-center justify-between border-t border-[#bec8ce]/40 dark:border-[#2a3a3f] overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1 h-full min-w-max">
            {TAB_CATEGORIES.flatMap((cat) => cat.tabs).map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  type="button"
                  className={`h-full px-3.5 flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-[#006481] dark:text-[#2e94b9] bg-[#eaf5f9] dark:bg-[#1a2b30] font-semibold shadow-[inset_0_-2px_0_0_#2e94b9]'
                      : 'text-[#576063] dark:text-[#a8b8be] hover:text-[#131d20] dark:hover:text-white hover:bg-[#eaf5f9]/50 dark:hover:bg-[#1a2b30]/50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-sm ${isActive ? 'text-[#006481] dark:text-[#2e94b9]' : 'text-slate-400'}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                      isActive ? 'bg-[#006481] text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden 2xl:flex items-center gap-2 text-slate-500 dark:text-slate-400 font-label-code text-xs pl-4">
            <span className={`inline-block w-2 h-2 rounded-full ${isBackendLive ? 'bg-emerald-500' : 'bg-[#2e94b9]'}`}></span>
            <span>{isBackendLive ? 'CLUSTER: CONNECTED' : 'CLUSTER: ACTIVE (EVAL-NODE-03)'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
