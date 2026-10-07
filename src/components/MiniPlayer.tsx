import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { SongCover } from './SongCover';
import { formatTime } from '../utils/metadata';
import { EqualizerModal } from './EqualizerModal';
import { LyricsModal } from './LyricsModal';
import { SleepTimerModal } from './SleepTimerModal';

export const MiniPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isShuffle,
    repeatMode,
    setIsFullPlayerOpen,
    setIsQueueOpen,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    changeVolume,
    toggleMute,
    setRate,
    toggleShuffle,
    cycleRepeat,
    toggleFavorite,
    sleepTimerRemaining,
  } = useMusic();

  const [isEqOpen, setIsEqOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isSleepOpen, setIsSleepOpen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <>
      {/* MOBILE FLOATING MINI-PLAYER (Above Bottom Nav) */}
      <div className="md:hidden fixed bottom-16 left-3 right-3 z-40 animate-in slide-in-from-bottom duration-200">
        <div
          onClick={() => setIsFullPlayerOpen(true)}
          className="relative bg-white/95 backdrop-blur-xl rounded-2xl p-2.5 shadow-2xl border border-teal-500/25 flex items-center justify-between cursor-pointer overflow-hidden text-[#0F2F2C]"
        >
          {/* Top miniature progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-teal-100">
            <div
              className="h-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
            <SongCover song={currentSong} size="sm" className="!w-11 !h-11 shadow-sm" />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs truncate leading-snug flex items-center gap-1.5">
                <span className="truncate">{currentSong.title}</span>
                {isPlaying && currentSong.sourceType !== 'spotify' && (
                  <span className="flex items-end gap-0.5 h-3 flex-shrink-0">
                    <span className="w-0.5 bg-teal-500 animate-wave-1 rounded-full" />
                    <span className="w-0.5 bg-teal-500 animate-wave-2 rounded-full" />
                    <span className="w-0.5 bg-teal-500 animate-wave-3 rounded-full" />
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-gray-500 truncate">
                {currentSong.artist}
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-1 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={playPrevious}
              className="p-2 text-gray-600 hover:text-teal-600 active:scale-95"
              title="Lagu Sebelumnya"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white flex items-center justify-center shadow-md shadow-teal-500/25 active:scale-95"
              title={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={playNext}
              className="p-2 text-gray-600 hover:text-teal-600 active:scale-95"
              title="Lagu Berikutnya"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP BOTTOM PLAYBACK BAR */}
      <footer className="hidden md:flex fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-teal-500/20 px-6 py-3 items-center justify-between shadow-2xl text-[#0F2F2C]">
        {/* Left Track Info */}
        <div className="flex items-center gap-3.5 w-1/4 min-w-[200px]">
          <div
            onClick={() => setIsFullPlayerOpen(true)}
            className="cursor-pointer group relative flex-shrink-0"
          >
            <SongCover song={currentSong} size="md" className="!w-14 !h-14 shadow" />
            <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h4
              onClick={() => setIsFullPlayerOpen(true)}
              className="font-bold text-sm truncate hover:text-teal-600 cursor-pointer flex items-center gap-2"
            >
              <span className="truncate">{currentSong.title}</span>
              {isPlaying && currentSong.sourceType !== 'spotify' && (
                <span className="flex items-end gap-0.5 h-3 flex-shrink-0">
                  <span className="w-0.5 bg-teal-500 animate-wave-1 rounded-full" />
                  <span className="w-0.5 bg-teal-500 animate-wave-2 rounded-full" />
                  <span className="w-0.5 bg-teal-500 animate-wave-3 rounded-full" />
                </span>
              )}
            </h4>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {currentSong.artist}
            </p>
          </div>

          <button
            onClick={() => toggleFavorite(currentSong.id)}
            className="p-1.5 text-gray-400 hover:text-rose-500 transition"
            title="Favorit"
          >
            <svg
              className={`w-5 h-5 ${currentSong.isFavorite ? 'text-rose-500 fill-rose-500' : ''}`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Center Playback Controls & Seek Bar */}
        <div className="flex flex-col items-center w-2/4 max-w-xl px-4">
          <div className="flex items-center gap-4 mb-1.5">
            <button
              onClick={toggleShuffle}
              className={`p-1.5 rounded-lg transition ${
                isShuffle ? 'text-teal-600 scale-105' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Acak Lagu (S)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H4a2 2 0 01-2-2V6a2 2 0 012-2h4m8 12h4a2 2 0 002-2V6a2 2 0 00-2-2h-4m-4 8l4-4m0 0l-4-4m4 4H10" />
              </svg>
            </button>

            <button
              onClick={playPrevious}
              className="p-2 text-gray-700 hover:text-teal-600 transition active:scale-95"
              title="Lagu Sebelumnya (P)"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white flex items-center justify-center shadow-md shadow-teal-500/25 hover:scale-105 active:scale-95 transition"
              title={isPlaying ? 'Jeda (Spasi)' : 'Putar (Spasi)'}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={playNext}
              className="p-2 text-gray-700 hover:text-teal-600 transition active:scale-95"
              title="Lagu Berikutnya (N)"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            <button
              onClick={cycleRepeat}
              className={`p-1.5 rounded-lg transition ${
                repeatMode !== 'off' ? 'text-teal-600 scale-105' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Ulang Lagu (R)"
            >
              <div className="relative">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {repeatMode === 'one' && (
                  <span className="absolute -top-1 -right-1 text-[8px] font-black bg-teal-500 text-white px-1 rounded-full">
                    1
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Seek Bar */}
          <div className="w-full flex items-center gap-2.5">
            <span className="text-[11px] font-mono text-gray-500 w-9 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.5"
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-[11px] font-mono text-gray-500 w-9">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right Tools: Volume, EQ, Lyrics, Sleep, Queue, Expand */}
        <div className="flex items-center justify-end gap-2.5 w-1/4 min-w-[220px]">
          {/* Equalizer trigger */}
          <button
            onClick={() => setIsEqOpen(true)}
            className="p-2 rounded-xl text-gray-600 hover:text-teal-600 hover:bg-teal-50 transition"
            title="Equalizer 5-Band"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>

          {/* Lyrics trigger */}
          <button
            onClick={() => setIsLyricsOpen(true)}
            className="p-2 rounded-xl text-gray-600 hover:text-teal-600 hover:bg-teal-50 transition"
            title="Lirik Lagu"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          {/* Sleep timer */}
          <button
            onClick={() => setIsSleepOpen(true)}
            className={`p-2 rounded-xl transition ${
              sleepTimerRemaining !== null
                ? 'text-teal-600 font-bold bg-teal-50'
                : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
            }`}
            title="Sleep Timer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Speed selector */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-2 py-1 rounded-lg text-xs font-mono font-semibold text-gray-700 hover:bg-teal-50"
              title="Kecepatan Putar"
            >
              {playbackRate}x
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-white border border-teal-200 rounded-2xl p-1 shadow-xl flex flex-col gap-0.5 min-w-[65px]">
                {speeds.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setRate(s);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-2 py-1 text-xs rounded-lg text-center font-mono ${
                      playbackRate === s
                        ? 'bg-teal-600 text-white font-bold'
                        : 'hover:bg-teal-50 text-gray-800'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Queue toggle */}
          <button
            onClick={() => setIsQueueOpen(true)}
            className="p-2 rounded-xl text-gray-600 hover:text-teal-600 hover:bg-teal-50 transition"
            title="Antrean Putar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          {/* Volume slider */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="p-1 text-gray-600 hover:text-teal-600"
              title={isMuted ? 'Nyalakan Suara (M)' : 'Bisukan (M)'}
            >
              {isMuted || volume === 0 ? (
                <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              className="w-16"
            />
          </div>

          {/* Expand to Full Player Button */}
          <button
            onClick={() => setIsFullPlayerOpen(true)}
            className="p-2 rounded-xl text-gray-600 hover:text-teal-600 hover:bg-teal-50 transition"
            title="Buka Pemutar Penuh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </footer>

      {/* Child modals when triggered from desktop bottom bar */}
      <EqualizerModal isOpen={isEqOpen} onClose={() => setIsEqOpen(false)} />
      <LyricsModal isOpen={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />
      <SleepTimerModal isOpen={isSleepOpen} onClose={() => setIsSleepOpen(false)} />
    </>
  );
};
