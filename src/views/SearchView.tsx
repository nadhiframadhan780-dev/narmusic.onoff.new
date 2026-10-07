import React, { useState, useMemo } from 'react';
import { useMusic } from '../context/MusicContext';
import { SongCover } from '../components/SongCover';
import { formatTime } from '../utils/metadata';

export const SearchView: React.FC = () => {
  const { songs, playlists, playSong, setSelectedPlaylistId, setActiveView } = useMusic();
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!query.trim()) return { songs: [], playlists: [] };
    const q = query.toLowerCase().trim();

    const matchedSongs = songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.album.toLowerCase().includes(q)
    );

    const matchedPlaylists = playlists.filter((p) =>
      p.name.toLowerCase().includes(q)
    );

    return { songs: matchedSongs, playlists: matchedPlaylists };
  }, [songs, playlists, query]);

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-[#0F2F2C]">
          Pencarian Musik
        </h2>
        <p className="text-xs text-teal-600 mt-0.5">
          Cari lagu, artis, album, atau playlist di NARmusic
        </p>
      </div>

      {/* Large Search Input */}
      <div className="relative">
        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          autoFocus
          placeholder="Ketik judul lagu, nama penyanyi, atau album..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-teal-500/30 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-[#0F2F2C] shadow-sm"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Search Suggestions if query is empty */}
      {!query.trim() && (
        <div className="p-6 rounded-3xl bg-white border border-teal-500/15 text-center text-gray-500">
          <div className="w-12 h-12 mx-auto mb-2 text-teal-500/40">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold">Mulai Mengetik untuk Mencari</p>
          <p className="text-xs mt-1">Pencarian bekerja secara real-time dan offline</p>
        </div>
      )}

      {/* Results */}
      {query.trim() && (
        <div className="space-y-6">
          {/* Songs Results */}
          <div>
            <h3 className="font-bold text-base mb-3 text-teal-800">
              Lagu ({searchResults.songs.length})
            </h3>
            {searchResults.songs.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Tidak ada lagu yang cocok</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {searchResults.songs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => playSong(song)}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-gray-100 hover:border-teal-500/40 shadow-sm transition cursor-pointer"
                  >
                    <SongCover song={song} size="sm" className="!w-12 !h-12 shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs truncate leading-snug">{song.title}</h4>
                      <p className="text-[11px] text-gray-500 truncate">
                        {song.artist} • {song.album}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-gray-400 pr-1">
                      {formatTime(song.duration)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Playlists Results */}
          {searchResults.playlists.length > 0 && (
            <div>
              <h3 className="font-bold text-base mb-3 text-teal-800">
                Playlist ({searchResults.playlists.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {searchResults.playlists.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => {
                      setSelectedPlaylistId(pl.id);
                      setActiveView('playlist');
                    }}
                    className="p-3 rounded-2xl bg-white border border-teal-500/20 hover:border-teal-500/50 shadow-sm transition cursor-pointer"
                  >
                    <div className="aspect-square rounded-xl bg-gradient-to-tr from-[#14B8A6] to-[#06B6D4] flex items-center justify-center text-white text-2xl font-bold mb-2">
                      🎵
                    </div>
                    <h4 className="font-bold text-xs truncate">{pl.name}</h4>
                    <p className="text-[11px] text-gray-400">{pl.songIds.length} Lagu</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
