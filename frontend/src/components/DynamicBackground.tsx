import { ExtractedColors } from '../hooks/useColorExtraction';

interface DynamicBackgroundProps {
  colors: ExtractedColors;
  isPaused?: boolean;
}

export function DynamicBackground({ colors, isPaused = false }: DynamicBackgroundProps) {
  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      {/* Base dark layer */}
      <div className="absolute inset-0 bg-neutral-950" />

      {/* Color blobs container */}
      <div
        className={`
          absolute inset-0 transition-opacity duration-1000
          ${isPaused ? 'opacity-30' : 'opacity-100'}
        `}
      >
        {/* Primary blob - large, top-left area */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] transition-colors duration-1000 ease-out" // 120
          style={{
            backgroundColor: colors.primary,
            top: '-15%',
            left: '-10%',
            opacity: 0.6,
          }}
        />

        {/* Secondary blob - medium, bottom-right */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px] transition-colors duration-1000 ease-out" // 100
          style={{
            backgroundColor: colors.secondary,
            bottom: '-20%',
            right: '-10%',
            opacity: 0.5,
          }}
        />

        {/* Tertiary blob - smaller, center-right */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[80px] transition-colors duration-1000 ease-out" // 80
          style={{
            backgroundColor: colors.tertiary,
            top: '27%',
            right: '10%',
            opacity: 0.4,
          }}
        />

        {/* Accent blob - small, bottom-left */}
        <div
          className="absolute w-[300px] h-[300px] rounded-full blur-[60px] transition-colors duration-1000 ease-out" // 60
          style={{
            backgroundColor: colors.primary,
            bottom: '10%',
            left: '5%',
            opacity: 0.35,
          }}
        />
      </div>

      {/* Darkening overlay for readability */}
      <div
        className="absolute inset-0 bg-black/40"
        style={{ backdropFilter: 'blur(1px)' }}
      />

      {/* Subtle noise texture for depth (optional - uses CSS) */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
