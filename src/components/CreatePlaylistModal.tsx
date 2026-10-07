import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { Playlist } from '../types';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  playlistToEdit?: Playlist | null;
  onClose: () => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  playlistToEdit,
  onClose,
}) => {
  const { createPlaylist, updatePlaylist, setSelectedPlaylistId, setActiveView } = useMusic();
  const [name, setName] = useState(playlistToEdit?.name || '');
  const [desc, setDesc] = useState(playlistToEdit?.description || '');

  React.useEffect(() => {
    if (playlistToEdit) {
      setName(playlistToEdit.name);
      setDesc(playlistToEdit.description || '');
    } else {
      setName('');
      setDesc('');
    }
  }, [playlistToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (playlistToEdit) {
      updatePlaylist(playlistToEdit.id, name.trim(), desc.trim());
    } else {
      const created = createPlaylist(name.trim(), desc.trim());
      setSelectedPlaylistId(created.id);
      setActiveView('playlist');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-teal-500/20 text-[#0F2F2C]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base">
                {playlistToEdit ? 'Ubah Playlist' : 'Buat Playlist Baru'}
              </h3>
              <p className="text-xs text-teal-600">Atur koleksi lagu favoritmu</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Nama Playlist *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Contoh: Santai Sore, Fokus Belajar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700">Deskripsi (Opsional)</label>
            <textarea
              rows={3}
              placeholder="Tambahkan catatan singkat tentang playlist ini..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none font-sans"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white font-semibold shadow-md hover:opacity-95 disabled:opacity-50 transition"
            >
              {playlistToEdit ? 'Simpan' : 'Buat Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
