/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Notification({ message, type, onClose }: NotificationProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bottom-28 left-6 right-6 md:left-auto md:right-auto md:w-[360px] z-[100]"
    >
      <div className={`glass px-6 py-4 rounded-2xl flex items-center gap-4 border border-white/10 shadow-2xl ${type === 'success' ? 'bg-brand-teal/20' : 'bg-red-500/20'}`}>
        {type === 'success' ? (
          <CheckCircle2 className="text-brand-teal w-6 h-6 flex-shrink-0" />
        ) : (
          <AlertCircle className="text-red-400 w-6 h-6 flex-shrink-0" />
        )}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button onClick={onClose} className="p-1 text-white/30 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
