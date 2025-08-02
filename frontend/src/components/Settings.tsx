import React from 'react';
import { Theme, DisplayMode } from '../types/config';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  gesturesEnabled: boolean;
  onGesturesToggle: (enabled: boolean) => void;
  animationsEnabled: boolean;
  onAnimationsToggle: (enabled: boolean) => void;
  onReset?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  displayMode,
  onDisplayModeChange,
  gesturesEnabled,
  onGesturesToggle,
  animationsEnabled,
  onAnimationsToggle,
  onReset,
}) => {
  if (!isOpen) return null;

  const themes: { value: Theme; label: string; description: string }[] = [
    { value: 'dark', label: 'Dark', description: 'Default dark theme optimized for low light' },
    { value: 'light', label: 'Light', description: 'Light theme for bright environments' },
    { value: 'high-contrast', label: 'High Contrast', description: 'Enhanced contrast for accessibility' },
  ];

  const displayModes: { value: DisplayMode; label: string; description: string }[] = [
    { value: 'auto', label: 'Auto', description: 'Automatically detect best layout' },
    { value: 'compact', label: 'Compact', description: 'Minimal layout for small displays' },
    { value: 'standard', label: 'Standard', description: 'Balanced layout with full metadata' },
    { value: 'gallery', label: 'Gallery', description: 'Rich layout with large artwork' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-theme-secondary rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-theme-primary">Settings</h2>
          <button
            onClick={onClose}
            className="text-theme-secondary hover:text-theme-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Theme Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-theme-primary mb-3">Theme</h3>
          <div className="space-y-2">
            {themes.map((t) => (
              <label key={t.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value={t.value}
                  checked={theme === t.value}
                  onChange={() => onThemeChange(t.value)}
                  className="mt-1"
                />
                <div>
                  <div className="text-theme-primary font-medium">{t.label}</div>
                  <div className="text-theme-secondary text-sm">{t.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Display Mode */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-theme-primary mb-3">Display Mode</h3>
          <div className="space-y-2">
            {displayModes.map((mode) => (
              <label key={mode.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="displayMode"
                  value={mode.value}
                  checked={displayMode === mode.value}
                  onChange={() => onDisplayModeChange(mode.value)}
                  className="mt-1"
                />
                <div>
                  <div className="text-theme-primary font-medium">{mode.label}</div>
                  <div className="text-theme-secondary text-sm">{mode.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-theme-primary mb-3">Features</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-theme-primary font-medium">Touch Gestures</div>
                <div className="text-theme-secondary text-sm">Enable swipe and tap controls</div>
              </div>
              <input
                type="checkbox"
                checked={gesturesEnabled}
                onChange={(e) => onGesturesToggle(e.target.checked)}
                className="scale-125"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-theme-primary font-medium">Animations</div>
                <div className="text-theme-secondary text-sm">Enable smooth transitions and effects</div>
              </div>
              <input
                type="checkbox"
                checked={animationsEnabled}
                onChange={(e) => onAnimationsToggle(e.target.checked)}
                className="scale-125"
              />
            </label>
          </div>
        </div>

        {/* Connection Test */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-theme-primary mb-3">Connection</h3>
          <button className="w-full bg-theme-accent hover:bg-theme-accent text-theme-primary py-2 px-4 rounded transition-colors">
            Test Plex Connection
          </button>
        </div>

        {/* Reset Settings */}
        <div className="border-t border-theme-tertiary pt-4">
          <button 
            onClick={onReset}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};