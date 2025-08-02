import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useDisplayMode } from './hooks/useDisplayMode';
import { useConfig } from './hooks/useConfig';
import { GestureWrapper } from './components/GestureWrapper';
import { ConnectionStatus } from './components/ConnectionStatus';
import { Settings } from './components/Settings';

function App() {
  const { currentState, connectionStatus, reconnectAttempts } = useWebSocket();
  const { config, setTheme, setDisplayMode, setGesturesEnabled, setAnimationsEnabled, resetConfig } = useConfig();
  const displayConfig = useDisplayMode(config);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-theme-primary">
      <ConnectionStatus 
        status={connectionStatus} 
        reconnectAttempts={reconnectAttempts} 
      />

      {/* Settings Button */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="fixed top-4 right-4 z-40 p-2 bg-theme-secondary hover:bg-theme-tertiary rounded-full transition-colors"
        aria-label="Open Settings"
      >
        <svg className="w-5 h-5 text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {currentState ? (
        <GestureWrapper
          currentState={currentState}
          initialMode={displayConfig.mode}
          touchEnabled={displayConfig.touchEnabled && config.gesturesEnabled}
          animationsEnabled={displayConfig.animationsEnabled && config.animationsEnabled}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-theme-secondary mb-2">
              PlexSonic
            </h1>
            <p className="text-theme-muted">
              {connectionStatus === 'connected' 
                ? 'Waiting for media playback...' 
                : 'Connecting to server...'}
            </p>
          </div>
        </div>
      )}

      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={config.theme}
        onThemeChange={setTheme}
        displayMode={config.displayMode}
        onDisplayModeChange={setDisplayMode}
        gesturesEnabled={config.gesturesEnabled}
        onGesturesToggle={setGesturesEnabled}
        animationsEnabled={config.animationsEnabled}
        onAnimationsToggle={setAnimationsEnabled}
        onReset={resetConfig}
      />
    </div>
  );
}

export default App;