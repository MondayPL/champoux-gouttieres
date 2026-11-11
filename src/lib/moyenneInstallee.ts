/**
 * Moyenne des pieds linéaires installés par jour, pour le rapport de semaine.
 *
 * Statut retenu (même valeur que dans rapportJournee.ts) : uniquement
 * contrat.installEtat === "Terminée". Aucun autre champ (pas « Fait »,
 * pas « Complétée », pas le journal mobile).
 *
 * Dénominateur : nombre de dates distinctes (jours d'affichage de la semaine)
 * qui ont au moins un de ces travaux terminés. Si zéro jour : null (afficher « — »).
 */
export const ETAT_TERMINEE = "Terminée";

export type TravailSemaine = {
  installEtat: string | null | undefined;
  piedLinG: number | null | undefined;
  piedLinD: number | null | undefined;
  /** Jour calendrier d'affichage (AAAA-MM-JJ), lundi–vendredi de la semaine du rapport. */
  dateJour: string;
};

/** Somme (piedLinG + piedLinD) des travaux terminés / nombre de jours distincts avec au moins un terminé. */
export function moyenneInstalleeParJour(travaux: TravailSemaine[]): number | null {
  const termines = travaux.filter((t) => t.installEtat === ETAT_TERMINEE && t.dateJour);
  const jours = new Set(termines.map((t) => t.dateJour));
  if (jours.size === 0) return null;
  const pi = termines.reduce((s, t) => s + (t.piedLinG || 0) + (t.piedLinD || 0), 0);
  return pi / jours.size;
}

/** Texte à afficher : « — » s'il n'y a aucun jour terminé, sinon le nombre en fr-CA suivi de « pi ». */
export function formatMoyenneInstallee(n: number | null): string {
  if (n == null) return "\u2014";
  return `${n.toLocaleString("fr-CA")} pi`;
}
