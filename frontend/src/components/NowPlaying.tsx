import React, { memo } from 'react';
import type { CurrentState } from '../types/plex';

interface NowPlayingProps {
  currentState: CurrentState;
}

export const NowPlaying = memo(function NowPlaying({ currentState }: NowPlayingProps) {
  const { metadata, isPaused } = currentState;
  
  // Debug: Log all metadata to see what image fields are available
  console.log('DEBUG - Full metadata:', JSON.stringify(metadata, null, 2));
  console.log('DEBUG - Available image fields:', {
    thumb: metadata.thumb,
    art: metadata.art,
    parentThumb: metadata.parentThumb,
    grandparentThumb: metadata.grandparentThumb,
    grandparentArt: metadata.grandparentArt
  });
  
  // Try multiple image sources in order of preference
  const imageThumb = metadata.thumb || metadata.art || metadata.parentThumb || metadata.grandparentThumb || metadata.grandparentArt;
  
  // Build album art URL with backend image proxy
  const albumArtUrl = imageThumb 
    ? `/api/image?thumb=${encodeURIComponent(imageThumb)}`
    : null;
    
  console.log('DEBUG - Image URL:', albumArtUrl);
  
  // Determine media type for better display
  const isMusic = metadata.type === 'track';
  const isMovie = metadata.type === 'movie';
  const isEpisode = metadata.type === 'episode';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-4xl w-full">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Album Art */}
          <div className="relative group">
            <div className="w-64 h-64 md:w-80 md:h-80 bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
              {albumArtUrl ? (
                <img
                  src={albumArtUrl}
                  alt={`${metadata.parentTitle || metadata.title} cover`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              
              {/* Fallback when no image or image fails to load */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                <div className="text-6xl text-gray-600">
                  {isMusic ? '🎵' : isMovie ? '🎬' : isEpisode ? '📺' : '📀'}
                </div>
              </div>
              
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
              {metadata.title || 'Unknown Title'}
            </h1>
            
            {isMusic && (
              <>
                <h2 className="text-xl md:text-2xl text-gray-300 mb-1">
                  {metadata.grandparentTitle || 'Unknown Artist'}
                </h2>
                
                <h3 className="text-lg md:text-xl text-gray-400 mb-4">
                  {metadata.parentTitle || 'Unknown Album'}
                  {metadata.parentYear && (
                    <span className="ml-2 text-gray-500">
                      ({metadata.parentYear})
                    </span>
                  )}
                </h3>
              </>
            )}
            
            {isEpisode && (
              <>
                <h2 className="text-xl md:text-2xl text-gray-300 mb-1">
                  {metadata.grandparentTitle || 'Unknown Show'}
                </h2>
                
                <h3 className="text-lg md:text-xl text-gray-400 mb-4">
                  {metadata.parentTitle || `Season ${metadata.parentIndex || '?'}`}
                </h3>
              </>
            )}
            
            {isMovie && metadata.year && (
              <h3 className="text-lg md:text-xl text-gray-400 mb-4">
                Released {metadata.year}
              </h3>
            )}

            {/* Additional Info */}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-500">
              {isMusic && metadata.index && (
                <div>
                  Track {metadata.index}
                  {metadata.parentIndex && ` • Disc ${metadata.parentIndex}`}
                </div>
              )}
              
              {isEpisode && metadata.index && (
                <div>
                  Episode {metadata.index}
                </div>
              )}
              
              {metadata.summary && (
                <div className="max-w-lg text-xs text-gray-600 line-clamp-2">
                  {metadata.summary}
                </div>
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