import { useState, useCallback } from 'react';
import { useGesture } from '@use-gesture/react';

export interface GestureActions {
  onModeSwipe?: (direction: 'left' | 'right') => void;
  onToggleDetails?: () => void;
  onSettings?: () => void;
  onZoomToggle?: () => void;
}

export function useGestures(actions: GestureActions, touchEnabled: boolean = true) {
  const [isDetailVisible, setIsDetailVisible] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleToggleDetails = useCallback(() => {
    setIsDetailVisible(prev => !prev);
    actions.onToggleDetails?.();
  }, [actions]);

  const handleZoomToggle = useCallback(() => {
    setIsZoomed(prev => !prev);
    actions.onZoomToggle?.();
  }, [actions]);

  const bind = useGesture(
    {
      // Swipe gestures for mode switching
      onDrag: ({ swipe: [swipeX], cancel }) => {
        if (!touchEnabled) return;
        
        if (swipeX !== 0) {
          const direction = swipeX > 0 ? 'right' : 'left';
          actions.onModeSwipe?.(direction);
          cancel();
        }
      },
      
      // Tap for details toggle
      onClick: ({ event }) => {
        if (!touchEnabled) return;
        
        // Prevent double-handling
        event.preventDefault();
        
        // Simple tap to toggle details
        handleToggleDetails();
      },
      
      // Long press for settings
      onContextMenu: ({ event }) => {
        if (!touchEnabled) return;
        
        event.preventDefault();
        actions.onSettings?.();
      },
      
      // Pinch for zoom (on album art)
      onPinch: ({ offset: [scale], memo = 1 }) => {
        if (!touchEnabled) return;
        
        const threshold = 1.2;
        const newZoomed = scale > threshold;
        
        if (newZoomed !== isZoomed) {
          handleZoomToggle();
        }
        
        return memo;
      }
    },
    {
      drag: {
        threshold: 50,
        swipe: {
          velocity: 0.5,
          distance: 60
        }
      },
      pinch: {
        threshold: 0.1
      }
    }
  );

  return {
    bind,
    state: {
      isDetailVisible,
      isZoomed,
      touchEnabled
    },
    actions: {
      toggleDetails: handleToggleDetails,
      toggleZoom: handleZoomToggle
    }
  };
}