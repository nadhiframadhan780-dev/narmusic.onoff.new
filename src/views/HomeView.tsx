import React, { useMemo } from 'react';
import { useMusic } from '../context/MusicContext';
import { SongCover } from '../components/SongCover';
import { Song } from '../types';
import { formatTime } from '../utils/metadata';

export const HomeView: React.FC = () => {
  const {
    songs,
    playlists,
    playSong,
    currentSong,
    isPlaying,
    setActiveView,
    setSelectedPlaylistId,
    addToQueue,
  } = useMusic();

  // Salam sesuai waktu (Waktu Lokal)
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi 🌅';
    if (hour >= 11 && hour < 15) return 'Selamat Siang ☀️';
    if (hour >= 15 && hour < 18) return 'Selamat Sore 🌇';
    return 'Selamat Malam 🌙';
  }, []);

  // Filter lagu untuk sections
  const recentlyPlayed = useMemo(() => {
    return songs
      .filter((s) => s.lastPlayed && s.lastPlayed > 0)
      .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
      .slice(0, 6);
  }, [songs]);

  const favorites = useMemo(() => {
    return songs.filter((s) => s.isFavorite).slice(0, 8);
  }, [songs]);

  const newlyAdded = useMemo(() => {
    return [...songs].sort((a, b) => b.dateAdded - a.dateAdded).slice(0, 8);
  }, [songs]);

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Greeting Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#14B8A6] via-[#0D9488] to-[#0B1F1E] p-6 sm:p-8 text-white shadow-xl shadow-teal-900/10">
        <div className="relative z-10 max-w-xl">
          <span className="inline-block px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-2">
            NARmusic Player
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            {greeting}
          </h2>
          <p className="text-sm text-teal-100 leading-relaxed mb-4">
            Pemutar musik PWA modern dengan penyimpanan offline lokal, equalizer 5-band,
            dan dukungan link Spotify.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveView('pustaka')}
              className="px-4 py-2 rounded-xl bg-white text-teal-900 font-bold text-xs shadow hover:bg-teal-50 active:scale-95 transition"
            >
              Buka Pustaka Musik
            </button>
            <div className="text-xs text-teal-200 font-medium">
              <span>{songs.length} Lagu</span> • <span>{playlists.length} Playlist</span>
            </div>
          </div>
        </div>

        {/* Decorative Graphic Aura */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-gradient-to-tr from-[#06B6D4] to-[#6EE7B7] opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute top-4 right-8 opacity-10 hidden sm:block pointer-events-none">
          <svg className="w-48 h-48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
      </div>

      {/* Empty State */}
      {songs.length === 0 && (
        <div className="text-center py-12 px-4 rounded-3xl bg-white border border-teal-500/20 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h3 className="font-bold text-lg mb-1">Pustaka Musik Masih Kosong</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4 leading-relaxed">
            Upload file lagu dari komputer/HP Anda, pilih folder musik perangkat, atau tempel link lagu Spotify!
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveView('pustaka')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white text-xs font-semibold shadow hover:opacity-95 transition"
            >
              Upload Lagu Pertamamu
            </button>
          </div>
        </div>
      )}

      {/* Section: Terakhir Diputar */}
      {recentlyPlayed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg sm:text-xl text-[#0F2F2C] flex items-center gap-2">
              <span>🕒 Terakhir Diputar</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {recentlyPlayed.map((song) => {
              const isCurrent = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => playSong(song)}
                  className={`group relative p-2.5 rounded-2xl bg-white  border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02] ${
                    isCurrent
                      ? 'border-teal-500 ring-2 ring-teal-500/20'
                      : 'border-gray-100  hover:border-teal-400/40'
                  }`}
                >
                  <div className="relative mb-2 aspect-square rounded-xl overflow-hidden">
                    <SongCover song={song} size="lg" className="w-full h-full" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSong(song);
                      }}
                      className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                    >
                      {isCurrent && isPlaying ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <h4 className="font-semibold text-xs truncate leading-snug">{song.title}</h4>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">
                    {song.artist}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section: Playlist Saya */}
      {playlists.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg sm:text-xl text-[#0F2F2C]">
              📚 Playlist Saya
            </h3>
            <button
              onClick={() => setActiveView('playlist')}
              className="text-xs font-semibold text-teal-600 hover:underline"
            >
              Lihat Semua
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {playlists.slice(0, 4).map((pl) => (
              <div
                key={pl.id}
                onClick={() => {
                  setSelectedPlaylistId(pl.id);
                  setActiveView('playlist');
                }}
                className="group p-3 rounded-2xl bg-white border border-gray-100 hover:border-teal-400/40 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="aspect-square rounded-xl bg-gradient-to-tr from-[#14B8A6] to-[#06B6D4] flex items-center justify-center text-white text-3xl font-bold mb-2 shadow-inner">
                  🎵
                </div>
                <h4 className="font-bold text-xs truncate">{pl.name}</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {pl.songIds.length} Lagu
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section: Favorit */}
      {favorites.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg sm:text-xl text-[#0F2F2C] flex items-center gap-1.5">
              <span>❤️ Lagu Favorit</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {favorites.map((song) => (
              <div
                key={song.id}
                onClick={() => playSong(song)}
                className="flex items-center gap-3 p-2 rounded-2xl bg-white border border-gray-100 hover:bg-teal-50/50 shadow-sm transition cursor-pointer"
              >
                <SongCover song={song} size="sm" className="!w-12 !h-12" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs truncate">{song.title}</h4>
                  <p className="text-[11px] text-gray-500 truncate">{song.artist}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToQueue(song);
                  }}
                  className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg"
                  title="Tambah ke Antrean"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section: Baru Ditambahkan */}
      {newlyAdded.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg sm:text-xl text-[#0F2F2C]">
              ✨ Baru Ditambahkan
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {newlyAdded.map((song) => (
              <div
                key={song.id}
                onClick={() => playSong(song)}
                className="group p-2 rounded-2xl bg-white border border-gray-100 hover:border-teal-500/40 shadow-sm transition cursor-pointer text-center"
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-1.5">
                  <SongCover song={song} size="md" className="w-full h-full" />
                </div>
                <h4 className="font-semibold text-[11px] truncate">{song.title}</h4>
                <p className="text-[10px] text-gray-400 truncate">{formatTime(song.duration)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
