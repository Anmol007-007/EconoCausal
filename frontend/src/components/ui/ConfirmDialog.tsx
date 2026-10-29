import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'primary';
}

const variantBtn: Record<string, string> = {
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  primary: 'bg-[#006481] hover:bg-[#007ea2] text-white',
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, variant = 'primary',
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onCancel}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="relative bg-white dark:bg-[#1a2b30] rounded-2xl shadow-2xl border border-[#bec8ce]/50 dark:border-[#2a3a3f] p-6 max-w-sm w-full mx-4"
        >
          <h3 className="text-base font-semibold text-[#131d20] dark:text-[#e2ecef] mb-2">{title}</h3>
          <p className="text-sm text-[#475053] dark:text-[#a8b8be] mb-5 leading-relaxed">{message}</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onCancel}
              type="button"
              className="px-4 py-2 rounded-lg text-sm text-[#475053] dark:text-[#a8b8be] hover:bg-[#eaf5f9] dark:hover:bg-[#2a3a3f] transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${variantBtn[variant]}`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

