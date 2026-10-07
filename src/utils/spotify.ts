export interface SpotifyParseResult {
  isValid: boolean;
  type: 'track' | 'album' | 'playlist' | 'episode';
  id: string;
  canonicalUrl: string;
  embedUrl: string;
  title?: string;
  artist?: string;
  thumbnailUrl?: string;
}

export interface SpotifyOEmbedResponse {
  title?: string;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  html?: string;
  provider_name?: string;
}

/**
 * Deteksi dan ekstrak ID dan tipe dari URL atau URI Spotify
 */
export function parseSpotifyLink(input: string): { isValid: boolean; type?: 'track' | 'album' | 'playlist' | 'episode'; id?: string; canonicalUrl?: string; embedUrl?: string } {
  if (!input) return { isValid: false };
  const trimmed = input.trim();

  // Pola 1: URL Web https://open.spotify.com/(track|album|playlist|episode)/ID...
  const webRegex = /open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/i;
  const webMatch = trimmed.match(webRegex);
  if (webMatch) {
    const type = webMatch[1].toLowerCase() as 'track' | 'album' | 'playlist' | 'episode';
    const id = webMatch[2];
    return {
      isValid: true,
      type,
      id,
      canonicalUrl: `https://open.spotify.com/${type}/${id}`,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
    };
  }

  // Pola 2: Spotify URI format spotify:(track|album|playlist|episode):ID
  const uriRegex = /spotify:(track|album|playlist|episode):([a-zA-Z0-9]+)/i;
  const uriMatch = trimmed.match(uriRegex);
  if (uriMatch) {
    const type = uriMatch[1].toLowerCase() as 'track' | 'album' | 'playlist' | 'episode';
    const id = uriMatch[2];
    return {
      isValid: true,
      type,
      id,
      canonicalUrl: `https://open.spotify.com/${type}/${id}`,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
    };
  }

  return { isValid: false };
}

/**
 * Ambil metadata (judul, artis, gambar thumbnail) dari Spotify oEmbed
 * Endpoint resmi publik: https://open.spotify.com/oembed?url=... (Tanpa API Key)
 */
export async function fetchSpotifyMetadata(spotifyUrl: string): Promise<SpotifyParseResult> {
  const parsed = parseSpotifyLink(spotifyUrl);
  if (!parsed.isValid || !parsed.type || !parsed.id || !parsed.canonicalUrl || !parsed.embedUrl) {
    throw new Error('Format link Spotify tidak valid. Gunakan link seperti https://open.spotify.com/track/...');
  }

  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(parsed.canonicalUrl)}`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      throw new Error(`Gagal memuat metadata Spotify (Status ${response.status})`);
    }

    const data: SpotifyOEmbedResponse = await response.json();

    // Judul dari oEmbed seringkali berformat: "Nama Lagu" atau "Nama Lagu - Artis"
    let title = data.title || `Spotify ${parsed.type.toUpperCase()}`;
    let artist = 'Spotify Artist';

    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      title = parts[0].trim();
      artist = parts.slice(1).join(' - ').trim();
    } else if (title.includes(' by ')) {
      const parts = title.split(' by ');
      title = parts[0].trim();
      artist = parts.slice(1).join(' by ').trim();
    }

    return {
      isValid: true,
      type: parsed.type,
      id: parsed.id,
      canonicalUrl: parsed.canonicalUrl,
      embedUrl: parsed.embedUrl,
      title,
      artist,
      thumbnailUrl: data.thumbnail_url,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Koneksi gagal';
    // Fallback bila oEmbed gagal atau offline
    return {
      isValid: true,
      type: parsed.type,
      id: parsed.id,
      canonicalUrl: parsed.canonicalUrl,
      embedUrl: parsed.embedUrl,
      title: `Spotify ${parsed.type.toUpperCase()}: ${parsed.id.slice(0, 8)}`,
      artist: 'Spotify (Perlu Online)',
      thumbnailUrl: undefined,
    };
  }
}
