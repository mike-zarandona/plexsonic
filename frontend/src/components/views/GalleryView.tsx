import { memo } from 'react';
import type { CurrentState } from '../../types/plex';

interface GalleryViewProps {
  currentState: CurrentState;
  animationsEnabled?: boolean;
  isDetailVisible?: boolean;
  isZoomed?: boolean;
}

export const GalleryView = memo(function GalleryView({ 
  currentState, 
  animationsEnabled = true,
  isDetailVisible = true,
  isZoomed = false
}: GalleryViewProps) {
  const { metadata, isPaused } = currentState;
  
  const imageThumb = metadata.thumb || metadata.art || metadata.parentThumb || metadata.grandparentThumb || metadata.grandparentArt;
  const albumArtUrl = imageThumb ? `/api/image?thumb=${encodeURIComponent(imageThumb)}&width=600&height=600` : null;
  
  const isMusic = metadata.type === 'track';
  const isMovie = metadata.type === 'movie';
  const isEpisode = metadata.type === 'episode';

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Large Album Art */}
          <div className="relative">
            <div className={`mx-auto bg-gray-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ${
              isZoomed ? 'aspect-square max-w-2xl' : 'aspect-square max-w-lg'
            }`}>
              {albumArtUrl ? (
                <img
                  src={albumArtUrl}
                  alt="Cover art"
                  className={`w-full h-full object-cover ${
                    animationsEnabled ? 'transition-all duration-500 hover:scale-102' : ''
                  }`}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                <div className="text-8xl text-gray-600">
                  {isMusic ? '🎵' : isMovie ? '🎬' : isEpisode ? '📺' : '📀'}
                </div>
              </div>
              
              {isPaused && (
                <div className={`absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center ${
                  animationsEnabled ? 'transition-all duration-300' : ''
                }`}>
                  <div className="text-white text-8xl opacity-90">⏸</div>
                </div>
              )}
            </div>
            
            {/* Visual effects backdrop */}
            {albumArtUrl && animationsEnabled && (
              <div 
                className="absolute inset-0 -z-10 scale-110 blur-3xl opacity-20"
                style={{
                  backgroundImage: `url(${albumArtUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
            )}
          </div>

          {/* Detailed Info Panel */}
          <div className={`space-y-6 transition-all duration-300 ${
            isDetailVisible ? 'opacity-100 translate-x-0' : 'opacity-40 translate-x-4'
          }`}>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {metadata.title || 'Unknown Title'}
              </h1>
              
              {isMusic && (
                <>
                  <h2 className="text-2xl lg:text-3xl text-gray-300 mb-2">
                    {metadata.grandparentTitle || 'Unknown Artist'}
                  </h2>
                  
                  <h3 className="text-xl lg:text-2xl text-gray-400 mb-4">
                    {metadata.parentTitle || 'Unknown Album'}
                    {metadata.parentYear && (
                      <span className="ml-3 text-gray-500 text-lg">
                        ({metadata.parentYear})
                      </span>
                    )}
                  </h3>
                </>
              )}
              
              {isEpisode && (
                <>
                  <h2 className="text-2xl lg:text-3xl text-gray-300 mb-2">
                    {metadata.grandparentTitle || 'Unknown Show'}
                  </h2>
                  
                  <h3 className="text-xl lg:text-2xl text-gray-400 mb-4">
                    {metadata.parentTitle || `Season ${metadata.parentIndex || '?'}`}
                    {metadata.index && ` • Episode ${metadata.index}`}
                  </h3>
                </>
              )}
              
              {isMovie && (
                <h3 className="text-xl lg:text-2xl text-gray-400 mb-4">
                  {metadata.year && `Released ${metadata.year}`}
                </h3>
              )}
            </div>

            {/* Extended Metadata */}
            <div className="space-y-4">
              {metadata.summary && (
                <div>
                  <h4 className="text-lg font-semibold mb-2 text-gray-300">Description</h4>
                  <p className="text-gray-400 leading-relaxed line-clamp-4">
                    {metadata.summary}
                  </p>
                </div>
              )}
              
              {isMusic && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {metadata.index && (
                    <div>
                      <span className="text-gray-500">Track</span>
                      <div className="text-gray-300">{metadata.index}</div>
                    </div>
                  )}
                  
                  {metadata.parentIndex && (
                    <div>
                      <span className="text-gray-500">Disc</span>
                      <div className="text-gray-300">{metadata.parentIndex}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Play State */}
            <div className="flex items-center gap-4">
              <div className={`inline-flex items-center gap-3 px-6 py-3 bg-gray-800 rounded-full ${
                animationsEnabled ? 'transition-all duration-200 hover:bg-gray-700' : ''
              }`}>
                <div className={`w-4 h-4 rounded-full ${
                  isPaused ? 'bg-yellow-500' : 'bg-green-500'
                } ${animationsEnabled && !isPaused ? 'animate-pulse' : ''}`} />
                <span className="text-base font-medium">
                  {isPaused ? 'Paused' : 'Now Playing'}
                </span>
              </div>
              
              {/* Additional status indicators */}
              <div className="text-sm text-gray-500">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});