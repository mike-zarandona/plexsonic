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

  // When connected, show only a tiny subtle dot
  if (status === 'connected') {
    return (
      <div className="fixed bottom-3 right-3 p-1.5">
        <span className="block w-1.5 h-1.5 rounded-full bg-green-500/40" />
      </div>
    );
  }

  // For other states, show more prominent indicator with label
  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 backdrop-blur-sm text-xs text-neutral-300">
      <span
        className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`}
      />
      <span>{config.label}</span>
    </div>
  );
}
