import React, { memo } from 'react';
import type { CurrentState } from '../types/plex';

interface NowPlayingProps {
  currentState: CurrentState;
}

export const NowPlaying = memo(function NowPlaying({ currentState }: NowPlayingProps) {
  const { metadata, isPaused } = currentState;
  
  // For now, using a placeholder for album art URL
  // This will be replaced with actual Plex image URL in Phase 2
  const albumArtUrl = metadata.thumb 
    ? `/api/image?thumb=${encodeURIComponent(metadata.thumb)}`
    : '/placeholder-album.png';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-4xl w-full">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Album Art */}
          <div className="relative group">
            <div className="w-64 h-64 md:w-80 md:h-80 bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
              <img
                src={albumArtUrl}
                alt={`${metadata.parentTitle} - ${metadata.grandparentTitle}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-album.png';
                }}
              />
              {isPaused && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-6xl">⏸</div>
                </div>
              )}
            </div>
          </div>

          {/* Track Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {metadata.title}
            </h1>
            
            <h2 className="text-xl md:text-2xl text-gray-300 mb-1">
              {metadata.grandparentTitle}
            </h2>
            
            <h3 className="text-lg md:text-xl text-gray-400 mb-4">
              {metadata.parentTitle}
              {metadata.parentYear && (
                <span className="ml-2 text-gray-500">
                  ({metadata.parentYear})
                </span>
              )}
            </h3>

            {/* Additional Info */}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-500">
              <div>
                Track {metadata.index}
                {metadata.parentIndex && ` • Disc ${metadata.parentIndex}`}
              </div>
              {metadata.ratingCount > 0 && (
                <div>Rating: {metadata.ratingCount}</div>
              )}
            </div>

            {/* Play State */}
            <div className="mt-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full">
                <div className={`w-3 h-3 rounded-full ${
                  isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'
                }`} />
                <span className="text-sm">
                  {isPaused ? 'Paused' : 'Now Playing'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});