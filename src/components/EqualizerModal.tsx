import React from 'react';
import { useMusic } from '../context/MusicContext';
import { EQUALIZER_PRESETS, EQ_FREQUENCIES } from '../utils/audioEngine';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({ isOpen, onClose }) => {
  const { eqPreset, eqGains, setEqPreset, setEqBandGain } = useMusic();

  if (!isOpen) return null;

  const freqLabels = ['60 Hz', '230 Hz', '910 Hz', '3.6 kHz', '14 kHz'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-teal-500/20 text-[#0F2F2C]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#06B6D4] to-[#14B8A6] flex items-center justify-center text-white shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Equalizer Audio</h3>
              <p className="text-xs text-teal-600">Web Audio API 5-Band BiquadFilter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preset Selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold mb-2 text-gray-700">
            Pilihan Preset
          </label>
          <div className="flex flex-wrap gap-2">
            {EQUALIZER_PRESETS.map((preset) => {
              const active = eqPreset.toLowerCase() === preset.name.toLowerCase();
              return (
                <button
                  key={preset.name}
                  onClick={() => setEqPreset(preset.name)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    active
                      ? 'bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white shadow-md shadow-teal-500/25 scale-105'
                      : 'bg-teal-50 text-teal-900 border border-teal-200 hover:bg-teal-100'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
            {eqPreset === 'Kustom' && (
              <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 text-white shadow-md">
                Kustom
              </span>
            )}
          </div>
        </div>

        {/* 5-Band Sliders */}
        <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200">
          <div className="flex justify-between items-center mb-2 px-1 text-[11px] text-gray-500 font-mono">
            <span>+12 dB</span>
            <span>0 dB</span>
            <span>-12 dB</span>
          </div>

          <div className="grid grid-cols-5 gap-3 pt-2">
            {EQ_FREQUENCIES.map((_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-bold text-teal-800 font-mono">
                  {eqGains[idx] > 0 ? `+${eqGains[idx]}` : eqGains[idx]} dB
                </span>

                <div className="h-32 flex items-center justify-center py-1">
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={eqGains[idx]}
                    onChange={(e) => setEqBandGain(idx, parseFloat(e.target.value))}
                    className="vertical-slider"
                  />
                </div>

                <span className="text-xs font-semibold text-gray-700">
                  {freqLabels[idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setEqPreset('Normal')}
            className="text-xs font-semibold text-teal-700 hover:underline"
          >
            Reset ke Normal (0 dB)
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white font-semibold text-sm shadow-md hover:opacity-95 transition"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
