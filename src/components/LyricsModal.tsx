import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({ isOpen, onClose }) => {
  const { currentSong, updateSongLyrics } = useMusic();
  const [isEditing, setIsEditing] = useState(false);
  const [lyricsText, setLyricsText] = useState(currentSong?.lyrics || '');

  if (!isOpen || !currentSong) return null;

  const handleSave = () => {
    updateSongLyrics(currentSong.id, lyricsText);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-teal-500/20 text-[#0F2F2C] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-teal-500/20">
          <div>
            <h3 className="font-bold text-lg leading-tight">Lirik Lagu</h3>
            <p className="text-xs text-teal-600 truncate max-w-xs">
              {currentSong.title} — {currentSong.artist}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => {
                  setLyricsText(currentSong.lyrics || '');
                  setIsEditing(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-semibold hover:bg-teal-100 transition"
              >
                Edit Lirik
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition"
              >
                Simpan
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto my-4 py-2">
          {isEditing ? (
            <textarea
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              placeholder="Ketik atau tempel lirik lagu di sini..."
              rows={14}
              className="w-full p-4 rounded-2xl border border-teal-500/30 bg-teal-50/50 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans resize-none text-[#0F2F2C]"
            />
          ) : currentSong.lyrics ? (
            <div className="whitespace-pre-wrap text-center font-medium text-base sm:text-lg leading-loose tracking-wide text-[#0F2F2C] px-4 py-2">
              {currentSong.lyrics}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
              <svg className="w-12 h-12 mb-3 opacity-60 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-semibold text-sm">Belum ada lirik untuk lagu ini</p>
              <p className="text-xs mt-1">Anda bisa menambahkan lirik secara manual</p>
              <button
                onClick={() => {
                  setLyricsText('');
                  setIsEditing(true);
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition"
              >
                + Tambah Lirik Sekarang
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-teal-500/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-teal-50 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
