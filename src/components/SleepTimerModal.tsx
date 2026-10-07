import React from 'react';
import { useMusic } from '../context/MusicContext';
import { formatTime } from '../utils/metadata';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({ isOpen, onClose }) => {
  const { sleepTimerMinutes, sleepTimerRemaining, setSleepTimer } = useMusic();

  if (!isOpen) return null;

  const options: Array<{ label: string; value: number | 'endOfSong' }> = [
    { label: '15 Menit', value: 15 },
    { label: '30 Menit', value: 30 },
    { label: '45 Menit', value: 45 },
    { label: '60 Menit', value: 60 },
    { label: 'Di Akhir Lagu Ini', value: 'endOfSong' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-teal-500/20 text-[#0F2F2C]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base">Sleep Timer</h3>
              <p className="text-xs text-teal-600">Hentikan musik otomatis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {sleepTimerRemaining !== null && (
          <div className="mb-4 p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-center">
            <span className="text-xs text-teal-600 font-medium">Sisa Waktu Tidur</span>
            <div className="text-2xl font-bold font-mono text-teal-700 mt-0.5">
              {formatTime(sleepTimerRemaining)}
            </div>
          </div>
        )}

        <div className="space-y-2 mb-4">
          {options.map((opt) => {
            const isSelected =
              opt.value === 'endOfSong'
                ? sleepTimerMinutes === null && sleepTimerRemaining === null
                : sleepTimerMinutes === opt.value;

            return (
              <button
                key={opt.label}
                onClick={() => {
                  setSleepTimer(opt.value);
                  onClose();
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-left flex items-center justify-between transition ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white shadow-md'
                    : 'bg-teal-50/70  hover:bg-teal-100 '
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {(sleepTimerMinutes !== null || sleepTimerRemaining !== null) && (
          <button
            onClick={() => {
              setSleepTimer(null);
              onClose();
            }}
            className="w-full py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition mb-2"
          >
            Matikan Sleep Timer
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-teal-500/20 text-xs font-semibold hover:bg-gray-100 transition"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
