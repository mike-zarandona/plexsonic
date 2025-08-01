import { useState, useEffect } from 'react';
import type { DisplayMode, DisplayConfig } from '../types/display';
import { DISPLAY_BREAKPOINTS } from '../types/display';

export function useDisplayMode(): DisplayConfig {
  const [config, setConfig] = useState<DisplayConfig>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Auto-detect display mode based on screen size
    let mode: DisplayMode = 'standard';
    if (width < DISPLAY_BREAKPOINTS.small) {
      mode = 'compact';
    } else if (width >= DISPLAY_BREAKPOINTS.large) {
      mode = 'gallery';
    }
    
    return {
      mode,
      size: { width, height, name: 'Auto-detected' },
      touchEnabled: 'ontouchstart' in window,
      animationsEnabled: width >= DISPLAY_BREAKPOINTS.medium
    };
  });

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setConfig(prev => {
        let mode: DisplayMode = 'standard';
        if (width < DISPLAY_BREAKPOINTS.small) {
          mode = 'compact';
        } else if (width >= DISPLAY_BREAKPOINTS.large) {
          mode = 'gallery';
        }
        
        return {
          ...prev,
          mode,
          size: { width, height, name: 'Auto-detected' },
          animationsEnabled: width >= DISPLAY_BREAKPOINTS.medium
        };
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return config;
}