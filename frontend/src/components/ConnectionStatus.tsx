import React, { memo } from 'react';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnectAttempts: number;
}

export const ConnectionStatus = memo(function ConnectionStatus({ status, reconnectAttempts }: ConnectionStatusProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'disconnected':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return reconnectAttempts > 0 
          ? `Reconnecting... (${reconnectAttempts})` 
          : 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-full shadow-lg border border-gray-800">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-xs text-gray-300">
          {getStatusText()}
        </span>
      </div>
    </div>
  );
});