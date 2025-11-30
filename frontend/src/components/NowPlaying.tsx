import { useState, useEffect } from 'react';
import { CurrentState } from '../types/plex';

interface NowPlayingProps {
  state: CurrentState | null;
  isPaused: boolean;
}

function getImageUrl(thumb: string): string {
  return `/api/image?thumb=${encodeURIComponent(thumb)}`;
}

export function NowPlaying({ state, isPaused }: NowPlayingProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentThumb, setCurrentThumb] = useState<string | null>(null);

  // Debug logging
  console.log('[NowPlaying] Render - state:', state, 'isPaused:', isPaused);

  // Reset image loaded state when thumb changes
  useEffect(() => {
    if (state?.metadata?.thumb !== currentThumb) {
      setImageLoaded(false);
      setCurrentThumb(state?.metadata?.thumb ?? null);
    }
  }, [state?.metadata?.thumb, currentThumb]);

  // Nothing playing state
  if (!state || !state.metadata) {
    return (
      <div className="flex flex-col items-center justify-center text-neutral-500 gap-4 animate-fade-in">
        <div className="text-8xl">🎵</div>
        <p className="text-xl">Waiting for music...</p>
      </div>
    );
  }

  const { metadata } = state;
  const hasThumb = metadata.thumb && metadata.thumb.length > 0;
  // Use ratingKey or title as unique identifier for track
  const trackKey = `${metadata.grandparentTitle}-${metadata.parentTitle}-${metadata.title}`;

  return (
    <div
      key={trackKey}
      className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 max-w-4xl w-full animate-fade-in"
    >
      {/* Album Art */}
      <div className="relative flex-shrink-0">
        <div
          className={`
            w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96
            rounded-lg shadow-2xl overflow-hidden
            bg-neutral-800
            transition-all duration-300 ease-out
            ${isPaused ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'}
          `}
        >
          {hasThumb ? (
            <>
              <img
                src={getImageUrl(metadata.thumb)}
                alt={`${metadata.parentTitle} album art`}
                className={`
                  w-full h-full object-cover
                  transition-opacity duration-500
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                `}
                loading="eager"
                onLoad={() => setImageLoaded(true)}
              />
              {/* Loading placeholder */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-6xl text-neutral-700 animate-pulse">
                  🎵
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl text-neutral-600">
              🎵
            </div>
          )}
        </div>

        {/* Paused Overlay */}
        <div
          className={`
            absolute inset-0 flex items-center justify-center
            bg-black/40 rounded-lg
            transition-opacity duration-300
            ${isPaused ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          <svg
            className="w-20 h-20 text-white/80"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        </div>
      </div>

      {/* Track Info */}
      <div className="flex flex-col gap-2 sm:gap-3 text-center sm:text-left min-w-0 flex-1">
        {/* Track Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white truncate now-playing-text">
          {metadata.title}
        </h1>

        {/* Artist */}
        <p className="text-xl sm:text-2xl lg:text-3xl text-neutral-300 truncate">
          {metadata.grandparentTitle}
        </p>

        {/* Album */}
        <p className="text-lg sm:text-xl text-neutral-500 truncate">
          {metadata.parentTitle}
          {metadata.parentYear && (
            <span className="text-neutral-600"> ({metadata.parentYear})</span>
          )}
        </p>

        {/* Now Playing Indicator */}
        <div className="flex items-center gap-2 mt-2 sm:mt-4 justify-center sm:justify-start">
          <span
            className={`
              w-2 h-2 rounded-full transition-colors duration-300
              ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}
            `}
          />
          <span className="text-sm text-neutral-500 uppercase tracking-wider">
            {isPaused ? 'Paused' : 'Now Playing'}
          </span>
        </div>
      </div>
    </div>
  );
}
