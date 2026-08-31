import { renderHook, act } from '@testing-library/react';
import { useGroveEvents } from '../useGroveEvents';

jest.mock('@/lib/auth', () => ({
  getCultivatorId: jest.fn(() => 'cult-1'),
}));

type Listener = (e: MessageEvent) => void;

class MockEventSource {
  static instances: MockEventSource[] = [];
  listeners: Record<string, Listener[]> = {};
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;

  constructor(public url: string) {
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, fn: Listener) {
    (this.listeners[type] ||= []).push(fn);
  }

  close() {
    this.closed = true;
  }

  emit(type: string, data: unknown) {
    const raw = typeof data === 'string' ? data : JSON.stringify(data);
    (this.listeners[type] ?? []).forEach((fn) => fn({ data: raw } as MessageEvent));
  }
}

const BEE_PAYLOAD = {
  beeId: 'bee-1',
  groveId: 'grove-1',
  previousState: 'HIBERNATING',
  newState: 'BUZZING',
  changedAt: '2024-06-01T00:00:00Z',
};

beforeEach(() => {
  MockEventSource.instances = [];
  (global as unknown as { EventSource: unknown }).EventSource = MockEventSource;
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('passes a bee-state-changed payload to onBeeEvent', () => {
  const onBeeEvent = jest.fn();
  renderHook(() => useGroveEvents('grove-1', { onBeeEvent }));

  act(() => {
    MockEventSource.instances[0].emit('bee-state-changed', BEE_PAYLOAD);
  });

  expect(onBeeEvent).toHaveBeenCalledTimes(1);
  expect(onBeeEvent).toHaveBeenCalledWith(BEE_PAYLOAD);
});

test('ignores a malformed bee-state-changed payload', () => {
  const onBeeEvent = jest.fn();
  renderHook(() => useGroveEvents('grove-1', { onBeeEvent }));

  act(() => {
    MockEventSource.instances[0].emit('bee-state-changed', 'not json{');
  });

  expect(onBeeEvent).not.toHaveBeenCalled();
});

test('does not require an onBeeEvent callback', () => {
  renderHook(() => useGroveEvents('grove-1'));

  expect(() => {
    act(() => {
      MockEventSource.instances[0].emit('bee-state-changed', BEE_PAYLOAD);
    });
  }).not.toThrow();
});

test('still reports grove-state-changed on the result', () => {
  const { result } = renderHook(() => useGroveEvents('grove-1', { onBeeEvent: jest.fn() }));

  act(() => {
    MockEventSource.instances[0].emit('grove-state-changed', {
      groveId: 'grove-1',
      groveName: 'Test Grove',
      previousState: 'GROWING',
      newState: 'FLOURISHING',
      changedAt: '2024-06-01T00:00:00Z',
    });
  });

  expect(result.current.event).toEqual({
    newState: 'FLOURISHING',
    previousState: 'GROWING',
    changedAt: '2024-06-01T00:00:00Z',
  });
});

test('registers both listeners on a single EventSource', () => {
  renderHook(() => useGroveEvents('grove-1', { onBeeEvent: jest.fn() }));

  expect(MockEventSource.instances).toHaveLength(1);
  expect(MockEventSource.instances[0].listeners['grove-state-changed']).toHaveLength(1);
  expect(MockEventSource.instances[0].listeners['bee-state-changed']).toHaveLength(1);
});

test('re-attaches the bee listener after a reconnect', () => {
  const onBeeEvent = jest.fn();
  renderHook(() => useGroveEvents('grove-1', { onBeeEvent }));

  act(() => {
    MockEventSource.instances[0].onerror?.();
  });
  act(() => {
    jest.advanceTimersByTime(1000);
  });

  expect(MockEventSource.instances).toHaveLength(2);

  act(() => {
    MockEventSource.instances[1].emit('bee-state-changed', BEE_PAYLOAD);
  });

  expect(onBeeEvent).toHaveBeenCalledWith(BEE_PAYLOAD);
});

test('resets the retry budget and error when groveId changes', () => {
  const { result, rerender } = renderHook(
    ({ groveId }: { groveId: string }) => useGroveEvents(groveId),
    { initialProps: { groveId: 'grove-a' } },
  );

  // Exhaust grove A's retry budget (MAX_RETRIES = 3).
  act(() => { MockEventSource.instances[0].onerror?.(); });
  act(() => { jest.advanceTimersByTime(1000); });
  act(() => { MockEventSource.instances[1].onerror?.(); });
  act(() => { jest.advanceTimersByTime(2000); });
  act(() => { MockEventSource.instances[2].onerror?.(); });
  act(() => { jest.advanceTimersByTime(4000); });
  act(() => { MockEventSource.instances[3].onerror?.(); });

  expect(result.current.error).toBe('Lost connection to grove. Please refresh.');
  expect(MockEventSource.instances).toHaveLength(4);

  rerender({ groveId: 'grove-b' });

  expect(MockEventSource.instances).toHaveLength(5);
  expect(result.current.error).toBeNull();

  // Grove B's first error should get its own retry budget, not go straight
  // to terminal because of A's exhausted retriesRef.
  act(() => { MockEventSource.instances[4].onerror?.(); });

  expect(result.current.error).toBeNull();

  act(() => { jest.advanceTimersByTime(1000); });

  expect(MockEventSource.instances).toHaveLength(6);
});

test('a changing onBeeEvent identity does not rebuild the EventSource', () => {
  const first = jest.fn();
  const { rerender } = renderHook(
    ({ cb }: { cb: () => void }) => useGroveEvents('grove-1', { onBeeEvent: cb }),
    { initialProps: { cb: first } },
  );

  expect(MockEventSource.instances).toHaveLength(1);

  const second = jest.fn();
  rerender({ cb: second });

  expect(MockEventSource.instances).toHaveLength(1);

  act(() => {
    MockEventSource.instances[0].emit('bee-state-changed', BEE_PAYLOAD);
  });

  expect(second).toHaveBeenCalledWith(BEE_PAYLOAD);
  expect(first).not.toHaveBeenCalled();
});
