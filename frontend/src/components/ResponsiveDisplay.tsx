import { memo } from 'react';
import type { CurrentState } from '../types/plex';
import { useDisplayMode } from '../hooks/useDisplayMode';
import { CompactView } from './views/CompactView';
import { StandardView } from './views/StandardView';
import { GalleryView } from './views/GalleryView';

interface ResponsiveDisplayProps {
  currentState: CurrentState;
}

export const ResponsiveDisplay = memo(function ResponsiveDisplay({ 
  currentState 
}: ResponsiveDisplayProps) {
  const displayConfig = useDisplayMode();

  switch (displayConfig.mode) {
    case 'compact':
      return <CompactView currentState={currentState} />;
    
    case 'gallery':
      return (
        <GalleryView 
          currentState={currentState} 
          animationsEnabled={displayConfig.animationsEnabled}
        />
      );
    
    case 'standard':
    default:
      return (
        <StandardView 
          currentState={currentState} 
          animationsEnabled={displayConfig.animationsEnabled}
        />
      );
  }
});