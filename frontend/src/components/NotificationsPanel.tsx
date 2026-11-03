import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertNotification } from '../types.ts';
import { SYSTEM_NOTIFICATIONS_DATA } from '../mockData.ts';
import { Badge } from './ui/Badge.tsx';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<AlertNotification[]>(SYSTEM_NOTIFICATIONS_DATA);
  const [filter, setFilter] = useState<'all' | 'unread' | 'drift' | 'budget'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'drift') return n.category === 'drift';
    if (filter === 'budget') return n.category === 'budget';
    return true;
  });

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
              className="w-screen max-w-md bg-white dark:bg-[#1a2b30] shadow-2xl border-l border-[#bec8ce]/50 dark:border-[#2a3a3f] flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#bec8ce]/40 dark:border-[#2a3a3f] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#006481] dark:text-[#2e94b9]">notifications</span>
                  <div>
                    <h2 className="text-base font-bold text-[#131d20] dark:text-[#e2ecef]">
                      System Notifications
                    </h2>
                    <span className="text-xs font-mono text-[#475053] dark:text-[#a8b8be]">
                      {unreadCount} unread alert{unreadCount === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      type="button"
                      className="text-xs text-[#006481] dark:text-[#2e94b9] hover:underline font-mono"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    type="button"
                    className="p-1 rounded-lg hover:bg-[#eaf5f9] dark:hover:bg-[#111e22] text-[#475053] dark:text-[#a8b8be]"
                    aria-label="Close notifications panel"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1 px-5 py-2.5 border-b border-[#bec8ce]/30 dark:border-[#2a3a3f] bg-[#f1fbff] dark:bg-[#111e22]">
                {(['all', 'unread', 'drift', 'budget'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    type="button"
                    className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors ${
                      filter === f
                        ? 'bg-[#006481] text-white'
                        : 'text-[#475053] dark:text-[#a8b8be] hover:bg-white dark:hover:bg-[#1a2b30]'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-[#6f787e] font-mono text-xs">
                    <span className="material-symbols-outlined text-3xl mb-2 text-[#bec8ce] block">
                      notifications_off
                    </span>
                    No notifications in this category.
                  </div>
                ) : (
                  filtered.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        item.read
                          ? 'bg-[#f1fbff]/40 dark:bg-[#111e22]/40 border-[#bec8ce]/30 dark:border-[#2a3a3f]'
                          : 'bg-white dark:bg-[#111e22] border-[#006481]/30 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          {!item.read && (
                            <span className="w-2 h-2 rounded-full bg-[#006481]" />
                          )}
                          <h4 className="text-xs font-bold text-[#131d20] dark:text-[#e2ecef]">
                            {item.title}
                          </h4>
                        </div>
                        <button
                          onClick={() => clearNotification(item.id)}
                          type="button"
                          className="text-[#6f787e] hover:text-[#131d20] dark:hover:text-white"
                          aria-label="Dismiss notification"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </div>

                      <p className="text-xs text-[#475053] dark:text-[#a8b8be] leading-relaxed mb-2">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-mono text-[#6f787e]">
                        <Badge
                          label={item.category.toUpperCase()}
                          variant={
                            item.severity === 'success' ? 'success' :
                            item.severity === 'error' ? 'danger' :
                            item.severity === 'warning' ? 'warning' : 'info'
                          }
                        />
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

