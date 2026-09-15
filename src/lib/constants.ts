/** Capacité heuristique — objectifs de tournée (semaine de travail) */
export const CAPACITE_JOURNEE = {
  /** Montant cible minimum par jour ($) */
  montantMin: 5000,
  /** Nombre idéal d'emplois par jour */
  jobsMin: 4,
  jobsMax: 5,
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
