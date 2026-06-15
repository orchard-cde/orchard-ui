'use client';

import { useEffect, useRef, useState } from 'react';
import type { GroveState } from '@/types/orchard';
import { getCultivatorId } from '@/lib/auth';

export interface GroveEvent {
  newState: GroveState;
  previousState: GroveState;
  changedAt: string;
}

export interface UseGroveEventsResult {
  event: GroveEvent | null;
  error: string | null;
  connecting: boolean;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export function useGroveEvents(groveId: string): UseGroveEventsResult {
  const [event, setEvent] = useState<GroveEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const retriesRef = useRef(0);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let cancelled = false;

    function connect() {
      if (cancelled) return;

      const cultivatorId = getCultivatorId();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
      const url = `${baseUrl}/api/groves/${encodeURIComponent(groveId)}/events${cultivatorId ? `?cultivatorId=${encodeURIComponent(cultivatorId)}` : ''}`;

      setConnecting(true);
      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener('grove-state-changed', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          setEvent({
            newState: payload.newState,
            previousState: payload.previousState,
            changedAt: payload.changedAt,
          });
          retriesRef.current = 0;
          setConnecting(false);
          setError(null);
        } catch {
          // ignore malformed events
        }
      });

      es.onopen = () => {
        retriesRef.current = 0;
        setConnecting(false);
        setError(null);
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;

        if (cancelled) return;

        if (retriesRef.current < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, retriesRef.current);
          retriesRef.current += 1;
          setConnecting(true);
          setTimeout(connect, delay);
        } else {
          setConnecting(false);
          setError('Lost connection to grove. Please refresh.');
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      esRef.current?.close();
      esRef.current = null;
    };
  }, [groveId]);

  return { event, error, connecting };
}
