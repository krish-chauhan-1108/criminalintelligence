import React from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

interface SystemStatusProps {
  status: 'checking' | 'online' | 'offline';
  sourceRegistryReady: boolean;
  onRetry: () => void;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({
  status,
  sourceRegistryReady,
  onRetry,
}) => {
  const label =
    status === 'checking'
      ? 'Checking API…'
      : status === 'online'
        ? 'API Online'
        : 'API Offline';

  return (
    <div className="status-bar flex items-center justify-between gap-3 text-xs text-neutral-400 bg-[#121212] border border-[#222222] rounded-xl px-3.5 py-2.5">
      <div className="status-bar__item flex items-center gap-2">
        <span
          className={`status-dot w-2 h-2 rounded-full ${
            status === 'online'
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
              : status === 'checking'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-500'
          }`}
        />
        <span className="font-medium text-neutral-300">{label}</span>
      </div>

      <div
        className="status-bar__item flex items-center gap-1.5 text-[11px]"
        title="Verified legal-source registry"
      >
        <ShieldCheck
          size={14}
          className={sourceRegistryReady ? 'text-emerald-400' : 'text-neutral-500'}
        />
        <span className={sourceRegistryReady ? 'text-emerald-400/90' : 'text-neutral-500'}>
          {sourceRegistryReady ? 'Legal sources ready' : 'Sources unavailable'}
        </span>
      </div>

      {status === 'offline' && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 transition-colors ml-auto"
        >
          <RefreshCw size={11} />
          Retry
        </button>
      )}
    </div>
  );
};
