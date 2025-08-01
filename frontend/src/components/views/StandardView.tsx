import { memo } from 'react';
import type { CurrentState } from '../../types/plex';

interface StandardViewProps {
  currentState: CurrentState;
  animationsEnabled?: boolean;
  isDetailVisible?: boolean;
  isZoomed?: boolean;
}

export const StandardView = memo(function StandardView({ 
  currentState, 
  animationsEnabled = true,
  isDetailVisible = true,
  isZoomed = false
}: StandardViewProps) {
  const { metadata, isPaused } = currentState;
  
  const imageThumb = metadata.thumb || metadata.art || metadata.parentThumb || metadata.grandparentThumb || metadata.grandparentArt;
  const albumArtUrl = imageThumb ? `/api/image?thumb=${encodeURIComponent(imageThumb)}&width=400&height=400` : null;
  
  const isMusic = metadata.type === 'track';
  const isMovie = metadata.type === 'movie';
  const isEpisode = metadata.type === 'episode';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="max-w-2xl w-full">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Album Art */}
          <div className="relative flex-shrink-0">
            <div className={`bg-gray-800 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${
              isZoomed ? 'w-64 h-64 sm:w-72 sm:h-72' : 'w-48 h-48 sm:w-56 sm:h-56'
            }`}>
              {albumArtUrl ? (
                <img
                  src={albumArtUrl}
                  alt="Cover art"
                  className={`w-full h-full object-cover ${
                    animationsEnabled ? 'transition-transform duration-300 hover:scale-105' : ''
                  }`}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                <div className="text-5xl text-gray-600">
                  {isMusic ? '🎵' : isMovie ? '🎬' : isEpisode ? '📺' : '📀'}
                </div>
              </div>
              
              {isPaused && (
                <div className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center ${
                  animationsEnabled ? 'transition-opacity duration-200' : ''
                }`}>
                  <div className="text-white text-4xl">⏸</div>
                </div>
              )}
            </div>
          </div>

          {/* Track Info */}
          <div className={`flex-1 text-center sm:text-left transition-opacity duration-300 ${
            isDetailVisible ? 'opacity-100' : 'opacity-60'
          }`}>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">
              {metadata.title || 'Unknown Title'}
            </h1>
            
            {isMusic && (
              <>
                <h2 className="text-lg sm:text-xl text-gray-300 mb-1">
                  {metadata.grandparentTitle || 'Unknown Artist'}
                </h2>
                
                <h3 className="text-base sm:text-lg text-gray-400 mb-3">
                  {metadata.parentTitle || 'Unknown Album'}
                  {metadata.parentYear && (
                    <span className="ml-2 text-gray-500 text-sm">
                      ({metadata.parentYear})
                    </span>
                  )}
                </h3>
                
                {metadata.index && (
                  <div className="text-sm text-gray-500 mb-3">
                    Track {metadata.index}
                    {metadata.parentIndex && ` • Disc ${metadata.parentIndex}`}
                  </div>
                )}
              </>
            )}
            
            {isEpisode && (
              <>
                <h2 className="text-lg sm:text-xl text-gray-300 mb-1">
                  {metadata.grandparentTitle || 'Unknown Show'}
                </h2>
                
                <h3 className="text-base sm:text-lg text-gray-400 mb-3">
                  {metadata.parentTitle || `Season ${metadata.parentIndex || '?'}`}
                  {metadata.index && ` • Episode ${metadata.index}`}
                </h3>
              </>
            )}
            
            {isMovie && (
              <h3 className="text-base sm:text-lg text-gray-400 mb-3">
                {metadata.year && `Released ${metadata.year}`}
              </h3>
            )}

            {/* Summary */}
            {metadata.summary && (
              <p className="text-sm text-gray-500 line-clamp-3 mb-4 max-w-md">
                {metadata.summary}
              </p>
            )}

            {/* Play State */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full">
              <div className={`w-3 h-3 rounded-full ${
                isPaused ? 'bg-yellow-500' : 'bg-green-500'
              } ${animationsEnabled && !isPaused ? 'animate-pulse' : ''}`} />
              <span className="text-sm">
                {isPaused ? 'Paused' : 'Now Playing'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});