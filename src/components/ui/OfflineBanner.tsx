import { useEffect, useRef, useState } from 'react';
import { WifiOff, RefreshCw, Clock } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { localDb } from '@/db/localDb';

export function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [showSynced, setShowSynced] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    const updateCount = async () => {
      const count = await localDb.pending_sales
        .where('sync_status').anyOf(['pending', 'failed'])
        .count();
      setPendingCount(count);
    };

    updateCount();
    const interval = setInterval(updateCount, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOnline && wasOffline.current) {
      setShowSynced(true);
      setTimeout(() => setShowSynced(false), 4000);
    }
    wasOffline.current = !isOnline;
  }, [isOnline]);

  if (isOnline && !showSynced) return null;

  if (showSynced) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-2 flex items-center justify-center gap-2 text-sm font-medium">
        <RefreshCw className="h-4 w-4" />
        Back online — syncing sales...
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-2 flex items-center justify-center gap-2 text-sm font-medium">
      <WifiOff className="h-4 w-4" />
      <span>Offline mode</span>
      {pendingCount > 0 && (
        <>
          <span className="opacity-70">·</span>
          <Clock className="h-3 w-3" />
          <span>{pendingCount} sale{pendingCount > 1 ? 's' : ''} pending sync</span>
        </>
      )}
    </div>
  );
}
