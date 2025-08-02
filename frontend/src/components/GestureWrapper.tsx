import { memo, useState } from 'react';
import type { CurrentState } from '../types/plex';
import type { DisplayMode } from '../types/display';
import { useGestures } from '../hooks/useGestures';
import { CompactView } from './views/CompactView';
import { StandardView } from './views/StandardView';
import { GalleryView } from './views/GalleryView';

interface GestureWrapperProps {
  currentState: CurrentState;
  initialMode: DisplayMode;
  touchEnabled: boolean;
  animationsEnabled: boolean;
  onOpenSettings: () => void;
}

const DISPLAY_MODES: DisplayMode[] = ['compact', 'standard', 'gallery'];

export const GestureWrapper = memo(function GestureWrapper({
  currentState,
  initialMode,
  touchEnabled,
  animationsEnabled,
  onOpenSettings
}: GestureWrapperProps) {
  const [currentMode, setCurrentMode] = useState<DisplayMode>(initialMode);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  const showTemporaryNotification = (message: string) => {
    setShowNotification(message);
    setTimeout(() => setShowNotification(null), 2000);
  };

  const { bind, state } = useGestures(
    {
      onModeSwipe: (direction) => {
        const currentIndex = DISPLAY_MODES.indexOf(currentMode);
        let nextIndex: number;
        
        if (direction === 'right') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : DISPLAY_MODES.length - 1;
        } else {
          nextIndex = currentIndex < DISPLAY_MODES.length - 1 ? currentIndex + 1 : 0;
        }
        
        const nextMode = DISPLAY_MODES[nextIndex];
        setCurrentMode(nextMode);
        showTemporaryNotification(`${nextMode.charAt(0).toUpperCase() + nextMode.slice(1)} Mode`);
      },
      
      onToggleDetails: () => {
        if (touchEnabled) {
          showTemporaryNotification(state.isDetailVisible ? 'Details Hidden' : 'Details Shown');
        }
      },
      
      onSettings: () => {
        onOpenSettings();
      },
      
      onZoomToggle: () => {
        showTemporaryNotification(state.isZoomed ? 'Zoomed In' : 'Zoomed Out');
      }
    },
    touchEnabled
  );

  const renderView = () => {
    const commonProps = {
      currentState,
      animationsEnabled,
      isDetailVisible: state.isDetailVisible,
      isZoomed: state.isZoomed
    };

    switch (currentMode) {
      case 'compact':
        return <CompactView currentState={currentState} />;
      
      case 'gallery':
        return <GalleryView {...commonProps} />;
      
      case 'standard':
      default:
        return <StandardView {...commonProps} />;
    }
  };

  return (
    <div {...bind()} className="select-none touch-manipulation">
      {renderView()}
      
      {/* Touch Instructions Overlay */}
      {touchEnabled && !showNotification && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 opacity-20 hover:opacity-80 transition-opacity">
          <div className="bg-gray-900 text-white text-xs px-3 py-1 rounded-full">
            Swipe: Change mode • Tap: Toggle details • Long press: Settings
          </div>
        </div>
      )}
      
      {/* Notification Toast */}
      {showNotification && (
        <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 ${
          animationsEnabled ? 'transition-all duration-300' : ''
        }`}>
          <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">
            {showNotification}
          </div>
        </div>
      )}
      
      {/* Mode Indicator */}
      <div className="fixed top-4 right-4 opacity-30">
        <div className="flex gap-1">
          {DISPLAY_MODES.map((mode) => (
            <div
              key={mode}
              className={`w-2 h-2 rounded-full ${
                mode === currentMode ? 'bg-white' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
});