import { useState, useEffect, useCallback } from 'react';
import { UserConfig, DEFAULT_CONFIG, Theme, DisplayMode } from '../types/config';

const CONFIG_STORAGE_KEY = 'plexsonic-config';

export const useConfig = () => {
  const [config, setConfig] = useState<UserConfig>(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load config from localStorage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig) as UserConfig;
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load config from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
      } catch (error) {
        console.warn('Failed to save config to localStorage:', error);
      }
    }
  }, [config, isLoaded]);

  const updateConfig = useCallback((updates: Partial<UserConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...updates,
      lastUpdated: Date.now(),
    }));
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    updateConfig({ theme });
  }, [updateConfig]);

  const setDisplayMode = useCallback((displayMode: DisplayMode) => {
    updateConfig({ displayMode });
  }, [updateConfig]);

  const setGesturesEnabled = useCallback((gesturesEnabled: boolean) => {
    updateConfig({ gesturesEnabled });
  }, [updateConfig]);

  const setAnimationsEnabled = useCallback((animationsEnabled: boolean) => {
    updateConfig({ animationsEnabled });
  }, [updateConfig]);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  // Apply theme to document root
  useEffect(() => {
    if (isLoaded) {
      document.documentElement.setAttribute('data-theme', config.theme);
      
      // Apply theme-specific classes
      const root = document.documentElement;
      root.classList.remove('theme-dark', 'theme-light', 'theme-high-contrast');
      root.classList.add(`theme-${config.theme}`);
    }
  }, [config.theme, isLoaded]);

  return {
    config,
    isLoaded,
    setTheme,
    setDisplayMode,
    setGesturesEnabled,
    setAnimationsEnabled,
    resetConfig,
    updateConfig,
  };
};