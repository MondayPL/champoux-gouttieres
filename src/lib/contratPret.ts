import { stripAccents } from "./normalize";

/**
 * Hard-exclude patterns for jobs that must not enter auto-optimize.
 * Matches against statut (free-text notes from the Excel sheet), case/accent-insensitive.
 * Soft notes like « va rappeler » stay in the pool.
 */
const HARD_EXCLUDE: RegExp[] = [
  /pas\s+pret/, // pas prêt / pas prete / pas prête
  /en\s+commande/,
  /annul/, // annulé, annulation, …
  /correction/,
];

/** Returns true if the contrat can be included in auto route planning. */
export function isContratPretPourPlan(statut: string | null | undefined): boolean {
  if (statut == null || !String(statut).trim()) return true;
  const normalized = stripAccents(String(statut)).toLowerCase();
  return !HARD_EXCLUDE.some((re) => re.test(normalized));
}
