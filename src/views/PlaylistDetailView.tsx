import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { SongCover } from '../components/SongCover';
import { formatTime } from '../utils/metadata';
import { CreatePlaylistModal } from '../components/CreatePlaylistModal';

export const PlaylistDetailView: React.FC = () => {
  const {
    playlists,
    selectedPlaylistId,
    setSelectedPlaylistId,
    songs,
    playSong,
    currentSong,
    isPlaying,
    removeSongFromPlaylist,
    deletePlaylist,
    setActiveView,
  } = useMusic();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const playlist = playlists.find((p) => p.id === selectedPlaylistId);

  if (!playlist) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Playlist tidak ditemukan.</p>
        <button
          onClick={() => setActiveView('pustaka')}
          className="mt-3 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
        >
          Kembali ke Pustaka
        </button>
      </div>
    );
  }

  // Ambil data lagu di dalam playlist
  const playlistSongs = playlist.songIds
    .map((id) => songs.find((s) => s.id === id))
    .filter(Boolean) as typeof songs;

  const totalDuration = playlistSongs.reduce((acc, curr) => acc + curr.duration, 0);

  // Ambil 4 thumbnail untuk kolase cover
  const collageSongs = playlistSongs.slice(0, 4);

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      playSong(playlistSongs[0], playlistSongs);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* Back button */}
      <button
        onClick={() => setSelectedPlaylistId(null)}
        className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:underline"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Kembali ke Daftar Playlist</span>
      </button>

      {/* Playlist Hero Banner */}
      <div className="p-6 rounded-3xl bg-white border border-teal-500/20 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Automatic 4-Cover Collage or Single Cover */}
        <div className="w-36 h-36 rounded-2xl overflow-hidden shadow-lg border border-teal-500/20 flex-shrink-0 grid grid-cols-2 grid-rows-2 bg-gradient-to-tr from-[#14B8A6] to-[#06B6D4]">
          {collageSongs.length === 0 ? (
            <div className="col-span-2 row-span-2 flex items-center justify-center text-white text-4xl">
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

        {/* Playlist Info */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">
            Daftar Putar
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F2F2C] truncate mt-0.5">
            {playlist.name}
          </h2>
          {playlist.description && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {playlist.description}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-gray-500">
            <span>{playlistSongs.length} Lagu</span>
            <span>•</span>
            <span>{formatTime(totalDuration)} Total Waktu</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-5">
            <button
              onClick={handlePlayAll}
              disabled={playlistSongs.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white font-semibold text-xs shadow-md shadow-teal-500/20 hover:opacity-95 disabled:opacity-40 transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Putar Semua</span>
            </button>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-teal-500/30 text-xs font-semibold text-teal-700 hover:bg-teal-50 transition"
            >
              Ubah Nama / Info
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3.5 py-2.5 rounded-xl border border-rose-500/30 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
            >
              Hapus Playlist
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Box */}
      {showDeleteConfirm && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-xs animate-in fade-in">
          <p className="font-bold text-rose-800 mb-1">
            Yakin ingin menghapus playlist "{playlist.name}"?
          </p>
          <p className="text-gray-600 mb-3">
            Lagu di dalamnya tidak akan dihapus dari pustaka lokal Anda.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 rounded-xl border border-gray-300 font-semibold"
            >
              Batal
            </button>
            <button
              onClick={() => deletePlaylist(playlist.id)}
              className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition"
            >
              Hapus Playlist
            </button>
          </div>
        </div>
      )}

      {/* Songs List */}
      <div className="bg-white rounded-3xl border border-teal-500/15 overflow-hidden shadow-sm">
        {playlistSongs.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-sm font-semibold">Playlist ini masih kosong</p>
            <p className="text-xs mt-1">
              Tambahkan lagu dengan menekan tombol "+" pada lagu di Pustaka Musik.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {playlistSongs.map((song, idx) => {
              const isCurrent = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => playSong(song, playlistSongs)}
                  className={`group flex items-center gap-3 p-3 sm:px-4 transition cursor-pointer ${
                    isCurrent
                      ? 'bg-teal-500/15 text-teal-800 '
                      : 'hover:bg-teal-50/50 '
                  }`}
                >
                  <span className="w-6 text-center font-mono text-xs text-gray-400 group-hover:hidden">
                    {idx + 1}
                  </span>
                  <span className="w-6 hidden group-hover:flex items-center justify-center text-teal-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>

                  <SongCover song={song} size="sm" className="!w-10 !h-10 shadow-sm" />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm truncate">{song.title}</h4>
                    <p className="text-[11px] text-gray-500 truncate">
                      {song.artist}
                    </p>
                  </div>

                  <span className="font-mono text-xs text-gray-400">
                    {formatTime(song.duration)}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSongFromPlaylist(playlist.id, song.id);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 transition"
                    title="Keluarkan dari Playlist"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreatePlaylistModal
        isOpen={isEditModalOpen}
        playlistToEdit={playlist}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};
