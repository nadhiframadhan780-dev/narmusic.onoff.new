import React, { useEffect, useState } from 'react';
import { Song } from '../types';
import { getThumbnail } from '../utils/idb';
import { getGradientForText, getInitials } from '../utils/metadata';

interface SongCoverProps {
  song: Song;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadges?: boolean;
}

export const SongCover: React.FC<SongCoverProps> = ({
  song,
  className = '',
  size = 'md',
  showBadges = true,
}) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    if (song.sourceType === 'spotify' && song.thumbnailUrl) {
      setThumbUrl(song.thumbnailUrl);
      return;
    }

    if (song.thumbnailKey) {
      getThumbnail(song.thumbnailKey).then((blob) => {
        if (!active) return;
        if (blob) {
          createdUrl = URL.createObjectURL(blob);
          setThumbUrl(createdUrl);
        } else {
          setThumbUrl(null);
        }
      });
    } else {
      setThumbUrl(null);
    }

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [song.id, song.thumbnailKey, song.sourceType, song.thumbnailUrl]);

  const sizeClasses = {
    sm: 'w-10 h-10 text-xs rounded-lg',
    md: 'w-14 h-14 text-sm rounded-xl',
    lg: 'w-24 h-24 text-xl rounded-2xl',
    xl: 'w-48 h-48 sm:w-64 sm:h-64 text-4xl rounded-3xl',
  };

  const gradientStyle = song.defaultGradient
    ? { background: song.defaultGradient }
    : { background: getGradientForText(song.title) };

  return (
    <div
      className={`relative flex-shrink-0 flex items-center justify-center overflow-hidden shadow-md transition-transform duration-200 ${sizeClasses[size]} ${className}`}
      style={!thumbUrl ? gradientStyle : undefined}
    >
      {thumbUrl ? (
        <img
          src={thumbUrl}
          alt={song.title}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={() => setThumbUrl(null)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-2 text-white font-bold select-none drop-shadow">
          <span>{song.initials || getInitials(song.title)}</span>
        </div>
      )}

      {/* Badges */}
      {showBadges && song.sourceType === 'spotify' && (
        <div
          title="Spotify Track"
          className="absolute bottom-1 right-1 bg-[#1DB954] text-white p-0.5 rounded-full shadow"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </div>
      )}

      {showBadges && song.sourceType === 'folder' && (
        <div
          title="Folder Musik Perangkat"
          className="absolute bottom-1 right-1 bg-amber-500 text-white p-0.5 rounded-full shadow"
        >
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
      )}
    </div>
  );
};
