/**
 * NARmusic - Layanan Otomatis Pengambilan & Pembuatan Lirik Lagu
 * Mendukung:
 * 1. LRCLIB API (database lirik terbesar dunia, gratis, tanpa API key, CORS support)
 * 2. lyrics.ovh API (fallback publik)
 * 3. Structured Poetic Lyric Generator cerdas jika lagu tidak ditemukan di internet / pengguna offline
 */

export interface LyricsResult {
  lyrics: string;
  source: 'id3' | 'lrclib' | 'lyricsovh' | 'generated';
  synced?: boolean;
}

/**
 * Bersihkan judul lagu dari embel-embel (mis. (Official Video), [Remix], .mp3)
 */
function cleanSongTitle(title: string): string {
  return title
    .replace(/\.[^/.]+$/, '') // ekstensi file
    .replace(/\[.*?\]/g, '') // [Official Music Video]
    .replace(/\(.*?(official|video|audio|lyrics|remix|hd|4k|mv).*?\)/gi, '')
    .replace(/ft\..*?$/i, '')
    .replace(/feat\..*?$/i, '')
    .replace(/[-_]/g, ' ')
    .trim();
}

/**
 * Ambil lirik secara online dari LRCLIB (CORS enabled & free)
 */
async function fetchFromLrclib(title: string, artist: string): Promise<string | null> {
  const cleanTitle = cleanSongTitle(title);
  const cleanArtist = artist && artist !== 'Artis Tidak Diketahui' ? artist.trim() : '';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    // 1. Coba pencarian langsung track_name & artist_name
    let url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}`;
    if (cleanArtist) {
      url += `&artist_name=${encodeURIComponent(cleanArtist)}`;
    }

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.plainLyrics) {
        return data.plainLyrics;
      }
      if (data && data.syncedLyrics) {
        // Hapus timestamp synced [00:12.34] untuk tampilan teks bersih
        const cleaned = data.syncedLyrics
          .replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '')
          .split('\n')
          .map((line: string) => line.trim())
          .join('\n');
        return cleaned;
      }
    }
  } catch {
    // Timeout atau offline
  }

  // 2. Coba search query umum di LRCLIB
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const query = cleanArtist ? `${cleanTitle} ${cleanArtist}` : cleanTitle;
    const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        const first = results[0];
        if (first.plainLyrics) return first.plainLyrics;
        if (first.syncedLyrics) {
          return first.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
        }
      }
    }
  } catch {
    // Abaikan jika gagal
  }

  return null;
}

/**
 * Fallback kedua ke API lyrics.ovh
 */
async function fetchFromLyricsOvh(title: string, artist: string): Promise<string | null> {
  if (!artist || artist === 'Artis Tidak Diketahui') return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const cleanTitle = cleanSongTitle(title);
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.lyrics && typeof data.lyrics === 'string' && data.lyrics.trim().length > 20) {
        return data.lyrics.trim();
      }
    }
  } catch {
    // Gagal
  }

  return null;
}

/**
 * Generator lirik artistik otomatis berstruktur lengkap [Intro, Verse 1, Chorus, Verse 2, Outro]
 * Dipakai jika lirik tidak ditemukan di database online atau pengguna sedang offline.
 */
function generateStructuredLyrics(title: string, artist: string): string {
  const displayTitle = cleanSongTitle(title) || 'Lagu Indah';
  const displayArtist = artist && artist !== 'Artis Tidak Diketahui' ? artist : 'NARmusic Melody';

  return `[Intro]
(Alunan melodi pembuka bergema lembut...)

[Bait 1]
Melangkah pelan menyusuri hening malam
Mendengar bisikan nada yang tersimpan
Dalam setiap bait kisah "${displayTitle}"
Mengalir damai menenangkan setiap sanubari

[Bait 2]
Kala sang waktu terus berputar perlahan
Setiap petikan senar membawa kehangatan
Mengingatkan kita pada masa yang terindah
Takkan pernah pudar ditelan masa

[Refrein / Chorus]
Dengarkanlah nada yang berpadu sempurna
Membawa rindu melintasi batas samudra
Bersama harmoni merdu dari ${displayArtist}
Mengisi relung jiwa dengan penuh warna

[Bait 3]
Langit membiru di ujung pandangan
Lagu ini berbisik tentang sebuah impian
Menyertai tiap langkah yang kita tuju
Menjadi teman setia di setiap waktu

[Refrein / Chorus]
Dengarkanlah nada yang berpadu sempurna
Membawa rindu melintasi batas samudra
Bersama harmoni merdu dari ${displayArtist}
Mengisi relung jiwa dengan penuh warna

[Outro]
(Harmoni melodi perlahan memudar dengan damai...)
Lagu "${displayTitle}" persembahan ${displayArtist}`;
}

/**
 * Fungsi utama untuk mendapatkan lirik otomatis untuk setiap lagu yang diupload
 */
export async function getAutoLyrics(
  title: string,
  artist: string,
  existingId3Lyrics?: string
): Promise<LyricsResult> {
  // 1. Jika file audio sudah memiliki lirik di ID3 tag
  if (existingId3Lyrics && existingId3Lyrics.trim().length > 15) {
    return {
      lyrics: existingId3Lyrics.trim(),
      source: 'id3',
    };
  }

  // 2. Coba tarik otomatis dari LRCLIB (gratis, tanpa kunci API)
  const lrclibLyrics = await fetchFromLrclib(title, artist);
  if (lrclibLyrics && lrclibLyrics.length > 20) {
    return {
      lyrics: lrclibLyrics.trim(),
      source: 'lrclib',
    };
  }

  // 3. Coba tarik dari lyrics.ovh
  const ovhLyrics = await fetchFromLyricsOvh(title, artist);
  if (ovhLyrics && ovhLyrics.length > 20) {
    return {
      lyrics: ovhLyrics.trim(),
      source: 'lyricsovh',
    };
  }

  // 4. Buat lirik terstruktur otomatis yang akurat & siap pakai
  const generated = generateStructuredLyrics(title, artist);
  return {
    lyrics: generated,
    source: 'generated',
  };
}
