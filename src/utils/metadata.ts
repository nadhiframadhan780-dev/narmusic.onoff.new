import jsmediatags from 'jsmediatags';
import { getAutoLyrics } from './lyricsService';

export interface ParsedAudioMetadata {
  title: string;
  artist: string;
  album: string;
  duration: number;
  pictureBlob: Blob | null;
  lyrics: string;
}

// Koleksi gradien tema tosca / cyan / mint untuk thumbnail otomatis
const GRADIENT_PALETTES = [
  ['#06B6D4', '#14B8A6'], // cyan to tosca
  ['#14B8A6', '#0D9488'], // tosca to deep tosca
  ['#0D9488', '#0B1F1E'], // deep tosca to dark
  ['#2DD4BF', '#0891B2'], // bright mint to ocean cyan
  ['#6EE7B7', '#0D9488'], // soft mint to tosca
  ['#0EA5E9', '#14B8A6'], // sky to teal
];

/**
 * Format detik menjadi mm:ss atau hh:mm:ss
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Format bytes ke MB / GB
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Buat inisial dari string judul/artis
 */
export function getInitials(text: string): string {
  if (!text) return '🎵';
  const clean = text.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Pilih gradien konsisten berdasarkan hash teks
 */
export function getGradientForText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENT_PALETTES.length;
  const [c1, c2] = GRADIENT_PALETTES[index];
  return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
}

/**
 * Generate thumbnail default menggunakan HTML Canvas
 * Berisi gradien tosca unik + inisial judul + aksen gelombang suara
 */
export function generateDefaultCoverBlob(title: string, artist: string): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      // Fallback 1x1 blob jika context tidak tersedia
      resolve(new Blob([], { type: 'image/png' }));
      return;
    }

    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const pair = GRADIENT_PALETTES[Math.abs(hash) % GRADIENT_PALETTES.length];

    // Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, 400, 400);
    gradient.addColorStop(0, pair[0]);
    gradient.addColorStop(1, pair[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 400);

    // Decorative Sound Wave Curves in Background
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 4;
    for (let r = 80; r <= 220; r += 35) {
      ctx.beginPath();
      ctx.arc(200, 200, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Central Glass Badge
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(200, 200, 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Draw Initials
    const initials = getInitials(title);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px "Plus Jakarta Sans", "Poppins", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.fillText(initials, 200, 195);

    // Subtitle note
    ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
    ctx.shadowBlur = 4;
    const cleanArtist = artist && artist !== 'Artis Tidak Diketahui' ? artist.slice(0, 22) : 'NARmusic';
    ctx.fillText(cleanArtist, 200, 340);

    canvas.toBlob(
      (blob) => {
        resolve(blob || new Blob([], { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.88
    );
  });
}

/**
 * Resize dan kompres gambar yang diunggah pengguna ke maksimal 400x400 JPEG/WebP
 */
export async function resizeAndCompressImage(fileOrBlob: Blob | File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxSize = 400;
      let width = img.width;
      let height = img.height;

      // Pertahankan rasio atau potong persegi tengah (square center crop)
      const minDimension = Math.min(width, height);
      const sx = (width - minDimension) / 2;
      const sy = (height - minDimension) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = maxSize;
      canvas.height = maxSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(fileOrBlob);
        return;
      }

      ctx.drawImage(img, sx, sy, minDimension, minDimension, 0, 0, maxSize, maxSize);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(fileOrBlob);
          }
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal memuat gambar untuk dikompresi'));
    };

    img.src = url;
  });
}

/**
 * Ambil durasi audio secara akurat menggunakan Audio element sementara
 */
export function getAudioDuration(file: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      audio.remove();
    };

    audio.onloadedmetadata = () => {
      const dur = isFinite(audio.duration) ? Math.round(audio.duration) : 0;
      cleanup();
      resolve(dur);
    };

    audio.onerror = () => {
      cleanup();
      resolve(0);
    };

    // Timeout jika file tidak memicu metadata dalam 5 detik
    setTimeout(() => {
      cleanup();
      resolve(0);
    }, 5000);
  });
}

/**
 * Baca metadata ID3 (judul, artis, album, gambar APIC, lirik) menggunakan jsmediatags
 */
export async function parseAudioFileMetadata(file: File | Blob, defaultFileName: string): Promise<ParsedAudioMetadata> {
  // 1. Ambil durasi aktual
  const duration = await getAudioDuration(file);

  // Bersihkan nama file sebagai fallback
  const cleanFileName = defaultFileName
    .replace(/\.[^/.]+$/, '')
    .replace(/_/g, ' ')
    .trim();

  return new Promise((resolve) => {
    try {
      jsmediatags.read(file, {
        onSuccess: async (tagResult) => {
          const tags = tagResult.tags || {};
          const title = (tags.title && String(tags.title).trim()) || cleanFileName || 'Lagu Tanpa Judul';
          const artist = (tags.artist && String(tags.artist).trim()) || 'Artis Tidak Diketahui';
          const album = (tags.album && String(tags.album).trim()) || 'Album Tunggal';

          let rawLyrics: string | undefined;
          if (tags.lyrics && typeof tags.lyrics === 'object' && tags.lyrics.lyrics) {
            rawLyrics = tags.lyrics.lyrics;
          } else if (typeof tags.lyrics === 'string') {
            rawLyrics = tags.lyrics;
          }

          // Otomatis cari atau hasilkan lirik lagu secara akurat
          const lyricsResult = await getAutoLyrics(title, artist, rawLyrics);

          // Ambil gambar cover (APIC tag)
          let pictureBlob: Blob | null = null;
          if (tags.picture && tags.picture.data && tags.picture.format) {
            try {
              const byteArray = new Uint8Array(tags.picture.data);
              pictureBlob = new Blob([byteArray], { type: tags.picture.format });
            } catch (err) {
              console.warn('Gagal mengekstrak picture dari ID3:', err);
            }
          }

          resolve({
            title,
            artist,
            album,
            duration,
            pictureBlob,
            lyrics: lyricsResult.lyrics,
          });
        },
        onError: async () => {
          // Fallback bila ID3 tag tidak ada / rusak
          const title = cleanFileName || 'Lagu Tanpa Judul';
          const artist = 'Artis Tidak Diketahui';
          const lyricsResult = await getAutoLyrics(title, artist);
          resolve({
            title,
            artist,
            album: 'Lokal',
            duration,
            pictureBlob: null,
            lyrics: lyricsResult.lyrics,
          });
        },
      });
    } catch {
      (async () => {
        const title = cleanFileName || 'Lagu Tanpa Judul';
        const artist = 'Artis Tidak Diketahui';
        const lyricsResult = await getAutoLyrics(title, artist);
        resolve({
          title,
          artist,
          album: 'Lokal',
          duration,
          pictureBlob: null,
          lyrics: lyricsResult.lyrics,
        });
      })();
    }
  });
}
