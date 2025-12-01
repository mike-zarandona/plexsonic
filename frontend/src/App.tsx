import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useColorExtraction } from './hooks/useColorExtraction';
import { NowPlaying } from './components/NowPlaying';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DynamicBackground } from './components/DynamicBackground';

type LayoutMode = 'centered' | 'left';

const LAYOUT_STORAGE_KEY = 'plexsonic-layout';

function getImageUrl(thumb: string): string {
  return `/api/image?thumb=${encodeURIComponent(thumb)}`;
}

function AppContent() {
  const { state, connectionStatus } = useWebSocket();

  // Layout mode state with localStorage persistence
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return (saved === 'centered' || saved === 'left') ? saved : 'centered';
  });

  // Persist layout preference
  useEffect(() => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, layoutMode);
  }, [layoutMode]);

  // Toggle layout on tap/click anywhere
  const toggleLayout = useCallback(() => {
    setLayoutMode(prev => prev === 'centered' ? 'left' : 'centered');
  }, []);

  // Extract colors from current album art
  const imageUrl = state?.metadata?.thumb ? getImageUrl(state.metadata.thumb) : null;
  const colors = useColorExtraction(imageUrl);
  const isPaused = state?.isPaused ?? false;

  // Show loading spinner while initially connecting
  if (connectionStatus === 'connecting' && state === null) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <DynamicBackground colors={colors} isPaused={false} />
        <div className="flex flex-col items-center gap-4 text-neutral-500">
          <div className="w-12 h-12 border-4 border-neutral-700 border-t-plex-orange rounded-full animate-spin" />
          <p className="text-lg">Connecting to server...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white flex flex-col relative cursor-pointer select-none"
      onClick={toggleLayout}
    >
      <DynamicBackground colors={colors} isPaused={isPaused} />
      <main className={`
        flex-1 flex pt-8 pr-6 pb-6
        ${layoutMode === 'centered' ? 'items-start justify-center pl-6' : 'items-start justify-start pl-5'}
      `}>
        <NowPlaying state={state} isPaused={isPaused} layoutMode={layoutMode} />
      </main>
      <ConnectionStatus status={connectionStatus} />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
