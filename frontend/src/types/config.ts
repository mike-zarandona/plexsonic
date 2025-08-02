export type Theme = 'dark' | 'light' | 'high-contrast';

export type DisplayMode = 'auto' | 'compact' | 'standard' | 'gallery';

export interface UserConfig {
  theme: Theme;
  displayMode: DisplayMode;
  gesturesEnabled: boolean;
  animationsEnabled: boolean;
  lastUpdated: number;
}

export interface DisplayConfig {
  mode: DisplayMode;
  touchEnabled: boolean;
  animationsEnabled: boolean;
  screenSize: {
    width: number;
    height: number;
  };
}

export const DEFAULT_CONFIG: UserConfig = {
  theme: 'dark',
  displayMode: 'auto',
  gesturesEnabled: true,
  animationsEnabled: true,
  lastUpdated: Date.now(),
};