import React from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { NowPlaying } from './components/NowPlaying';
import { ConnectionStatus } from './components/ConnectionStatus';

function App() {
  const { currentState, connectionStatus, reconnectAttempts } = useWebSocket();

  return (
    <div className="min-h-screen bg-black">
      <ConnectionStatus 
        status={connectionStatus} 
        reconnectAttempts={reconnectAttempts} 
      />

      {currentState ? (
        <NowPlaying currentState={currentState} />
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-400 mb-2">
              PlexSonic
            </h1>
            <p className="text-gray-600">
              {connectionStatus === 'connected' 
                ? 'Waiting for media playback...' 
                : 'Connecting to server...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;