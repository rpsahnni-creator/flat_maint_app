import type { SocietySettings } from '@/types';

/**
 * Overdue reconciliation is handled server-side. Kept as a no-op so any
 * remaining callers compile without client-side Supabase updates.
 */
export async function reconcileOverdueBills(settings: SocietySettings | null): Promise<void> {
  void settings;
  return;
}
