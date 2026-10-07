import React, { useMemo, useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { SongCover } from '../components/SongCover';
import { Song } from '../types';
import { formatTime } from '../utils/metadata';
import { EditSongModal } from '../components/EditSongModal';

export const LibraryView: React.FC = () => {
  const {
    songs,
    playSong,
    currentSong,
    isPlaying,
    addToQueue,
    toggleFavorite,
    playlists,
    addSongToPlaylist,
    showToast,
    settings,
    updateSettings,
  } = useMusic();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'recent' | 'popular'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'date' | 'duration'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [songToEdit, setSongToEdit] = useState<Song | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [playlistMenuSongId, setPlaylistMenuSongId] = useState<string | null>(null);

  // Filter & Search & Sort Logic
  const filteredSongs = useMemo(() => {
    let result = [...songs];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.album.toLowerCase().includes(q)
      );
    }

    // Filter Tag
    if (activeFilter === 'favorites') {
      result = result.filter((s) => s.isFavorite);
    } else if (activeFilter === 'recent') {
      result = result.filter((s) => s.lastPlayed && s.lastPlayed > 0);
      result.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
      return result;
    } else if (activeFilter === 'popular') {
      result.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
      return result;
    }

    // Sorting
    result.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortBy === 'title') {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      } else if (sortBy === 'artist') {
        valA = a.artist.toLowerCase();
        valB = b.artist.toLowerCase();
      } else if (sortBy === 'duration') {
        valA = a.duration;
        valB = b.duration;
      } else {
        valA = a.dateAdded;
        valB = b.dateAdded;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [songs, searchQuery, activeFilter, sortBy, sortOrder]);

  const viewMode = settings.libraryViewMode;
  const toggleViewMode = () => {
    updateSettings({ libraryViewMode: viewMode === 'grid' ? 'list' : 'grid' });
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* Title & View Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#0F2F2C]">
            Pustaka Musik
          </h2>
          <p className="text-xs text-teal-600 mt-0.5">
            {songs.length} total lagu tersimpan di perangkat lokal
          </p>
        </div>

        {/* View Mode Toggle (Grid vs List) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center p-1 rounded-2xl bg-white border border-teal-500/20 shadow-sm">
            <button
              onClick={() => updateSettings({ libraryViewMode: 'grid' })}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white shadow'
                  : 'text-gray-500 hover:text-teal-600'
              }`}
              title="Tampilan Grid Kartu Album"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Grid</span>
            </button>
            <button
              onClick={() => updateSettings({ libraryViewMode: 'list' })}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white shadow'
                  : 'text-gray-500 hover:text-teal-600'
              }`}
              title="Tampilan Daftar List"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Daftar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar, Filters & Sort Controls */}
      <div className="space-y-3 p-4 rounded-3xl bg-white border border-teal-500/15 shadow-sm">
        {/* Search Input */}
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari berdasarkan judul lagu, artis, atau album..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-[#0F2F2C]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters and Sort Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'favorites', label: 'Favorit ❤️' },
              { id: 'recent', label: 'Terakhir Diputar' },
              { id: 'popular', label: 'Terbanyak Diputar' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as typeof activeFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeFilter === f.id
                    ? 'bg-teal-500/20 text-teal-800  border border-teal-500/40 font-bold'
                    : 'bg-gray-100  text-gray-600  hover:bg-gray-200 '
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="date">Tanggal Ditambahkan</option>
              <option value="title">Judul Lagu</option>
              <option value="artist">Nama Artis</option>
              <option value="duration">Durasi</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 rounded-xl border border-gray-200 hover:bg-teal-50 text-teal-700"
              title={sortOrder === 'asc' ? 'Urutan Naik (A-Z)' : 'Urutan Turun (Z-A)'}
            >
              {sortOrder === 'asc' ? '⬆️' : '⬇️'}
            </button>
          </div>
        </div>
      </div>

      {/* Empty State when no results */}
      {filteredSongs.length === 0 && (
        <div className="text-center py-16 px-4 rounded-3xl bg-white border border-teal-500/20">
          <p className="font-bold text-base text-gray-700">
            {searchQuery ? 'Tidak ada lagu yang cocok dengan pencarian' : 'Belum ada lagu di filter ini'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Gunakan tombol Upload di atas atau reset filter pencarian.
          </p>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && filteredSongs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredSongs.map((song) => {
            const isCurrent = currentSong?.id === song.id;
            return (
              <div
                key={song.id}
                onClick={() => playSong(song, filteredSongs)}
                className={`group relative p-3 rounded-2xl bg-white  border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg hover:scale-[1.02] flex flex-col justify-between ${
                  isCurrent
                    ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-teal-500/10'
                    : 'border-gray-100  hover:border-teal-400/50'
                }`}
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5">
                    <SongCover song={song} size="lg" className="w-full h-full" />
                    {/* Hover Play Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSong(song, filteredSongs);
                      }}
                      className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                    >
                      {isCurrent && isPlaying ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <h4 className="font-bold text-xs truncate leading-snug">{song.title}</h4>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">
                    {song.artist}
                  </p>
                </div>

                {/* Card Actions Bottom */}
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100 text-gray-400 text-xs">
                  <span className="font-mono text-[10px]">{formatTime(song.duration)}</span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleFavorite(song.id)}
                      className={`p-1 hover:text-rose-500 ${song.isFavorite ? 'text-rose-500' : ''}`}
                      title="Favorit"
                    >
                      <svg className="w-3.5 h-3.5" fill={song.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setSongToEdit(song);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1 hover:text-teal-600"
                      title="Edit Info Lagu"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && filteredSongs.length > 0 && (
        <div className="bg-white rounded-3xl border border-teal-500/15 overflow-hidden shadow-sm">
          <div className="divide-y divide-gray-100">
            {filteredSongs.map((song, idx) => {
              const isCurrent = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => playSong(song, filteredSongs)}
                  className={`group flex items-center gap-3 p-3 sm:px-4 transition cursor-pointer ${
                    isCurrent
                      ? 'bg-teal-500/15 text-teal-800 '
                      : 'hover:bg-teal-50/50 '
                  }`}
                >
                  {/* Track index / play icon */}
                  <span className="w-6 text-center font-mono text-xs text-gray-400 group-hover:hidden">
                    {idx + 1}
                  </span>
                  <span className="w-6 hidden group-hover:flex items-center justify-center text-teal-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>

                  {/* Artwork */}
                  <SongCover song={song} size="sm" className="!w-11 !h-11 shadow-sm" />

                  {/* Title & Artist */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm truncate leading-snug">
                      {song.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 truncate">
                      {song.artist} • <span className="opacity-75">{song.album}</span>
                    </p>
                  </div>

                  {/* Duration */}
                  <span className="font-mono text-xs text-gray-400 hidden sm:inline">
                    {formatTime(song.duration)}
                  </span>

                  {/* Action Buttons */}
                  <div
                    className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => toggleFavorite(song.id)}
                      className={`p-1.5 rounded-lg hover:text-rose-500 ${
                        song.isFavorite ? 'text-rose-500' : 'text-gray-400'
                      }`}
                      title="Favorit"
                    >
                      <svg className="w-4 h-4" fill={song.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => addToQueue(song, true)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600"
                      title="Putar Berikutnya"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Add to Playlist Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setPlaylistMenuSongId(playlistMenuSongId === song.id ? null : song.id)
                        }
                        className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600"
                        title="Tambah ke Playlist"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>

                      {playlistMenuSongId === song.id && (
                        <div className="absolute right-0 bottom-full mb-1 z-30 bg-white border border-teal-500/30 rounded-2xl p-2 shadow-2xl min-w-[160px] text-xs space-y-1">
                          <div className="font-bold text-[10px] uppercase text-gray-400 px-2 py-1">
                            Pilih Playlist:
                          </div>
                          {playlists.length === 0 ? (
                            <div className="px-2 py-1 text-gray-400 text-[11px]">Belum ada playlist</div>
                          ) : (
                            playlists.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  addSongToPlaylist(p.id, song.id);
                                  setPlaylistMenuSongId(null);
                                }}
                                className="w-full text-left px-2 py-1 rounded-lg hover:bg-teal-50 truncate"
                              >
                                🎵 {p.name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Edit Modal */}
                    <button
                      onClick={() => {
                        setSongToEdit(song);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600"
                      title="Edit Info Lagu"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Song Modal */}
      <EditSongModal
        song={songToEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSongToEdit(null);
        }}
      />
    </div>
  );
};
