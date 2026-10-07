import React from 'react';
import { useMusic } from '../context/MusicContext';

export const SpotifyPlayerModal: React.FC = () => {
  const {
    currentSong,
    isSpotifyModalOpen,
    setIsSpotifyModalOpen,
    playNext,
    playPrevious,
  } = useMusic();

  if (!isSpotifyModalOpen || !currentSong || currentSong.sourceType !== 'spotify') {
    return null;
  }

  const embedUrl = `https://open.spotify.com/embed/${currentSong.spotifyType || 'track'}/${currentSong.spotifyId}?utm_source=generator&theme=0`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl border border-teal-500/30 text-[#0F2F2C]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1DB954] animate-pulse" />
            <h3 className="font-bold text-base flex items-center gap-2">
              <span>Spotify Player</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1DB954]/20 text-[#1DB954] font-semibold">
                Online Embed
              </span>
            </h3>
          </div>
          <button
            onClick={() => setIsSpotifyModalOpen(false)}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Embedded Spotify Player iFrame */}
        <div className="rounded-2xl overflow-hidden shadow-lg bg-black/40 min-h-[152px]">
          <iframe
            src={embedUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title={`Spotify: ${currentSong.title}`}
            className="w-full"
          />
        </div>

        {/* Quick Nav */}
        <div className="flex items-center justify-between mt-3 px-1">
          <button
            onClick={() => playPrevious()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-500/20 text-xs font-semibold hover:bg-teal-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Sebelumnya
          </button>
          <button
            onClick={() => playNext()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-500/20 text-xs font-semibold hover:bg-teal-50 transition"
          >
            Selanjutnya
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Disclaimer / Notice */}
        <div className="mt-4 p-3 rounded-2xl bg-teal-50/60 border border-teal-200/40 text-[11px] leading-relaxed text-teal-950">
          <p className="font-semibold text-teal-700 mb-1">
            ⚠️ Batasan Resmi Pemutaran Spotify:
          </p>
          <p>
            Pemutaran penuh memerlukan login akun Spotify di browser. Tanpa login, Spotify hanya memutar cuplikan 30 detik.
            Lagu Spotify tidak dapat diunduh untuk offline dan tidak terhubung ke Equalizer / Visualizer NARmusic karena proteksi DRM browser.
          </p>
        </div>

        <button
          onClick={() => setIsSpotifyModalOpen(false)}
          className="w-full mt-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition"
        >
          Tutup Pemutar
        </button>
      </div>
    </div>
  );
};
