/**
 * Returns the cultivator ID for dev-mode auth.
 * Reads from localStorage key `orchard_cultivator_id`, falling back to
 * the NEXT_PUBLIC_CULTIVATOR_ID env var. Returns null if neither is set.
 */
export function getCultivatorId(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('orchard_cultivator_id') ||
    process.env.NEXT_PUBLIC_CULTIVATOR_ID ||
    null
  );
}
