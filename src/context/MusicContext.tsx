import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Song,
  Playlist,
  RepeatMode,
  AppSettings,
  StorageStats,
  ToastMessage,
} from '../types';
import {
  getAudioFile,
  getThumbnail,
  saveAudioFile,
  saveThumbnail,
  deleteAudioFile,
  deleteThumbnail,
  getStoreBytes,
  clearAllIndexedDB,
  requestStoragePersistence,
  checkStoragePersistence,
  STORES,
} from '../utils/idb';
import { audioEngine, EQUALIZER_PRESETS } from '../utils/audioEngine';
import { formatBytes, generateDefaultCoverBlob } from '../utils/metadata';
import { SpotifyParseResult } from '../utils/spotify';

interface MusicContextType {
  // Songs & Library
  songs: Song[];
  playlists: Playlist[];
  currentSong: Song | null;
  currentSongThumbnailUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  queue: Song[];
  queueIndex: number;

  // View Navigation
  activeView: 'beranda' | 'pustaka' | 'cari' | 'playlist' | 'pengaturan';
  setActiveView: (view: 'beranda' | 'pustaka' | 'cari' | 'playlist' | 'pengaturan') => void;
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  isFullPlayerOpen: boolean;
  setIsFullPlayerOpen: (open: boolean) => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  isSpotifyModalOpen: boolean;
  setIsSpotifyModalOpen: (open: boolean) => void;

  // Playback Controls
  playSong: (song: Song, customQueue?: Song[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  seek: (seconds: number) => void;
  changeVolume: (volume: number) => void;
  toggleMute: () => void;
  setRate: (rate: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;

  // Queue Operations
  addToQueue: (song: Song, playNext?: boolean) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  clearQueue: () => void;

  // Equalizer
  eqPreset: string;
  eqGains: [number, number, number, number, number];
  setEqPreset: (presetName: string) => void;
  setEqBandGain: (bandIndex: number, gainDb: number) => void;

  // Sleep Timer
  sleepTimerMinutes: number | null;
  sleepTimerRemaining: number | null;
  setSleepTimer: (minutes: number | null | 'endOfSong') => void;

  // Song CRUD & Metadata
  addUploadedSong: (newSong: Song, audioBlob: Blob, coverBlob?: Blob | null) => Promise<void>;
  addSpotifySong: (data: SpotifyParseResult) => Promise<void>;
  updateSongMetadata: (songId: string, updates: Partial<Song>, newCoverBlob?: Blob) => Promise<void>;
  deleteSong: (songId: string) => Promise<void>;
  toggleFavorite: (songId: string) => void;
  updateSongLyrics: (songId: string, lyrics: string) => void;
  downloadSongAudio: (song: Song) => Promise<void>;

  // Playlists CRUD
  createPlaylist: (name: string, description?: string) => Playlist;
  updatePlaylist: (id: string, name: string, description?: string) => void;
  deletePlaylist: (id: string) => void;
  addSongToPlaylist: (playlistId: string, songId: string) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;

  // Storage & Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  storageStats: StorageStats;
  recalculateStorage: () => Promise<void>;
  clearCache: () => Promise<void>;
  wipeAllData: () => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  showToast: (title: string, message?: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  accentColor: 'teal',
  libraryViewMode: 'grid',
  gridSize: 'medium',
  crossfadeEnabled: false,
  crossfadeDuration: 2,
  volumeNormalization: true,
  defaultEqPreset: 'Normal',
  customEqGains: [0, 0, 0, 0, 0],
  visualizerQuality: 'high',
  visualizerStyle: 'bars',
  autoResume: true,
  keyboardShortcutsEnabled: true,
};

const MusicContext = createContext<MusicContextType | null>(null);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persisted state keys
  const STORAGE_KEY_SONGS = 'narmusic_songs_v1';
  const STORAGE_KEY_PLAYLISTS = 'narmusic_playlists_v1';
  const STORAGE_KEY_SETTINGS = 'narmusic_settings_v1';
  const STORAGE_KEY_LAST_STATE = 'narmusic_last_state_v1';

  // Core state
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SONGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYLISTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved), theme: 'light' } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentSongThumbnailUrl, setCurrentSongThumbnailUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');

  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);

