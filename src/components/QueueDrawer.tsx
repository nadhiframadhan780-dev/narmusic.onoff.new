import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { SongCover } from './SongCover';
import { formatTime } from '../utils/metadata';

export const QueueDrawer: React.FC = () => {
  const {
    queue,
    queueIndex,
    currentSong,
    isQueueOpen,
    setIsQueueOpen,
    playSong,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    isPlaying,
  } = useMusic();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!isQueueOpen) return null;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      reorderQueue(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target >= 0 && target < queue.length) {
      reorderQueue(index, target);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md h-full bg-white shadow-2xl border-l border-teal-500/20 text-[#0F2F2C] flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-teal-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#06B6D4] to-[#14B8A6] flex items-center justify-center text-white shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base">Antrean Putar</h3>
              <p className="text-xs text-teal-600">
                {queue.length} Lagu dalam antrean
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {queue.length > 1 && (
              <button
                onClick={clearQueue}
                className="text-xs text-rose-600 font-semibold hover:underline px-2 py-1"
              >
                Bersihkan
              </button>
            )}
            <button
              onClick={() => setIsQueueOpen(false)}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Current Song Section */}
        {currentSong && (
          <div className="p-4 bg-teal-50/70 border-b border-teal-500/15">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 block mb-2">
              Sedang Diputar
            </span>
            <div className="flex items-center gap-3">
              <SongCover song={currentSong} size="sm" className="!w-12 !h-12" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate flex items-center gap-1.5 text-teal-900">
                  <span className="truncate">{currentSong.title}</span>
                  {isPlaying && (
                    <span className="flex items-end gap-0.5 h-3 flex-shrink-0">
                      <span className="w-0.5 bg-teal-500 animate-wave-1 rounded-full" />
                      <span className="w-0.5 bg-teal-500 animate-wave-2 rounded-full" />
                      <span className="w-0.5 bg-teal-500 animate-wave-3 rounded-full" />
                    </span>
                  )}
                </h4>
                <p className="text-xs text-gray-600 truncate">
                  {currentSong.artist}
                </p>
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {formatTime(currentSong.duration)}
              </span>
            </div>
          </div>
        )}

        {/* Queue List with Reorder / Drag and Drop */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="px-2 py-1 text-xs font-semibold text-gray-500 flex items-center justify-between">
            <span>Berikutnya dalam Antrean</span>
            <span className="text-[10px] font-normal italic">Bisa di-drag atau geser urutan</span>
          </div>

          {queue.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">Antrean kosong</p>
              <p className="text-xs mt-1">Pilih lagu dari pustaka untuk mulai mendengarkan</p>
            </div>
          ) : (
            queue.map((song, idx) => {
              const isCurrent = idx === queueIndex;
              return (
                <div
                  key={`${song.id}-${idx}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={`group flex items-center gap-2.5 p-2 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-teal-500/15 border-teal-500/40'
                      : 'bg-white border-gray-100 hover:bg-teal-50/60'
                  } ${draggedIndex === idx ? 'opacity-50 scale-95' : 'opacity-100'}`}
                >
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-teal-600 p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
                    </svg>
                  </div>

                  {/* Thumbnail & Title */}
                  <div
                    onClick={() => playSong(song)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                  >
                    <SongCover song={song} size="sm" className="!w-10 !h-10" />
                    <div className="flex-1 min-w-0">
                      <h5 className={`text-xs font-semibold truncate ${isCurrent ? 'text-teal-800' : 'text-[#0F2F2C]'}`}>
                        {song.title}
                      </h5>
                      <p className="text-[11px] text-gray-500 truncate">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition">
                    <button
                      onClick={() => moveItem(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:text-teal-600 disabled:opacity-20"
                      title="Pindahkan ke atas"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveItem(idx, 'down')}
                      disabled={idx === queue.length - 1}
                      className="p-1 text-gray-400 hover:text-teal-600 disabled:opacity-20"
                      title="Pindahkan ke bawah"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeFromQueue(idx)}
                      className="p-1 text-gray-400 hover:text-rose-500 transition ml-1"
                      title="Hapus dari antrean"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
