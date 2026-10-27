declare module '@orchard-cde/design/theme' {
  export type ThemePreference = 'light' | 'dark' | 'system';
  export type ThemeMode = 'light' | 'dark';

  export const initScript: string;
  export function getPreference(): ThemePreference;
  export function resolve(): ThemeMode;
  export function set(preference: ThemePreference): ThemeMode;
  export function subscribe(listener: (mode: ThemeMode) => void): () => void;
}
