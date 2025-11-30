import { useState, useEffect, useRef } from 'react';
import ColorThief from 'colorthief';

export interface ExtractedColors {
  primary: string;
  secondary: string;
  tertiary: string;
}

const DEFAULT_COLORS: ExtractedColors = {
  primary: 'rgb(38, 38, 38)',    // neutral-800
  secondary: 'rgb(23, 23, 23)',  // neutral-900
  tertiary: 'rgb(10, 10, 10)',   // neutral-950
};

// Convert RGB array to CSS rgb string
function rgbToString(rgb: number[]): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

export function useColorExtraction(imageUrl: string | null): ExtractedColors {
  const [colors, setColors] = useState<ExtractedColors>(DEFAULT_COLORS);
  const colorThiefRef = useRef<ColorThief | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!colorThiefRef.current) {
      colorThiefRef.current = new ColorThief();
    }
  }, []);

  useEffect(() => {
    if (!imageUrl || imageUrl === lastUrlRef.current) {
      return;
    }

    lastUrlRef.current = imageUrl;
    const colorThief = colorThiefRef.current;
    if (!colorThief) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Get palette of 4 colors, quality 25 (skip every 25th pixel for speed)
        // Higher quality number = faster but less accurate
        const palette = colorThief.getPalette(img, 4, 25);

        if (palette && palette.length >= 3) {
          setColors({
            primary: rgbToString(palette[0]),
            secondary: rgbToString(palette[1]),
            tertiary: rgbToString(palette[2]),
          });
        }
      } catch (err) {
        console.warn('Failed to extract colors:', err);
        setColors(DEFAULT_COLORS);
      }
    };

    img.onerror = () => {
      console.warn('Failed to load image for color extraction');
      setColors(DEFAULT_COLORS);
    };

    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  return colors;
}
