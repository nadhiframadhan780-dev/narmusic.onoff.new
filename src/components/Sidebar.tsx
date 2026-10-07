import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { PWAInstallButton } from './PWAInstallButton';
import { CreatePlaylistModal } from './CreatePlaylistModal';
import { FileSystemModal } from './FileSystemModal';
import { SpotifyPasteModal } from './SpotifyPasteModal';

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    playlists,
    selectedPlaylistId,
    setSelectedPlaylistId,
    storageStats,
  } = useMusic();

  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);

  const navItems = [
    {
      id: 'beranda',
      label: 'Beranda',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'pustaka',
      label: 'Pustaka Musik',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: 'cari',
      label: 'Cari Lagu',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      id: 'playlist',
      label: 'Playlist',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 h-screen bg-white/95 backdrop-blur-xl border-r border-teal-500/20 p-4 pb-28 text-[#0F2F2C] select-none flex-shrink-0">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <img
            src="/logo.png"
            alt="NARmusic Logo"
            className="w-11 h-11 rounded-2xl object-cover shadow-md shadow-teal-500/25 border border-teal-200"
          />
          <div>
            <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] bg-clip-text text-transparent">
              NARmusic
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-600">
              PWA Player v1.0
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 mb-5">
          {navItems.map((item) => {
            const isActive = activeView === item.id && (item.id !== 'playlist' || !selectedPlaylistId);
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id as typeof activeView);
                  if (item.id === 'playlist') setSelectedPlaylistId(null);
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white shadow-md shadow-teal-500/25 scale-[1.02]'
                    : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Actions (Pindai Folder, Tempel Spotify) */}
        <div className="space-y-1.5 mb-5 px-1">
          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-800 border border-amber-500/20 hover:bg-amber-500/20 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span>Buka Folder Musik</span>
          </button>

          <button
            onClick={() => setIsSpotifyModalOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/25 hover:bg-[#1DB954]/20 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <span>Tempel Spotify</span>
          </button>
        </div>

        {/* Playlist Section in Sidebar */}
        <div className="flex-1 overflow-y-auto px-1 pr-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Playlist Saya
            </span>
            <button
              onClick={() => setIsCreatePlaylistOpen(true)}
              className="p-1 text-teal-600 hover:bg-teal-50 rounded-lg"
              title="Buat Playlist"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="space-y-1">
            {playlists.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Belum ada playlist</p>
            ) : (
              playlists.map((pl) => {
                const isSelected = activeView === 'playlist' && selectedPlaylistId === pl.id;
                return (
                  <button
                    key={pl.id}
                    onClick={() => {
                      setSelectedPlaylistId(pl.id);
                      setActiveView('playlist');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium truncate transition ${
                      isSelected
                        ? 'bg-teal-500/20 text-teal-800 font-bold'
                        : 'text-gray-600 hover:bg-teal-50/60'
                    }`}
                  >
                    🎵 {pl.name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Storage Mini Meter & PWA Install */}
        <div className="pt-3 border-t border-teal-500/15 space-y-2">
          <div className="p-2.5 rounded-2xl bg-teal-50 border border-teal-200/60 text-[11px]">
            <div className="flex justify-between font-semibold mb-1 text-teal-800">
              <span>Penyimpanan Lokal</span>
              <span>{storageStats.usedFormatted}</span>
            </div>
            <div className="w-full bg-teal-200/60 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  storageStats.percentUsed > 90
                    ? 'bg-rose-500'
                    : storageStats.percentUsed > 75
                    ? 'bg-amber-500'
                    : 'bg-[#14B8A6]'
                }`}
                style={{ width: `${Math.max(4, storageStats.percentUsed)}%` }}
              />
            </div>
          </div>

          <PWAInstallButton />
        </div>
      </aside>

      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
      />
      <FileSystemModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
      />
      <SpotifyPasteModal
        isOpen={isSpotifyModalOpen}
        onClose={() => setIsSpotifyModalOpen(false)}
      />
    </>
  );
};
