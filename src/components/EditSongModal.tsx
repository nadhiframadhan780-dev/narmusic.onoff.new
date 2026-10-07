import React, { useState } from 'react';
import { Song } from '../types';
import { useMusic } from '../context/MusicContext';
import { resizeAndCompressImage } from '../utils/metadata';
import { SongCover } from './SongCover';

interface EditSongModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditSongModal: React.FC<EditSongModalProps> = ({ song, isOpen, onClose }) => {
  const { updateSongMetadata, deleteSong, showToast } = useMusic();

  const [title, setTitle] = useState(song?.title || '');
  const [artist, setArtist] = useState(song?.artist || '');
  const [album, setAlbum] = useState(song?.album || '');
  const [lyrics, setLyrics] = useState(song?.lyrics || '');
  const [newCoverBlob, setNewCoverBlob] = useState<Blob | null>(null);
  const [previewCoverUrl, setPreviewCoverUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when song changes
  React.useEffect(() => {
    if (song) {
      setTitle(song.title);
      setArtist(song.artist);
      setAlbum(song.album);
      setLyrics(song.lyrics || '');
      setNewCoverBlob(null);
      setPreviewCoverUrl(null);
      setShowDeleteConfirm(false);
    }
  }, [song]);

  if (!isOpen || !song) return null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Mengompresi Gambar', 'Mengubah ukuran ke maksimal 400x400px...', 'info');
      const compressed = await resizeAndCompressImage(file);
      setNewCoverBlob(compressed);
      setPreviewCoverUrl(URL.createObjectURL(compressed));
    } catch {
      showToast('Gagal memproses gambar cover', '', 'error');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Judul lagu tidak boleh kosong', '', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      await updateSongMetadata(
        song.id,
        {
          title: title.trim(),
          artist: artist.trim() || 'Artis Tidak Diketahui',
          album: album.trim() || 'Lokal',
          lyrics: lyrics.trim(),
        },
        newCoverBlob || undefined
      );
      onClose();
    } catch {
      showToast('Gagal memperbarui metadata lagu', '', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteSong(song.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-teal-500/20 text-[#0F2F2C] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-teal-500/20">
          <div>
            <h3 className="font-bold text-lg">Edit Info Lagu</h3>
            <p className="text-xs text-teal-600">Ubah judul, artis, cover & lirik</p>
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

        {/* Cover Preview & Custom Image Upload */}
        <div className="flex items-center gap-4 mb-5 p-3.5 rounded-2xl bg-teal-50/70">
          <div className="relative group w-20 h-20 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
            {previewCoverUrl ? (
              <img src={previewCoverUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <SongCover song={song} size="lg" className="!w-20 !h-20" />
            )}
            <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-[10px] font-semibold text-center p-1">
              <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              Ganti Cover
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-teal-800">Thumbnail Cover Album</h4>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Gambar otomatis di-resize ke 400x400 JPEG terkompresi agar hemat memori IndexedDB.
            </p>
            <label className="inline-block mt-2 px-3 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer transition">
              Upload Gambar Baru
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3.5 mb-5 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Judul Lagu *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700">Artis / Penyanyi</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700">Nama Album</label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700">Lirik Lagu (Opsional)</label>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              rows={4}
              placeholder="Tambahkan teks lirik lagu di sini..."
              className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none font-sans"
            />
          </div>
        </div>

        {/* Delete Confirmation Box */}
        {showDeleteConfirm && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-xs">
            <p className="font-bold text-rose-800 mb-1">
              Konfirmasi: Hapus lagu ini dari NARmusic?
            </p>
            <p className="text-gray-600 mb-2">
              File biner di IndexedDB dan data playlist akan dihapus secara permanen.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-xl border border-gray-300 font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition"
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Hapus Lagu
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold hover:bg-gray-100 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white text-xs font-semibold shadow-md hover:opacity-95 disabled:opacity-50 transition"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
