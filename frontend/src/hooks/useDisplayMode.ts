import { useState, useEffect } from 'react';
import type { DisplayMode, DisplayConfig } from '../types/display';
import { DISPLAY_BREAKPOINTS } from '../types/display';
import { UserConfig } from '../types/config';

function getAutoDisplayMode(width: number): DisplayMode {
  if (width < DISPLAY_BREAKPOINTS.small) {
    return 'compact';
  } else if (width >= DISPLAY_BREAKPOINTS.large) {
    return 'gallery';
  }
  return 'standard';
}

export function useDisplayMode(userConfig?: UserConfig): DisplayConfig {
  const [config, setConfig] = useState<DisplayConfig>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Use user preference or auto-detect
    const mode = userConfig?.displayMode === 'auto' || !userConfig?.displayMode
      ? getAutoDisplayMode(width)
      : userConfig.displayMode;
    
    return {
      mode,
      size: { width, height, name: 'Auto-detected' },
      touchEnabled: 'ontouchstart' in window,
      animationsEnabled: userConfig?.animationsEnabled ?? (width >= DISPLAY_BREAKPOINTS.medium)
    };
  });

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setConfig(prev => {
        // Only auto-update mode if user has it set to 'auto'
        const mode = userConfig?.displayMode === 'auto' || !userConfig?.displayMode
          ? getAutoDisplayMode(width)
          : userConfig.displayMode;
        
        return {
          ...prev,
          mode,
          size: { width, height, name: 'Auto-detected' },
          animationsEnabled: userConfig?.animationsEnabled ?? (width >= DISPLAY_BREAKPOINTS.medium)
        };
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [userConfig]);

  return config;
}