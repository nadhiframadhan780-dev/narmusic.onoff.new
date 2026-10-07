import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { parseAudioFileMetadata } from '../utils/metadata';
import { Song } from '../types';
import { saveDirectoryHandle, getDirectoryHandle } from '../utils/idb';

interface FileSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FileSystemModal: React.FC<FileSystemModalProps> = ({ isOpen, onClose }) => {
  const { addUploadedSong, showToast } = useMusic();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);

  if (!isOpen) return null;

  const hasFileSystemAccessAPI = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  const scanDirectoryRecursively = async (dirHandle: FileSystemDirectoryHandle, results: File[]) => {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (['mp3', 'm4a', 'wav', 'ogg', 'flac', 'aac'].includes(ext || '')) {
          results.push(file);
        }
      } else if (entry.kind === 'directory') {
        await scanDirectoryRecursively(entry as FileSystemDirectoryHandle, results);
      }
    }
  };

  const handlePickDirectory = async () => {
    try {
      // @ts-expect-error window.showDirectoryPicker
      const dirHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
        id: 'narmusic-music-folder',
        mode: 'read',
      });

      await saveDirectoryHandle('user_music_folder', dirHandle);

      setIsScanning(true);
      const audioFiles: File[] = [];
      await scanDirectoryRecursively(dirHandle, audioFiles);

      if (audioFiles.length === 0) {
        showToast('Tidak ada file audio ditemukan di folder tersebut', '', 'warning');
        setIsScanning(false);
        onClose();
        return;
      }

      showToast('Memindai Lagu', `Ditemukan ${audioFiles.length} file audio. Membaca metadata...`, 'info');

      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i];
        setScanProgress({ current: i + 1, total: audioFiles.length, fileName: file.name });

        try {
          const meta = await parseAudioFileMetadata(file, file.name);
          const newSong: Song = {
            id: `folder_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title: meta.title,
            artist: meta.artist,
            album: meta.album,
            duration: meta.duration,
            sourceType: 'folder',
            folderRelativePath: file.name,
            lyrics: meta.lyrics,
            dateAdded: Date.now(),
            playCount: 0,
            isFavorite: false,
            sizeBytes: file.size,
            mimeType: file.type || 'audio/mpeg',
          };

          await addUploadedSong(newSong, file, meta.pictureBlob);
        } catch (err) {
          console.warn('Gagal memproses file:', file.name, err);
        }
      }

      showToast('Sinkronisasi Selesai', `${audioFiles.length} lagu berhasil ditambahkan dari folder!`, 'success');
      setIsScanning(false);
      setScanProgress(null);
      onClose();
    } catch (err: unknown) {
      setIsScanning(false);
      setScanProgress(null);
      if ((err as Error)?.name !== 'AbortError') {
        showToast('Gagal mengakses folder', (err as Error)?.message, 'error');
      }
    }
  };

  // Fallback untuk browser tanpa File System Access API
  const handleFallbackFolderInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsScanning(true);
    const audioFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['mp3', 'm4a', 'wav', 'ogg', 'flac', 'aac'].includes(ext || '')) {
        audioFiles.push(file);
      }
    }

    if (audioFiles.length === 0) {
      showToast('Tidak ada file audio yang didukung ditemukan', '', 'warning');
      setIsScanning(false);
      return;
    }

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      setScanProgress({ current: i + 1, total: audioFiles.length, fileName: file.name });
      try {
        const meta = await parseAudioFileMetadata(file, file.name);
        const newSong: Song = {
          id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: meta.title,
          artist: meta.artist,
          album: meta.album,
          duration: meta.duration,
          sourceType: 'folder',
          lyrics: meta.lyrics,
          dateAdded: Date.now(),
          playCount: 0,
          isFavorite: false,
          sizeBytes: file.size,
          mimeType: file.type || 'audio/mpeg',
        };
        await addUploadedSong(newSong, file, meta.pictureBlob);
      } catch (err) {
        console.warn('Gagal memproses file:', file.name, err);
      }
    }

    showToast('Impor Selesai', `${audioFiles.length} lagu berhasil dimasukkan!`, 'success');
    setIsScanning(false);
    setScanProgress(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-teal-500/20 text-[#0F2F2C]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base">Pindai Folder Musik</h3>
              <p className="text-xs text-teal-600">File System Access API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isScanning}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Explicit Privacy & Permission Explanation */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 mb-4 leading-relaxed">
          <p className="font-semibold mb-1">🔒 Privasi Terjamin & Izin Eksplisit:</p>
          <p>
            NARmusic memerlukan izin untuk membaca folder musik di perangkat Anda. 
            File musik <strong>TIDAK AKAN diunggah ke internet atau server mana pun</strong>. 
            Semua data dan lagu tersimpan secara lokal di browser Anda.
          </p>
        </div>

        {/* Progress if scanning */}
        {isScanning && scanProgress && (
          <div className="my-4 p-4 rounded-2xl bg-teal-50 border border-teal-500/30">
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span>Memproses ({scanProgress.current}/{scanProgress.total})</span>
              <span>{Math.round((scanProgress.current / scanProgress.total) * 100)}%</span>
            </div>
            <div className="w-full bg-teal-200 h-2 rounded-full overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] h-full transition-all duration-200"
                style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-[11px] truncate text-gray-500">
              {scanProgress.fileName}
            </p>
          </div>
        )}

        {/* Actions */}
        {!isScanning && (
          <div className="space-y-3">
            {hasFileSystemAccessAPI ? (
              <div>
                <button
                  onClick={handlePickDirectory}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white font-semibold text-sm shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Pilih Folder Musik & Berikan Izin
                </button>
                <p className="text-[11px] text-center text-gray-500 mt-1.5">
                  Mendukung Chrome, Edge, Brave (Desktop & Android)
                </p>
              </div>
            ) : (
              <div>
                <label className="w-full py-3 px-4 rounded-xl bg-teal-600 text-white font-semibold text-sm shadow-md hover:bg-teal-700 transition flex items-center justify-center gap-2 cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Pilih Direktori Folder (Fallback)
                  <input
                    type="file"
                    // @ts-expect-error webkitdirectory
                    webkitdirectory="true"
                    directory="true"
                    multiple
                    onChange={handleFallbackFolderInput}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-center text-amber-600 mt-1.5">
                  Browser Anda (mis. Safari/Firefox) menggunakan pemilih direktori standar.
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-gray-300 text-xs font-semibold hover:bg-gray-100 transition"
            >
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
