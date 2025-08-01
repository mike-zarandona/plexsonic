export type DisplayMode = 'compact' | 'standard' | 'gallery';

export interface DisplayConfig {
  mode: DisplayMode;
  size: DisplaySize;
  touchEnabled: boolean;
  animationsEnabled: boolean;
}

export interface DisplaySize {
  width: number;
  height: number;
  name: string;
}

export const DISPLAY_SIZES: Record<string, DisplaySize> = {
  'waveshare35': { width: 480, height: 320, name: 'WaveShare 3.5"' },
  'waveshare5': { width: 800, height: 480, name: 'WaveShare 5"' },
  'waveshare7': { width: 1024, height: 600, name: 'WaveShare 7"' },
  'hdmi720p': { width: 1280, height: 720, name: 'HDMI 720p' },
  'hdmi1080p': { width: 1920, height: 1080, name: 'HDMI 1080p' }
};

export const DISPLAY_BREAKPOINTS = {
  small: 480,   // Compact mode
  medium: 800,  // Standard mode
  large: 1200   // Gallery mode
} as const;