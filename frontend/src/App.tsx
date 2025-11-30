import { useWebSocket } from './hooks/useWebSocket';
import { useColorExtraction } from './hooks/useColorExtraction';
import { NowPlaying } from './components/NowPlaying';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DynamicBackground } from './components/DynamicBackground';

function getImageUrl(thumb: string): string {
  return `/api/image?thumb=${encodeURIComponent(thumb)}`;
}

function AppContent() {
  const { state, connectionStatus } = useWebSocket();

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
    <div className="min-h-screen text-white flex flex-col relative">
      <DynamicBackground colors={colors} isPaused={isPaused} />
      <main className="flex-1 flex items-center justify-center p-4">
        <NowPlaying state={state} isPaused={isPaused} />
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
