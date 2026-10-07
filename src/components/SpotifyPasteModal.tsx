import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { fetchSpotifyMetadata, parseSpotifyLink, SpotifyParseResult } from '../utils/spotify';
import { usePWA } from '../hooks/usePWA';

interface SpotifyPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpotifyPasteModal: React.FC<SpotifyPasteModalProps> = ({ isOpen, onClose }) => {
  const { addSpotifySong, showToast } = useMusic();
  const { isOnline } = usePWA();

  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<SpotifyParseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetch = async () => {
    setErrorMsg(null);
    setPreviewResult(null);

    const parsed = parseSpotifyLink(inputUrl);
    if (!parsed.isValid) {
      setErrorMsg('Format link tidak valid. Masukkan URL seperti: https://open.spotify.com/track/... atau spotify:track:...');
      return;
    }

    if (!isOnline) {
      setErrorMsg('Anda sedang offline. Fitur Spotify oEmbed memerlukan koneksi internet aktif.');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchSpotifyMetadata(inputUrl);
      setPreviewResult(result);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Gagal mengambil metadata Spotify');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!previewResult) return;
    try {
      await addSpotifySong(previewResult);
      setInputUrl('');
      setPreviewResult(null);
      onClose();
    } catch {
      showToast('Gagal menyimpan lagu Spotify', '', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-teal-500/20 text-[#0F2F2C]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1DB954] text-white flex items-center justify-center shadow">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base">Tempel Link Spotify</h3>
              <p className="text-xs text-teal-600">Otomatis deteksi & ambil metadata</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info Box */}
        <div className="mb-4 p-3 rounded-2xl bg-teal-50 border border-teal-200/50 text-xs text-teal-900">
          <p className="font-semibold mb-1">ℹ️ Informasi Transparan Spotify:</p>
          <ul className="list-disc list-inside space-y-0.5 opacity-90">
            <li>Lagu Spotify diputar via Spotify Embed iFrame resmi.</li>
            <li>Membutuhkan login akun Spotify di browser untuk lagu penuh (preview 30 detik tanpa login).</li>
            <li>Tidak dapat disimpan offline atau diatur Equalizer (kebijakan DRM Spotify).</li>
          </ul>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-600">
              Link Track / Album / Playlist Spotify
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://open.spotify.com/track/..."
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  setErrorMsg(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={handleFetch}
                disabled={loading || !inputUrl.trim()}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-1.5 transition"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Periksa'
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Preview Card */}
          {previewResult && (
            <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-500/30 flex items-center gap-3 animate-in fade-in">
              {previewResult.thumbnailUrl ? (
                <img
                  src={previewResult.thumbnailUrl}
                  alt={previewResult.title}
                  className="w-14 h-14 rounded-xl object-cover shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-[#1DB954] text-white flex items-center justify-center font-bold">
                  SPOT
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-[#1DB954] text-white mb-1">
                  {previewResult.type}
                </span>
                <h4 className="font-bold text-sm truncate">{previewResult.title}</h4>
                <p className="text-xs text-gray-600 truncate">{previewResult.artist}</p>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-100 transition"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!previewResult}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white font-semibold text-sm shadow-md hover:opacity-95 disabled:opacity-40 transition"
          >
            Simpan ke Pustaka
          </button>
        </div>
      </div>
    </div>
  );
};
