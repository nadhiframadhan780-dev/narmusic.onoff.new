import React, { useEffect, useRef, useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { SongCover } from './SongCover';
import { formatTime } from '../utils/metadata';
import { audioEngine } from '../utils/audioEngine';
import { EqualizerModal } from './EqualizerModal';
import { LyricsModal } from './LyricsModal';
import { SleepTimerModal } from './SleepTimerModal';

export const FullPlayer: React.FC = () => {
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
    isFullPlayerOpen,
    setIsFullPlayerOpen,
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
    setIsQueueOpen,
    sleepTimerRemaining,
    settings,
  } = useMusic();

  const [isEqOpen, setIsEqOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isSleepOpen, setIsSleepOpen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Audio Visualizer Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isFullPlayerOpen || !canvasRef.current || currentSong?.sourceType === 'spotify') {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = 64;
    const dataArray = new Uint8Array(bufferLength);

    const renderVisualizer = () => {
      animationFrameRef.current = requestAnimationFrame(renderVisualizer);
      audioEngine.getFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const style = settings.visualizerStyle || 'bars';

      if (style === 'wave') {
        ctx.beginPath();
        ctx.lineWidth = 3;
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, '#06B6D4');
        grad.addColorStop(0.5, '#14B8A6');
        grad.addColorStop(1, '#6EE7B7');
        ctx.strokeStyle = grad;

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 255.0;
          const y = height / 2 + (v - 0.5) * height * 0.8;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
      } else {
        // Bars
        const barWidth = (width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255.0) * height * 0.95;

          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, 'rgba(20, 184, 166, 0.4)');
          gradient.addColorStop(0.6, '#06B6D4');
          gradient.addColorStop(1, '#6EE7B7');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, Math.max(2, barWidth - 2), barHeight, 3);
          ctx.fill();

          x += barWidth;
        }
      }
    };

    renderVisualizer();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isFullPlayerOpen, isPlaying, currentSong?.sourceType, settings.visualizerStyle]);

  if (!isFullPlayerOpen || !currentSong) return null;

  const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#E0F2FE] via-[#F0FDFA] to-[#FFFFFF] text-[#0F2F2C] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 sm:p-6 max-w-4xl w-full mx-auto">
          <button
            onClick={() => setIsFullPlayerOpen(false)}
            className="p-2.5 rounded-2xl bg-white/90 hover:bg-white text-teal-900 shadow-sm border border-teal-100 transition active:scale-95"
            title="Tutup Pemutar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className="text-center">
            <span className="text-[10px] tracking-widest uppercase font-bold text-teal-600">
              NARmusic Pemutar Penuh
            </span>
            <p className="text-xs text-teal-900 font-medium truncate max-w-xs">{currentSong.album || 'Lagu Lokal'}</p>
          </div>

          <button
            onClick={() => setIsQueueOpen(true)}
            className="p-2.5 rounded-2xl bg-white/90 hover:bg-white text-teal-900 shadow-sm border border-teal-100 transition active:scale-95"
            title="Buka Antrean"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        </div>

        {/* Center Main Stage */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md w-full mx-auto">
          {/* Large Artwork */}
          <div className="relative mb-6">
            <div className={`absolute -inset-4 rounded-3xl bg-teal-400/20 blur-2xl transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-40'}`} />
            <SongCover
              song={currentSong}
              size="xl"
              className={`relative shadow-2xl transition-transform duration-500 ${isPlaying ? 'scale-100' : 'scale-95'}`}
            />
          </div>

          {/* Audio Visualizer Canvas */}
          <div className="w-full h-14 mb-4 flex items-center justify-center overflow-hidden">
            {currentSong.sourceType !== 'spotify' ? (
              <canvas ref={canvasRef} width={380} height={56} className="w-full h-full opacity-90" />
            ) : (
              <div className="flex items-center gap-2 text-xs text-teal-800 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200">
                <span className="w-2 h-2 rounded-full bg-[#1DB954]" />
                Audio Spotify (Visualizer Web Audio API khusus file upload lokal)
              </div>
            )}
          </div>

          {/* Title & Artist & Favorite */}
          <div className="w-full flex items-center justify-between mb-4 px-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold truncate leading-tight text-[#0F2F2C]">
                {currentSong.title}
              </h2>
              <p className="text-sm text-teal-700 font-semibold truncate mt-0.5">
                {currentSong.artist}
              </p>
            </div>
            <button
              onClick={() => toggleFavorite(currentSong.id)}
              className="p-2.5 rounded-2xl bg-white/80 hover:bg-white shadow-sm border border-teal-100 transition ml-3"
              title="Favorit"
            >
              <svg
                className={`w-6 h-6 transition-transform active:scale-125 ${
                  currentSong.isFavorite ? 'text-rose-500 fill-rose-500' : 'text-gray-400'
                }`}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>

          {/* Seek Bar */}
          <div className="w-full mb-4 px-2">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.5"
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs font-mono text-teal-800 font-semibold mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls (Shuffle, Prev, Play, Next, Repeat) */}
          <div className="flex items-center justify-between w-full max-w-xs mb-6">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-xl transition ${isShuffle ? 'text-teal-600 scale-110 font-bold' : 'text-gray-400 hover:text-teal-600'}`}
              title="Acak Lagu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H4a2 2 0 01-2-2V6a2 2 0 012-2h4m8 12h4a2 2 0 002-2V6a2 2 0 00-2-2h-4m-4 8l4-4m0 0l-4-4m4 4H10" />
              </svg>
            </button>

            <button
              onClick={playPrevious}
              className="p-3 rounded-2xl bg-white hover:bg-teal-50 text-teal-800 shadow-sm border border-teal-100 transition active:scale-95"
              title="Lagu Sebelumnya"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white flex items-center justify-center shadow-lg shadow-teal-500/30 hover:scale-105 active:scale-95 transition"
              title={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={playNext}
              className="p-3 rounded-2xl bg-white hover:bg-teal-50 text-teal-800 shadow-sm border border-teal-100 transition active:scale-95"
              title="Lagu Berikutnya"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            <button
              onClick={cycleRepeat}
              className={`p-2 rounded-xl transition ${
                repeatMode !== 'off' ? 'text-teal-600 scale-110 font-bold' : 'text-gray-400 hover:text-teal-600'
              }`}
              title="Ulang Lagu"
            >
              <div className="relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {repeatMode === 'one' && (
                  <span className="absolute -top-1 -right-1 text-[9px] font-black bg-teal-500 text-white px-1 rounded-full">
                    1
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Volume Control Row */}
          <div className="flex items-center gap-3 w-full max-w-xs mb-6 px-3.5 bg-white/90 py-2.5 rounded-2xl shadow-sm border border-teal-100">
            <button onClick={toggleMute} className="text-teal-700 hover:text-teal-900">
              {isMuted || volume === 0 ? (
                <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="flex-1"
            />
            <span className="text-[11px] font-mono text-teal-800 font-bold w-8 text-right">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>

          {/* Quick Sub-feature Buttons: Equalizer, Lirik, Sleep Timer, Speed */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setIsEqOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-xs font-semibold text-teal-800 border border-teal-200/80 shadow-sm flex items-center gap-1.5 transition"
            >
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Equalizer
            </button>

            <button
              onClick={() => setIsLyricsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-xs font-semibold text-teal-800 border border-teal-200/80 shadow-sm flex items-center gap-1.5 transition"
            >
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Lirik
            </button>

            <button
              onClick={() => setIsSleepOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition ${
                sleepTimerRemaining !== null
                  ? 'bg-teal-600 text-white font-bold'
                  : 'bg-white hover:bg-teal-50 text-teal-800 border border-teal-200/80'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {sleepTimerRemaining !== null ? formatTime(sleepTimerRemaining) : 'Timer'}
            </button>

            {/* Playback speed toggle */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-xs font-semibold text-teal-800 border border-teal-200/80 shadow-sm flex items-center gap-1 transition"
              >
                <span>{playbackRate}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-teal-200 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 min-w-[70px]">
                  {speeds.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setRate(s);
                        setShowSpeedMenu(false);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-lg text-center font-mono transition ${
                        playbackRate === s
                          ? 'bg-teal-600 text-white font-bold'
                          : 'hover:bg-teal-50 text-teal-900'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Child Modals */}
      <EqualizerModal isOpen={isEqOpen} onClose={() => setIsEqOpen(false)} />
      <LyricsModal isOpen={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />
      <SleepTimerModal isOpen={isSleepOpen} onClose={() => setIsSleepOpen(false)} />
    </>
  );
};
