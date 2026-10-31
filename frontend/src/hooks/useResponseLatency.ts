import { useState, useEffect } from 'react';
import { subscribeLatency } from '@/api/client';

export function useResponseLatency(): number | null {
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    return subscribeLatency((ms) => {
      setLatency(ms);
    });
  }, []);

  return latency;
}

