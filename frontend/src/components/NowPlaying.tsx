import { useState, useEffect } from 'react';
import { CurrentState, AudioQuality } from '../types/plex';

interface NowPlayingProps {
  state: CurrentState | null;
  isPaused: boolean;
}

function getImageUrl(thumb: string): string {
  return `/api/image?thumb=${encodeURIComponent(thumb)}`;
}

function formatAudioQuality(quality: AudioQuality): string {
  const parts: string[] = [quality.codec];

  // For lossless formats like FLAC, show sample rate / bit depth
  if (quality.sampleRate && quality.bitDepth) {
    const sampleRateKhz = (quality.sampleRate / 1000).toFixed(1).replace('.0', '');
    parts.push(`${sampleRateKhz}/${quality.bitDepth}`);
  } else if (quality.bitrate) {
    // For lossy formats, show bitrate
    parts.push(`${quality.bitrate}kbps`);
  }

  return parts.join(' ');
}

export function NowPlaying({ state, isPaused }: NowPlayingProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentThumb, setCurrentThumb] = useState<string | null>(null);

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
      <div className="flex flex-col items-center justify-center text-neutral-500 gap-3 animate-fade-in">
        <div className="text-6xl">🎵</div>
        <p className="text-lg">Waiting for music...</p>
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
      className="flex flex-col items-center gap-4 w-full animate-fade-in"
    >
      {/* Album Art - 480x480 for 800x480 Pi screen */}
      <div className="relative flex-shrink-0">
        <div
          className={`
            w-[440px] h-[440px]
            rounded-md shadow-2xl overflow-hidden
            transition-all duration-500 ease-out
          `}
        >
          {hasThumb ? (
            <>
              <img
                src={getImageUrl(metadata.thumb)}
                alt={`${metadata.parentTitle} album art`}
                className={`
                  w-full h-full object-cover
                  transition-all duration-500
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                  ${isPaused ? 'saturate-[0.08]' : 'saturate-100'}
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
            <div className={`
              w-full h-full flex items-center justify-center text-8xl text-neutral-600
              transition-all duration-500
              ${isPaused ? 'saturate-[0.08]' : 'saturate-100'}
            `}>
              🎵
            </div>
          )}
        </div>
      </div>

      {/* Track Info - sized for 320px remaining width on 800x480 screen */}
      <div className="flex flex-col gap-1 text-left min-w-0 flex-1">
        {/* Track Title */}
        <h1 className="text-2xl font-bold text-white truncate now-playing-text" style={{ maxWidth: 440 }}>
          {metadata.title}
        </h1>

        {/* Artist */}
        <p className="text-xl text-neutral-300 truncate" style={{ maxWidth: 440 }}>
          {metadata.grandparentTitle}
        </p>

        {/* Album */}
        <p className="text-lg text-neutral-500 truncate" style={{ maxWidth: 440 }}>
          {metadata.parentTitle}
          {metadata.parentYear && (
            <span className="text-neutral-600"> ({metadata.parentYear})</span>
          )}
        </p>

        {/* Audio Quality & Favorited */}
        {(metadata.audioQuality || metadata.isFavorited) && (
          <p className="text-sm text-neutral-600 flex items-center gap-2">
            {metadata.audioQuality && (
              <span>{formatAudioQuality(metadata.audioQuality)}</span>
            )}
            {metadata.isFavorited && (
              <span className="text-red-500">♥</span>
            )}
          </p>
        )}

        {/* Now Playing Indicator */}
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`
              w-2 h-2 rounded-full transition-colors duration-300
              ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}
            `}
          />
          <span className="text-xs text-neutral-500 uppercase tracking-wider">
            {isPaused ? 'Paused' : 'Now Playing'}
          </span>
        </div>
      </div>
    </div>
  );
}
