import React, { useRef, useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { usePWA } from '../hooks/usePWA';
import { PWAInstallButton } from './PWAInstallButton';
import { SpotifyPasteModal } from './SpotifyPasteModal';
import { parseAudioFileMetadata } from '../utils/metadata';
import { Song } from '../types';

export const Header: React.FC = () => {
  const { addUploadedSong, showToast } = useMusic();
  const { isOnline } = usePWA();
  const [isSpotifyOpen, setIsSpotifyOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const meta = await parseAudioFileMetadata(file, file.name);
        const newSong: Song = {
          id: `upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: meta.title,
          artist: meta.artist,
          album: meta.album,
          duration: meta.duration,
          sourceType: 'local',
          lyrics: meta.lyrics,
          dateAdded: Date.now(),
          playCount: 0,
          isFavorite: false,
          sizeBytes: file.size,
          mimeType: file.type || 'audio/mpeg',
        };

        await addUploadedSong(newSong, file, meta.pictureBlob);
        successCount++;
      } catch (err: unknown) {
        console.warn('Gagal upload file:', file.name, err);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (successCount > 0) {
      showToast('Upload Berhasil', `${successCount} lagu telah ditambahkan ke pustaka!`, 'success');
    } else {
      showToast('Upload Gagal', 'Pastikan format file audio didukung', 'error');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-teal-500/15 px-4 sm:px-6 py-3 flex items-center justify-between text-[#0F2F2C]">
        {/* Mobile Brand Mark */}
        <div className="flex md:hidden items-center gap-2.5">
          <img
            src="/logo.png"
            alt="NARmusic"
            className="w-9 h-9 rounded-xl object-cover shadow-sm border border-teal-200"
          />
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] bg-clip-text text-transparent">
            NARmusic
          </span>
        </div>

        {/* Offline / Online Pill */}
        <div className="hidden sm:flex items-center gap-2">
          {!isOnline ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Offline Mode (Lagu Lokal Aktif)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Online</span>
            </div>
          )}
        </div>

        {/* Action Buttons: Upload Audio, Spotify, Install */}
        <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
          {/* File Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/mp3,audio/wav,audio/ogg,audio/flac,audio/aac,audio/m4a,.mp3,.wav,.ogg,.flac,.aac,.m4a"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white text-xs font-semibold shadow-md shadow-teal-500/20 hover:opacity-95 active:scale-95 transition"
            title="Upload file musik dari perangkat Anda"
          >
            {isUploading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            )}
            <span>{isUploading ? 'Mengunggah...' : 'Upload'}</span>
          </button>

          {/* Spotify Paste Quick Button */}
          <button
            onClick={() => setIsSpotifyOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/30 text-xs font-semibold hover:bg-[#1DB954]/20 transition"
            title="Tempel Link Spotify"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <span className="hidden sm:inline">Spotify</span>
          </button>

          {/* PWA Install Button Header */}
          <div className="hidden sm:block">
            <PWAInstallButton compact />
          </div>
        </div>
      </header>

      <SpotifyPasteModal isOpen={isSpotifyOpen} onClose={() => setIsSpotifyOpen(false)} />
    </>
  );
};
