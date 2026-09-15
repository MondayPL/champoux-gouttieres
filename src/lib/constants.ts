/** Capacité heuristique — objectifs de tournée (semaine de travail) */
export const CAPACITE_JOURNEE = {
  /** Montant cible minimum par jour ($) — bande IA 4–6 k$ */
  montantMin: 4000,
  /** Soft ceiling : éviter d’ajouter un job qui dépasse nettement ~6000 $ */
  montantMax: 6000,
  /** Cap dur IA : max emplois par jour en auto-plan */
  jobsAiMax: 2,
  /** Soft max ajouts manuels (ne bloque pas à jobsAiMax) */
  jobsManualMax: 5,
  /** Soft cap pi.lin si renseigné */
  piLinMax: 400,
} as const;

export const SECTEUR_COLORS: Record<number, string> = {
  1: "#2563EB",
  2: "#DC2626",
  3: "#16A34A",
  4: "#CA8A04",
  5: "#7C3AED",
  6: "#EA580C",
  7: "#0891B2",
};
