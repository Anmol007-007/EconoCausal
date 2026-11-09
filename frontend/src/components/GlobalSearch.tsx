import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenTab } from '../types.ts';
import { TAB_CATEGORIES } from '../constants/routes.ts';
import { useTheme } from '../hooks/useTheme.ts';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ScreenTab) => void;
  onRunPipeline: () => void;
  onOpenApiDocs: () => void;
  onOpenExportModal: () => void;
}

interface ActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  category: string;
  action: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onRunPipeline,
  onOpenApiDocs,
  onOpenExportModal,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toggleTheme } = useTheme();

  const allItems: ActionItem[] = [
    ...TAB_CATEGORIES.flatMap((cat) =>
      cat.tabs.map((t) => ({
        id: `tab-${t.id}`,
        title: t.label,
        subtitle: `Jump to ${cat.name} section`,
        icon: t.icon,
        category: cat.name,
        action: () => {
          onSelectTab(t.id);
          onClose();
        },
      }))
    ),
    {
      id: 'action-pipeline',
      title: 'Run Causal ML Pipeline',
      subtitle: 'Fit EconML CausalForestDML cross-fitting engine',
      icon: 'play_arrow',
      category: 'Quick Actions',
      action: () => {
        onClose();
        onRunPipeline();
      },
    },
    {
      id: 'action-api-docs',
      title: 'Inspect OpenAPI Endpoints',
      subtitle: 'View FastAPI microservice latency SLAs and contracts',
      icon: 'terminal',
      category: 'Quick Actions',
      action: () => {
        onClose();
        onOpenApiDocs();
      },
    },
    {
      id: 'action-export',
      title: 'Export Campaign Report',
      subtitle: 'Download complete dataset, deciles, and executive summary',
      icon: 'download',
      category: 'Quick Actions',
      action: () => {
        onClose();
        onOpenExportModal();
      },
    },
    {
      id: 'action-theme',
      title: 'Toggle Dark / Light Mode',
      subtitle: 'Switch application color palette',
      icon: 'contrast',
      category: 'Quick Actions',
      action: () => {
        toggleTheme();
        onClose();
      },
    },
  ];

  const filteredItems = allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center">

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-xl bg-white dark:bg-[#1a2b30] rounded-2xl shadow-2xl border border-[#bec8ce]/50 dark:border-[#2a3a3f] overflow-hidden"
          >

            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#bec8ce]/40 dark:border-[#2a3a3f]">
              <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search views, models, actions... (Use ↑↓ to navigate)"
                className="w-full bg-transparent text-sm font-sans text-[#131d20] dark:text-[#e2ecef] placeholder-slate-400 focus:outline-none"
              />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#bec8ce]/60 text-slate-400">
                ESC
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[#bec8ce]/20 dark:divide-[#2a3a3f]/40">
              {filteredItems.length === 0 ? (
                <div className="text-center py-10 font-mono text-xs text-[#6f787e]">
                  No matching views or actions found for "{query}".
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#eaf5f9] dark:bg-[#111e22] text-[#006481] dark:text-[#2e94b9]'
                          : 'text-[#131d20] dark:text-[#e2ecef] hover:bg-slate-50 dark:hover:bg-[#1a2b30]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#006481] text-white'
                              : 'bg-slate-100 dark:bg-[#2a3a3f] text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">{item.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{item.title}</div>
                          <div className="text-[11px] text-[#6f787e] dark:text-[#a8b8be] truncate">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-[#2a3a3f] text-slate-500">
                          {item.category}
                        </span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-sm text-[#006481] dark:text-[#2e94b9]">
                            keyboard_return
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2 border-t border-[#bec8ce]/30 dark:border-[#2a3a3f] bg-[#f1fbff] dark:bg-[#111e22] flex items-center justify-between text-[10px] font-mono text-[#6f787e]">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Dismiss</span>
              </div>
              <span>EconoCausal Omnisearch v2.0</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

