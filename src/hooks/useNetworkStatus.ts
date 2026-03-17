import { useState, useEffect, useRef } from 'react';
import API_CONFIG from '@/config/api';

// Poll the backend to detect real connectivity (window events unreliable in Capacitor)
async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_CONFIG.BASE_URL}/health`, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = async () => {
    const online = await checkConnectivity();
    setIsOnline(online);
  };

  useEffect(() => {
    // Initial check
    poll();

    // Poll every 5s when offline, every 15s when online
    const schedule = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(async () => {
        const online = await checkConnectivity();
        setIsOnline(prev => {
          if (prev !== online) schedule(); // reschedule on state change
          return online;
        });
      }, isOnline ? 15000 : 5000);
    };

    schedule();

    // Keep window events as fallback (works in PWA/browser)
    const handleOnline = () => { setIsOnline(true); schedule(); };
    const handleOffline = () => { setIsOnline(false); schedule(); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return isOnline;
}
