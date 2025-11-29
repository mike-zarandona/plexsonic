import { useWebSocket } from './hooks/useWebSocket';
import { NowPlaying } from './components/NowPlaying';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { state, connectionStatus } = useWebSocket();

  // Show loading spinner while initially connecting
  if (connectionStatus === 'connecting' && state === null) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-neutral-500">
          <div className="w-12 h-12 border-4 border-neutral-700 border-t-plex-orange rounded-full animate-spin" />
          <p className="text-lg">Connecting to server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <NowPlaying state={state} isPaused={state?.isPaused ?? false} />
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