  // Equalizer
  const [eqPreset, setEqPresetState] = useState<string>(settings.defaultEqPreset);
  const [eqGains, setEqGains] = useState<[number, number, number, number, number]>(settings.customEqGains);

  // Sleep Timer
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sleepEndOfSongRef = useRef<boolean>(false);

  // View & UI Navigation
  const [activeView, setActiveView] = useState<'beranda' | 'pustaka' | 'cari' | 'playlist' | 'pengaturan'>('beranda');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Storage Stats
  const [storageStats, setStorageStats] = useState<StorageStats>({
    usedBytes: 0,
    quotaBytes: 0,
    usedFormatted: '0 MB',
    quotaFormatted: '0 MB',
    percentUsed: 0,
    audioBytes: 0,
    thumbnailBytes: 0,
    songCount: 0,
    isPersisted: false,
  });

  const objectUrlCache = useRef<Map<string, string>>(new Map());

  // Show Toast Helper
  const showToast = useCallback((title: string, message?: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(songs));
    } catch (e) {
      console.warn('Gagal menyimpan songs ke localStorage:', e);
    }
  }, [songs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(playlists));
    } catch (e) {
      console.warn('Gagal menyimpan playlists ke localStorage:', e);
    }
  }, [playlists]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ ...settings, theme: 'light' }));
    } catch (e) {
      console.warn('Gagal menyimpan settings ke localStorage:', e);
    }
    // Always Light Mode only
    document.documentElement.classList.remove('dark');
  }, [settings]);

  // Recalculate Storage Usage
  const recalculateStorage = useCallback(async () => {
    let quota = 0;
    let used = 0;
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        quota = est.quota || 0;
        used = est.usage || 0;
      } catch (err) {
        console.warn('Storage estimate failed:', err);
      }
    }

    const audioBytes = await getStoreBytes(STORES.AUDIO);
    const thumbnailBytes = await getStoreBytes(STORES.THUMBNAILS);
    const isPersisted = await checkStoragePersistence();

    const percentUsed = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;

    setStorageStats({
      usedBytes: used,
      quotaBytes: quota,
      usedFormatted: formatBytes(used),
      quotaFormatted: formatBytes(quota),
      percentUsed,
      audioBytes,
      thumbnailBytes,
      songCount: songs.length,
      isPersisted,
    });
  }, [songs.length]);

  useEffect(() => {
    recalculateStorage();
    requestStoragePersistence().then(() => recalculateStorage());
  }, [recalculateStorage]);

  // Resolve thumbnail URL for a song
  const resolveThumbnailUrl = useCallback(async (song: Song | null): Promise<string | null> => {
    if (!song) return null;
    if (song.sourceType === 'spotify' && song.thumbnailUrl) {
      return song.thumbnailUrl;
    }
    if (song.thumbnailKey) {
      if (objectUrlCache.current.has(song.thumbnailKey)) {
        return objectUrlCache.current.get(song.thumbnailKey)!;
      }
      const blob = await getThumbnail(song.thumbnailKey);
      if (blob) {
        const url = URL.createObjectURL(blob);
        objectUrlCache.current.set(song.thumbnailKey, url);
        return url;
      }
    }
    return null;
  }, []);

  // Update thumbnail URL when currentSong changes
  useEffect(() => {
    if (currentSong) {
      resolveThumbnailUrl(currentSong).then((url) => {
        setCurrentSongThumbnailUrl(url);
      });
    } else {
      setCurrentSongThumbnailUrl(null);
    }
  }, [currentSong, resolveThumbnailUrl]);

  // Sync Media Session API
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && currentSong) {
      try {
        const artwork = currentSongThumbnailUrl
          ? [{ src: currentSongThumbnailUrl, sizes: '512x512', type: 'image/png' }]
          : [{ src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }];

        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentSong.title,
          artist: currentSong.artist,
          album: currentSong.album || 'NARmusic',
          artwork,
        });

        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      } catch (err) {
        console.warn('Gagal memperbarui MediaSession metadata:', err);
      }
    }
  }, [currentSong, isPlaying, currentSongThumbnailUrl]);

  // Save last played song & position for Auto-Resume
  useEffect(() => {
    if (currentSong && settings.autoResume) {
      try {
        localStorage.setItem(
          STORAGE_KEY_LAST_STATE,
          JSON.stringify({
            songId: currentSong.id,
            currentTime,
          })
        );
      } catch {
        // ignore
      }
    }
  }, [currentSong, currentTime, settings.autoResume]);

  // Auto-Resume on initial load
  useEffect(() => {
    if (settings.autoResume && songs.length > 0 && !currentSong) {
      try {
        const savedState = localStorage.getItem(STORAGE_KEY_LAST_STATE);
        if (savedState) {
          const { songId, currentTime: savedTime } = JSON.parse(savedState);
          const found = songs.find((s) => s.id === songId);
          if (found) {
            setCurrentSong(found);
            setQueue([found]);
            setQueueIndex(0);
            if (savedTime && found.sourceType !== 'spotify') {
              setCurrentTime(savedTime);
              // Siapkan audio di background tanpa auto-play (kebijakan browser)
              getAudioFile(found.id).then((blob) => {
                if (blob) {
                  audioEngine.loadSource(blob);
                  audioEngine.seek(savedTime);
                }
              });
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }, [songs, settings.autoResume]);

  // Sleep Timer countdown
  useEffect(() => {
    if (sleepTimerRemaining !== null && sleepTimerRemaining > 0) {
      sleepTimerRef.current = setInterval(() => {
        setSleepTimerRemaining((prev) => {
          if (prev === null || prev <= 1) {
            // Timer selesai: pause playback
            audioEngine.pause();
            setIsPlaying(false);
            showToast('Sleep Timer Selesai', 'Musik telah dihentikan secara otomatis.', 'info');
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
      };
    }
  }, [sleepTimerRemaining, showToast]);

  const setSleepTimer = useCallback(
    (minutes: number | null | 'endOfSong') => {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
        sleepTimerRef.current = null;
      }

      if (minutes === null) {
        setSleepTimerMinutes(null);
        setSleepTimerRemaining(null);
        sleepEndOfSongRef.current = false;
        showToast('Sleep Timer Dimatikan', '', 'info');
      } else if (minutes === 'endOfSong') {
        setSleepTimerMinutes(null);
        setSleepTimerRemaining(null);
        sleepEndOfSongRef.current = true;
        showToast('Sleep Timer Aktif', 'Akan berhenti di akhir lagu ini', 'success');
      } else {
        sleepEndOfSongRef.current = false;
        setSleepTimerMinutes(minutes);
        setSleepTimerRemaining(minutes * 60);
        showToast('Sleep Timer Aktif', `Berhenti dalam ${minutes} menit`, 'success');
      }
    },
    [showToast]
  );

  // Hook up Audio Element Events
  useEffect(() => {
    const audio = audioEngine.getAudioElement();

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      if (sleepEndOfSongRef.current) {
        sleepEndOfSongRef.current = false;
        audioEngine.pause();
        setIsPlaying(false);
        showToast('Sleep Timer', 'Lagu berakhir, pemutaran dihentikan.', 'info');
        return;
      }

      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audioEngine.play(settings.crossfadeEnabled, settings.crossfadeDuration);
      } else {
        playNext();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  });

  // Play a song
  const playSong = useCallback(
    async (song: Song, customQueue?: Song[]) => {
      setCurrentSong(song);

      // Setup queue if provided
      if (customQueue && customQueue.length > 0) {
        setQueue(customQueue);
        const idx = customQueue.findIndex((s) => s.id === song.id);
        setQueueIndex(idx >= 0 ? idx : 0);
      } else if (!queue.some((s) => s.id === song.id)) {
        setQueue((prev) => [...prev, song]);
        setQueueIndex(queue.length);
      } else {
        const idx = queue.findIndex((s) => s.id === song.id);
        setQueueIndex(idx);
      }

      // Update play count & last played
      setSongs((prev) =>
        prev.map((s) =>
          s.id === song.id
            ? { ...s, playCount: (s.playCount || 0) + 1, lastPlayed: Date.now() }
            : s
        )
      );

      // Jika lagu dari Spotify: pause local audio dan buka Spotify modal/embed
      if (song.sourceType === 'spotify') {
        audioEngine.pause();
        setIsPlaying(false);
        setIsSpotifyModalOpen(true);
        return;
      }

      // Lagu lokal atau folder
      try {
        const audioBlob = await getAudioFile(song.id);
        if (!audioBlob) {
          showToast('File audio tidak ditemukan di penyimpanan lokal', '', 'error');
          return;
        }

        audioEngine.loadSource(audioBlob);
        audioEngine.setVolume(volume);
        audioEngine.setPlaybackRate(playbackRate);
        audioEngine.setEqualizerGains(eqGains);

        await audioEngine.play(settings.crossfadeEnabled, settings.crossfadeDuration);
        setIsPlaying(true);
      } catch (err) {
        console.error('Gagal memutar audio:', err);
        showToast('Gagal memutar lagu', 'Format file mungkin tidak didukung oleh browser ini', 'error');
      }
    },
    [queue, volume, playbackRate, eqGains, settings.crossfadeEnabled, settings.crossfadeDuration, showToast]
  );

  const togglePlay = useCallback(async () => {
    if (!currentSong) {
      if (songs.length > 0) {
        await playSong(songs[0], songs);
      }
      return;
    }

    if (currentSong.sourceType === 'spotify') {
      setIsSpotifyModalOpen(true);
      return;
    }

    if (isPlaying) {
      audioEngine.pause(settings.crossfadeEnabled, 0.4);
      setIsPlaying(false);
    } else {
      await audioEngine.play(settings.crossfadeEnabled, settings.crossfadeDuration);
      setIsPlaying(true);
    }
  }, [currentSong, songs, isPlaying, playSong, settings.crossfadeEnabled, settings.crossfadeDuration]);

  const playNext = useCallback(async () => {
    if (queue.length === 0) return;

    let nextIdx: number;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = queueIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeatMode === 'all') {
          nextIdx = 0;
        } else {
          // Antrean selesai
          audioEngine.pause();
          setIsPlaying(false);
          return;
        }
      }
    }

    setQueueIndex(nextIdx);
    const nextSong = queue[nextIdx];
    if (nextSong) {
      await playSong(nextSong);
    }
  }, [queue, queueIndex, isShuffle, repeatMode, playSong]);

  const playPrevious = useCallback(async () => {
    const audio = audioEngine.getAudioElement();
    // Jika lagu sudah berjalan lebih dari 3 detik, restart lagu saat ini
    if (audio.currentTime > 3) {
      audioEngine.seek(0);
      return;
    }

    if (queue.length === 0) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = repeatMode === 'all' ? queue.length - 1 : 0;
    }

    setQueueIndex(prevIdx);
    const prevSong = queue[prevIdx];
    if (prevSong) {
      await playSong(prevSong);
    }
  }, [queue, queueIndex, repeatMode, playSong]);

  const seek = useCallback((seconds: number) => {
    audioEngine.seek(seconds);
    setCurrentTime(seconds);
  }, []);

  const changeVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolume(clamped);
    setIsMuted(clamped === 0);
    audioEngine.setVolume(clamped);
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioEngine.setMuted(newMuted);
  }, [isMuted]);

  const setRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    audioEngine.setPlaybackRate(rate);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const next = !prev;
      showToast(next ? 'Shuffle Aktif' : 'Shuffle Nonaktif', '', 'info');
      return next;
    });
  }, [showToast]);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      let next: RepeatMode = 'off';
      if (prev === 'off') next = 'all';
      else if (prev === 'all') next = 'one';
      else next = 'off';

      const label =
        next === 'off' ? 'Ulang Nonaktif' : next === 'all' ? 'Ulang Semua Lagu' : 'Ulang 1 Lagu';
      showToast(label, '', 'info');
      return next;
    });
  }, [showToast]);

  // Queue manipulation
  const addToQueue = useCallback((song: Song, playNext = false) => {
    setQueue((prev) => {
      if (prev.length === 0) {
        setQueueIndex(0);
        return [song];
      }
      if (playNext) {
        const copy = [...prev];
        copy.splice(queueIndex + 1, 0, song);
        return copy;
      }
      return [...prev, song];
    });
    showToast(playNext ? 'Akan Diputar Berikutnya' : 'Ditambahkan ke Antrean', song.title, 'success');
  }, [queueIndex, showToast]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex((prev) => Math.max(0, prev - 1));
    }
  }, [queueIndex]);

  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    setQueue((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const clearQueue = useCallback(() => {
    if (currentSong) {
      setQueue([currentSong]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(0);
    }
    showToast('Antrean Dibersihkan', '', 'info');
  }, [currentSong, showToast]);

  // Equalizer
  const setEqPreset = useCallback((presetName: string) => {
    setEqPresetState(presetName);
    const gains = audioEngine.applyEqualizerPreset(presetName);
    setEqGains(gains);
    setSettings((prev) => ({ ...prev, defaultEqPreset: presetName, customEqGains: gains }));
  }, []);

  const setEqBandGain = useCallback((bandIndex: number, gainDb: number) => {
    setEqGains((prev) => {
      const copy: [number, number, number, number, number] = [...prev];
      copy[bandIndex] = gainDb;
      audioEngine.setEqualizerGains(copy);
      setEqPresetState('Kustom');
      setSettings((s) => ({ ...s, defaultEqPreset: 'Kustom', customEqGains: copy }));
      return copy;
    });
  }, []);

  // CRUD Songs
  const addUploadedSong = useCallback(
    async (newSong: Song, audioBlob: Blob, coverBlob?: Blob | null) => {
      try {
        await saveAudioFile(newSong.id, audioBlob);

        let finalCoverBlob = coverBlob;
        if (!finalCoverBlob) {
          finalCoverBlob = await generateDefaultCoverBlob(newSong.title, newSong.artist);
        }

        if (finalCoverBlob) {
          await saveThumbnail(newSong.id, finalCoverBlob);
          newSong.thumbnailKey = newSong.id;
        }

        setSongs((prev) => [newSong, ...prev]);
        recalculateStorage();
      } catch (err: unknown) {
        const error = err as Error;
        console.error('Gagal menambahkan lagu:', error);
        throw error;
      }
    },
    [recalculateStorage]
  );

  const addSpotifySong = useCallback(
    async (result: SpotifyParseResult) => {
      const existing = songs.find((s) => s.spotifyId === result.id);
      if (existing) {
        showToast('Lagu Sudah Ada di Pustaka', existing.title, 'warning');
        return;
      }

      const spotifySong: Song = {
        id: `spotify_${result.id}_${Date.now()}`,
        title: result.title || 'Lagu Spotify',
        artist: result.artist || 'Spotify',
        album: 'Spotify Stream',
        duration: 180, // estimasi 3 menit
        sourceType: 'spotify',
        spotifyId: result.id,
        spotifyUrl: result.canonicalUrl,
        spotifyType: result.type,
        thumbnailUrl: result.thumbnailUrl,
        dateAdded: Date.now(),
        playCount: 0,
        isFavorite: false,
      };

      setSongs((prev) => [spotifySong, ...prev]);
      showToast('Lagu Spotify Tersimpan', spotifySong.title, 'success');
      recalculateStorage();
    },
    [songs, showToast, recalculateStorage]
  );

  const updateSongMetadata = useCallback(
    async (songId: string, updates: Partial<Song>, newCoverBlob?: Blob) => {
      if (newCoverBlob) {
        await saveThumbnail(songId, newCoverBlob);
        // Hapus cache object URL agar diperbarui
        if (objectUrlCache.current.has(songId)) {
          URL.revokeObjectURL(objectUrlCache.current.get(songId)!);
          objectUrlCache.current.delete(songId);
        }
        updates.thumbnailKey = songId;
      }

      setSongs((prev) =>
        prev.map((s) => (s.id === songId ? { ...s, ...updates } : s))
      );

      if (currentSong && currentSong.id === songId) {
        setCurrentSong((prev) => (prev ? { ...prev, ...updates } : null));
      }

      showToast('Metadata Diperbarui', '', 'success');
      recalculateStorage();
    },
    [currentSong, showToast, recalculateStorage]
  );

  const deleteSong = useCallback(
    async (songId: string) => {
      await deleteAudioFile(songId);
      await deleteThumbnail(songId);

      if (objectUrlCache.current.has(songId)) {
        URL.revokeObjectURL(objectUrlCache.current.get(songId)!);
        objectUrlCache.current.delete(songId);
      }

      setSongs((prev) => prev.filter((s) => s.id !== songId));
      setQueue((prev) => prev.filter((s) => s.id !== songId));

      // Hapus dari playlists
      setPlaylists((prev) =>
        prev.map((p) => ({
          ...p,
          songIds: p.songIds.filter((id) => id !== songId),
        }))
      );

      if (currentSong && currentSong.id === songId) {
        audioEngine.pause();
        setCurrentSong(null);
        setIsPlaying(false);
      }

      showToast('Lagu Dihapus', '', 'info');
      recalculateStorage();
    },
    [currentSong, showToast, recalculateStorage]
  );

  const toggleFavorite = useCallback((songId: string) => {
    setSongs((prev) =>
      prev.map((s) => (s.id === songId ? { ...s, isFavorite: !s.isFavorite } : s))
    );
    if (currentSong && currentSong.id === songId) {
      setCurrentSong((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  }, [currentSong]);

  const updateSongLyrics = useCallback((songId: string, lyrics: string) => {
    setSongs((prev) =>
      prev.map((s) => (s.id === songId ? { ...s, lyrics } : s))
    );
    if (currentSong && currentSong.id === songId) {
      setCurrentSong((prev) => (prev ? { ...prev, lyrics } : null));
    }
    showToast('Lirik Tersimpan', 'Lirik lagu telah diperbarui', 'success');
  }, [currentSong, showToast]);

  const downloadSongAudio = useCallback(async (song: Song) => {
    if (song.sourceType === 'spotify') {
      showToast('Informasi Spotify', 'Lagu Spotify berhak cipta DRM dan tidak dapat diunduh ke file perangkat.', 'warning');
      return;
    }
    try {
      const blob = await getAudioFile(song.id);
      if (!blob) {
        showToast('File Tidak Ditemukan', 'File audio belum tersimpan di IndexedDB.', 'error');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTitle = song.title.replace(/[\\/:*?"<>|]/g, '_');
      const cleanArtist = song.artist.replace(/[\\/:*?"<>|]/g, '_');
      let ext = 'mp3';
      if (song.mimeType?.includes('wav')) ext = 'wav';
      else if (song.mimeType?.includes('ogg')) ext = 'ogg';
      else if (song.mimeType?.includes('flac')) ext = 'flac';
      else if (song.mimeType?.includes('m4a') || song.mimeType?.includes('aac')) ext = 'm4a';
      
      a.download = `${cleanArtist} - ${cleanTitle}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Download Berhasil', `File "${song.title}" berhasil diunduh ke perangkat Anda.`, 'success');
    } catch (err) {
      console.error('Gagal mengunduh audio:', err);
      showToast('Download Gagal', 'Terjadi kesalahan saat mengekspor file audio.', 'error');
    }
  }, [showToast]);

  // Playlist Operations
  const createPlaylist = useCallback((name: string, description?: string): Playlist => {
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}`,
      name: name.trim() || 'Playlist Baru',
      description: description?.trim() || '',
      songIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setPlaylists((prev) => [newPlaylist, ...prev]);
    showToast('Playlist Dibuat', newPlaylist.name, 'success');
    return newPlaylist;
  }, [showToast]);

  const updatePlaylist = useCallback((id: string, name: string, description?: string) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, name: name.trim() || p.name, description: description ?? p.description, updatedAt: Date.now() }
          : p
      )
    );
    showToast('Playlist Diperbarui', '', 'success');
  }, [showToast]);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    if (selectedPlaylistId === id) {
      setSelectedPlaylistId(null);
      setActiveView('pustaka');
    }
    showToast('Playlist Dihapus', '', 'info');
  }, [selectedPlaylistId, showToast]);

  const addSongToPlaylist = useCallback((playlistId: string, songId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          if (p.songIds.includes(songId)) return p;
          return {
            ...p,
            songIds: [...p.songIds, songId],
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
    showToast('Lagu Ditambahkan ke Playlist', '', 'success');
  }, [showToast]);

  const removeSongFromPlaylist = useCallback((playlistId: string, songId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          return {
            ...p,
            songIds: p.songIds.filter((id) => id !== songId),
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
    showToast('Lagu Dihapus dari Playlist', '', 'info');
  }, [showToast]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings, theme: 'light' }));
  }, []);

  const clearCache = useCallback(async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const k of keys) {
        await caches.delete(k);
      }
    }
    showToast('Cache Aplikasi Dibersihkan', '', 'success');
    recalculateStorage();
  }, [showToast, recalculateStorage]);

  const wipeAllData = useCallback(async () => {
    audioEngine.pause();
    setCurrentSong(null);
    setIsPlaying(false);
    setQueue([]);
    setSongs([]);
    setPlaylists([]);

    localStorage.removeItem(STORAGE_KEY_SONGS);
    localStorage.removeItem(STORAGE_KEY_PLAYLISTS);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_LAST_STATE);

    await clearAllIndexedDB();
    await clearCache();

    showToast('Semua Data Telah Dihapus', 'Aplikasi telah diatur ulang ke kondisi awal', 'info');
    recalculateStorage();
  }, [clearCache, showToast, recalculateStorage]);

  // Keyboard Shortcuts
  useEffect(() => {
    if (!settings.keyboardShortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Abaikan jika fokus pada input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, currentTime - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(duration, currentTime + 5));
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.05));
          break;
        case 'KeyN':
          e.preventDefault();
          playNext();
          break;
        case 'KeyP':
          e.preventDefault();
          playPrevious();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyS':
          e.preventDefault();
          toggleShuffle();
          break;
        case 'KeyR':
          e.preventDefault();
          cycleRepeat();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    settings.keyboardShortcutsEnabled,
    togglePlay,
    seek,
    currentTime,
    duration,
    changeVolume,
    volume,
    playNext,
    playPrevious,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
  ]);

  // Media Session action handlers
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', () => togglePlay());
        navigator.mediaSession.setActionHandler('pause', () => togglePlay());
        navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
        navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) seek(details.seekTime);
        });
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          seek(Math.max(0, currentTime - (details.seekOffset || 10)));
        });
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          seek(Math.min(duration, currentTime + (details.seekOffset || 10)));
        });
      } catch {
        // unsupported mediaSession actions in some browsers
      }
    }
  }, [togglePlay, playPrevious, playNext, seek, currentTime, duration]);

  const value: MusicContextType = {
    songs,
    playlists,
    currentSong,
    currentSongThumbnailUrl,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isShuffle,
    repeatMode,
    queue,
    queueIndex,

    activeView,
    setActiveView,
    selectedPlaylistId,
    setSelectedPlaylistId,
    isFullPlayerOpen,
    setIsFullPlayerOpen,
    isQueueOpen,
    setIsQueueOpen,
    isSpotifyModalOpen,
    setIsSpotifyModalOpen,

    playSong,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    changeVolume,
    toggleMute,
    setRate,
    toggleShuffle,
    cycleRepeat,

    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,

    eqPreset,
    eqGains,
    setEqPreset,
    setEqBandGain,

    sleepTimerMinutes,
    sleepTimerRemaining,
    setSleepTimer,

    addUploadedSong,
    addSpotifySong,
    updateSongMetadata,
    deleteSong,
    toggleFavorite,
    updateSongLyrics,
    downloadSongAudio,

    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,

    settings,
    updateSettings,
    storageStats,
    recalculateStorage,
    clearCache,
    wipeAllData,

    toasts,
    showToast,
    removeToast,
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic harus digunakan di dalam MusicProvider');
  }
  return context;
};
