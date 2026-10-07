import React, { useState, useEffect } from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { MiniPlayer } from './components/MiniPlayer';
import { FullPlayer } from './components/FullPlayer';
import { QueueDrawer } from './components/QueueDrawer';
import { SpotifyPlayerModal } from './components/SpotifyPlayerModal';
import { ToastContainer } from './components/ToastContainer';
import { HomeView } from './views/HomeView';
import { LibraryView } from './views/LibraryView';
import { SearchView } from './views/SearchView';
import { PlaylistsView } from './views/PlaylistsView';
import { SettingsView } from './views/SettingsView';
import { parseAudioFileMetadata } from './utils/metadata';
import { Song } from './types';

const MainLayout: React.FC = () => {
  const { activeView, addUploadedSong, showToast, currentSong } = useMusic();
  const [isDragOver, setIsDragOver] = useState(false);

  // Global Drag & Drop Handler untuk file audio
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      // Hanya matikan jika keluar jendela
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsDragOver(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      let count = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (['mp3', 'm4a', 'wav', 'ogg', 'flac', 'aac'].includes(ext || '')) {
          try {
            const meta = await parseAudioFileMetadata(file, file.name);
            const newSong: Song = {
              id: `drop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
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
            count++;
          } catch (err) {
            console.warn('Gagal memproses file drop:', file.name, err);
          }
        }
      }

      if (count > 0) {
        showToast('File Berhasil Diimpor', `${count} lagu ditambahkan ke pustaka!`, 'success');
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [addUploadedSong, showToast]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F0FDFA] text-[#0F2F2C]">
      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-[#14B8A6]/80 backdrop-blur-md flex flex-col items-center justify-center text-white border-4 border-dashed border-white m-4 rounded-3xl pointer-events-none animate-in fade-in">
          <svg className="w-16 h-16 mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          <h3 className="text-2xl font-black">Lepaskan File Audio di Sini</h3>
          <p className="text-sm opacity-90 mt-1">NARmusic akan otomatis membaca metadata dan menyimpannya di perangkat Anda</p>
        </div>
      )}

      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Center Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header />

        <main
          className={`flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 ${
            currentSong ? 'pb-36 md:pb-28' : 'pb-20 md:pb-8'
          }`}
        >
          {activeView === 'beranda' && <HomeView />}
          {activeView === 'pustaka' && <LibraryView />}
          {activeView === 'cari' && <SearchView />}
          {activeView === 'playlist' && <PlaylistsView />}
          {activeView === 'pengaturan' && <SettingsView />}
        </main>
      </div>

      {/* Playback Controls (Desktop Bottom Bar & Mobile Floating Mini Player) */}
      <MiniPlayer />

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Full-Screen Player Modal */}
      <FullPlayer />

      {/* Queue Drawer */}
      <QueueDrawer />

      {/* Spotify Embed Player Modal */}
      <SpotifyPlayerModal />

      {/* Global Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <MusicProvider>
      <MainLayout />
    </MusicProvider>
  );
}
