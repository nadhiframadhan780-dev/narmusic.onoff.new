export type SourceType = 'local' | 'folder' | 'spotify';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  sourceType: SourceType;
  fileKey?: string; // key in IndexedDB for audio Blob
  thumbnailKey?: string; // key in IndexedDB for custom/extracted image Blob
  thumbnailUrl?: string; // cached object URL or external URL (Spotify)
  defaultGradient?: string; // css gradient for fallback thumbnail
  initials?: string;
  lyrics?: string;
  spotifyId?: string;
  spotifyUri?: string;
  spotifyUrl?: string;
  spotifyType?: 'track' | 'album' | 'playlist' | 'episode';
  folderRelativePath?: string;
  dateAdded: number; // timestamp
  playCount: number;
  lastPlayed?: number; // timestamp
  isFavorite: boolean;
  sizeBytes?: number;
  mimeType?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
  coverCollage?: string[]; // up to 4 thumbnail URLs
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface EqualizerPreset {
  name: string;
  gains: [number, number, number, number, number]; // 60Hz, 230Hz, 910Hz, 3600Hz, 14000Hz in dB (-12 to +12)
}

export interface AppSettings {
  theme: 'light';
  accentColor: 'teal' | 'cyan' | 'mint' | 'emerald';
  libraryViewMode: 'grid' | 'list';
  gridSize: 'small' | 'medium' | 'large';
  crossfadeEnabled: boolean;
  crossfadeDuration: number; // 1 to 8 seconds
  volumeNormalization: boolean;
  defaultEqPreset: string;
  customEqGains: [number, number, number, number, number];
  visualizerQuality: 'high' | 'medium' | 'low';
  visualizerStyle: 'bars' | 'wave' | 'circles';
  autoResume: boolean;
  keyboardShortcutsEnabled: boolean;
}

export interface StorageStats {
  usedBytes: number;
  quotaBytes: number;
  usedFormatted: string;
  quotaFormatted: string;
  percentUsed: number;
  audioBytes: number;
  thumbnailBytes: number;
  songCount: number;
  isPersisted: boolean;
}

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}
