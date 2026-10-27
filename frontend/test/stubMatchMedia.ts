type ChangeListener = (event: MediaQueryListEvent) => void;

export interface MatchMediaStub {
  setDark(dark: boolean): void;
  restore(): void;
}

export function stubMatchMedia(dark: boolean): MatchMediaStub {
  const listeners = new Set<ChangeListener>();
  const original = window.matchMedia;
  let matches = dark;

  const query = {
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_type: string, listener: ChangeListener) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: ChangeListener) =>
      listeners.delete(listener),
  };
  window.matchMedia = jest.fn(() => query) as unknown as typeof window.matchMedia;

  return {
    setDark(next) {
      matches = next;
      for (const listener of listeners) {
        listener({ matches: next } as MediaQueryListEvent);
      }
    },
    restore() {
      window.matchMedia = original;
    },
  };
}

export function resetTheme() {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
}
