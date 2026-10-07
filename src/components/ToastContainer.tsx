import React, { useEffect, useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { ToastMessage } from '../types';
import { playNotificationSound } from '../utils/soundEffects';

interface ToastItemProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const duration = toast.duration || 4500;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Mainkan sound chime saat notifikasi muncul
    playNotificationSound(toast.type);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.type, duration]);

  // Model & palet warna bertema Tosca / Modern
  const config = {
    success: {
      badge: 'BERHASIL',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-500/20',
      border: 'border-emerald-500/30 ring-1 ring-emerald-500/10',
      progressBar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      badge: 'PERHATIAN',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/20',
      border: 'border-rose-500/30 ring-1 ring-rose-500/10',
      progressBar: 'bg-gradient-to-r from-rose-500 to-pink-500',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      badge: 'PERINGATAN',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/20',
      border: 'border-amber-500/30 ring-1 ring-amber-500/10',
      progressBar: 'bg-gradient-to-r from-amber-500 to-orange-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      badge: 'INFORMASI',
      badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
      iconBg: 'bg-gradient-to-br from-[#06B6D4] to-[#14B8A6] text-white shadow-teal-500/20',
      border: 'border-teal-500/30 ring-1 ring-teal-500/10',
      progressBar: 'bg-gradient-to-r from-[#06B6D4] to-[#14B8A6]',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-2xl shadow-2xl shadow-teal-950/15 border transition-all duration-300 animate-in slide-in-from-bottom-3 hover:shadow-teal-900/25 ${config.border}`}
      style={{ minWidth: '300px' }}
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3.5">
        {/* Styled Icon Avatar */}
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${config.iconBg}`}>
          {config.icon}
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${config.badgeBg}`}>
              {config.badge}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">NARmusic</span>
          </div>

          <h4 className="font-bold text-sm text-[#0F2F2C] leading-snug">
            {toast.title}
          </h4>

          {toast.message && (
            <p className="text-xs text-teal-800/80 mt-0.5 leading-relaxed font-medium">
              {toast.message}
            </p>
          )}

          {/* Optional Action Button */}
          {toast.actionLabel && toast.onAction && (
            <button
              onClick={() => {
                toast.onAction?.();
                onClose(toast.id);
              }}
              className="mt-2 px-3 py-1 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 shadow-sm transition"
            >
              {toast.actionLabel}
            </button>
          )}
        </div>

        {/* Close button with micro interaction */}
        <button
          onClick={() => onClose(toast.id)}
          className="p-1.5 rounded-xl text-gray-400 hover:text-[#0F2F2C] hover:bg-teal-50 transition active:scale-90"
          title="Tutup Notifikasi"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Animated Count-down Progress Line */}
      <div className="w-full bg-teal-50 h-1 overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ease-linear ${config.progressBar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useMusic();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 md:bottom-28 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-2 select-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};
