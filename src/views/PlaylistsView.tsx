import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { PlaylistDetailView } from './PlaylistDetailView';
import { CreatePlaylistModal } from '../components/CreatePlaylistModal';
import { SongCover } from '../components/SongCover';

export const PlaylistsView: React.FC = () => {
  const {
    playlists,
    selectedPlaylistId,
    setSelectedPlaylistId,
    songs,
  } = useMusic();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Jika ada playlist yang sedang dibuka, render PlaylistDetailView
  if (selectedPlaylistId) {
    return <PlaylistDetailView />;
  }

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#0F2F2C]">
            Daftar Playlist
          </h2>
          <p className="text-xs text-teal-600 mt-0.5">
            {playlists.length} koleksi playlist pribadi Anda
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white font-semibold text-xs shadow-md shadow-teal-500/20 hover:opacity-95 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Buat Playlist</span>
        </button>
      </div>

      {/* Grid of Playlists */}
      {playlists.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl bg-white border border-teal-500/20 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-3xl">
            🎵
          </div>
          <h3 className="font-bold text-lg mb-1">Belum Ada Playlist</h3>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Buat playlist pertama Anda untuk mengelompokkan lagu santai, olahraga, atau belajar!
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold text-xs shadow hover:bg-teal-700 transition"
          >
            Buat Playlist Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {playlists.map((pl) => {
            const plSongs = pl.songIds
              .map((id) => songs.find((s) => s.id === id))
              .filter(Boolean) as typeof songs;

            const collageSongs = plSongs.slice(0, 4);

            return (
              <div
                key={pl.id}
                onClick={() => setSelectedPlaylistId(pl.id)}
                className="group p-3 rounded-2xl bg-white border border-gray-100 hover:border-teal-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Collage Artwork */}
                  <div className="aspect-square rounded-xl overflow-hidden shadow mb-2.5 grid grid-cols-2 grid-rows-2 bg-gradient-to-tr from-[#14B8A6] to-[#06B6D4]">
                    {collageSongs.length === 0 ? (
                      <div className="col-span-2 row-span-2 flex items-center justify-center text-white text-3xl">
                        🎵
                      </div>
                    ) : collageSongs.length < 4 ? (
                      <div className="col-span-2 row-span-2">
                        <SongCover song={collageSongs[0]} size="lg" className="w-full h-full" showBadges={false} />
                      </div>
                    ) : (
                      collageSongs.map((s, idx) => (
                        <div key={idx} className="w-full h-full overflow-hidden">
                          <SongCover song={s} size="sm" className="!w-full !h-full rounded-none" showBadges={false} />
                        </div>
                      ))
                    )}
                  </div>

                  <h4 className="font-bold text-xs truncate leading-snug">{pl.name}</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                    {pl.songIds.length} Lagu
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreatePlaylistModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
};
