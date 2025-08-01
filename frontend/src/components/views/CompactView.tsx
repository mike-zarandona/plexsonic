import { memo } from 'react';
import type { CurrentState } from '../../types/plex';
import { LazyImage } from '../LazyImage';

interface CompactViewProps {
  currentState: CurrentState;
}

export const CompactView = memo(function CompactView({ currentState }: CompactViewProps) {
  const { metadata, isPaused } = currentState;
  
  const imageThumb = metadata.thumb || metadata.art || metadata.parentThumb || metadata.grandparentThumb || metadata.grandparentArt;
  const albumArtUrl = imageThumb ? `/api/image?thumb=${encodeURIComponent(imageThumb)}&width=200&height=200` : null;
  
  const isMusic = metadata.type === 'track';
  const isMovie = metadata.type === 'movie';
  const isEpisode = metadata.type === 'episode';

  return (
    <div className="flex items-center min-h-screen p-4 bg-black">
      <div className="w-full max-w-sm mx-auto">
        {/* Album Art - Small and centered */}
        <div className="relative mb-4">
          <div className="w-32 h-32 mx-auto bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            {albumArtUrl ? (
              <LazyImage
                src={albumArtUrl}
                alt="Cover art"
                className="w-full h-full"
                fallbackClassName="flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900"
                fallbackContent={
                  <div className="text-3xl text-gray-600">
                    {isMusic ? '🎵' : isMovie ? '🎬' : isEpisode ? '📺' : '📀'}
                  </div>
                }
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                <div className="text-3xl text-gray-600">
                  {isMusic ? '🎵' : isMovie ? '🎬' : isEpisode ? '📺' : '📀'}
                </div>
              </div>
            )}
            
            {isPaused && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <div className="text-white text-2xl">⏸</div>
              </div>
            )}
          </div>
        </div>

        {/* Track Info - Large, readable text */}
        <div className="text-center space-y-2">
          <h1 className="text-lg font-bold leading-tight line-clamp-2">
            {metadata.title || 'Unknown Title'}
          </h1>
          
          {isMusic && (
            <>
              <h2 className="text-base text-gray-300 line-clamp-1">
                {metadata.grandparentTitle || 'Unknown Artist'}
              </h2>
              <h3 className="text-sm text-gray-400 line-clamp-1">
                {metadata.parentTitle || 'Unknown Album'}
              </h3>
            </>
          )}
          
          {isEpisode && (
            <>
              <h2 className="text-base text-gray-300 line-clamp-1">
                {metadata.grandparentTitle || 'Unknown Show'}
              </h2>
              <h3 className="text-sm text-gray-400 line-clamp-1">
                S{metadata.parentIndex || '?'}E{metadata.index || '?'}
              </h3>
            </>
          )}
          
          {isMovie && (
            <h3 className="text-sm text-gray-400">
              {metadata.year || 'Unknown Year'}
            </h3>
          )}

          {/* Play State - Simple indicator */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full text-xs">
              <div className={`w-2 h-2 rounded-full ${
                isPaused ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
              <span>{isPaused ? 'Paused' : 'Playing'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});