import { ConnectionStatus as Status } from '../types/plex';

interface ConnectionStatusProps {
  status: Status;
}

const statusConfig: Record<Status, { label: string; color: string; pulse: boolean }> = {
  connecting: {
    label: 'Connecting...',
    color: 'bg-yellow-500',
    pulse: true,
  },
  connected: {
    label: 'Connected',
    color: 'bg-green-500',
    pulse: false,
  },
  disconnected: {
    label: 'Disconnected',
    color: 'bg-red-500',
    pulse: true,
  },
  error: {
    label: 'Connection Error',
    color: 'bg-red-600',
    pulse: true,
  },
};

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const config = statusConfig[status];

  // Hide when connected after a brief moment (show briefly to confirm connection)
  if (status === 'connected') {
    return (
      <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 backdrop-blur-sm text-xs text-neutral-400 opacity-50 transition-opacity duration-1000">
        <span className={`w-2 h-2 rounded-full ${config.color}`} />
        <span>{config.label}</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 backdrop-blur-sm text-xs text-neutral-300">
      <span
        className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`}
      />
      <span>{config.label}</span>
    </div>
  );
}
