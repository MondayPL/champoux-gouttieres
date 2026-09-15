import { CAPACITE_JOURNEE } from "./constants";

export const JOURS_SEMAINE = [
  { n: 1, label: "Lundi" },
  { n: 2, label: "Mardi" },
  { n: 3, label: "Mercredi" },
  { n: 4, label: "Jeudi" },
  { n: 5, label: "Vendredi" },
] as const;

export type OptimizableContrat = {
  id: string;
  label: string;
  adresse: string;
  montant: number;
  date: Date | null;
  piedLinG: number;
  piedLinD: number;
  secteurId: string | null;
  secteurNom?: string | null;
  secteurNumero?: number | null;
};

export type OptimizedDay = {
  semaine: number;
  jourSemaine: number;
  jourLabel: string;
  secteurId: string | null;
  secteurNom: string | null;
  secteurNumero: number | null;
  stops: OptimizableContrat[];
  charge: number;
  montantTotal: number;
  meetsTarget: boolean;
};

export type OptimizeOptions = {
  /** Première semaine fictive à remplir (défaut 1) */
  startSemaine?: number;
  /** Nombre de semaines fictives Mon–Fri (défaut 4 ≈ un mois) */
  semaines?: number;
  /** Secteurs déjà visités dans le « mois » courant (numéros 1–7) */
  secteursVisitesCeMois?: number[];
  allSecteurNumeros?: number[];
};

/**
 * Planificateur de tournées (heuristique, sans API) — semaines fictives :
 * - Lun–Ven seulement (ignore les dates calendrier)
 * - Cible > 5000 $ / jour si possible
 * - Idéalement 4–5 emplois / jour
 * - Un secteur par jour (cluster km)
 * - Chaque secteur 1–7 au moins 1× par mois (rotation sur ~4 semaines)
 */
export function optimizeRoutes(
  contrats: OptimizableContrat[],
  options: OptimizeOptions = {}
): OptimizedDay[] {
  const startSemaine = options.startSemaine ?? 1;
  const nbSemaines = options.semaines ?? 4;
  const allNums = options.allSecteurNumeros ?? [1, 2, 3, 4, 5, 6, 7];
  const visited = new Set(options.secteursVisitesCeMois ?? []);

  const bySecteur = new Map<string, OptimizableContrat[]>();
  for (const c of contrats) {
    const key = c.secteurId || "__aucun__";
    if (!bySecteur.has(key)) bySecteur.set(key, []);
    bySecteur.get(key)!.push({ ...c });
  }

  for (const [, list] of bySecteur) {
    list.sort((a, b) => {
      const ma = a.montant || 0;
      const mb = b.montant || 0;
      if (mb !== ma) return mb - ma;
      const da = a.date?.getTime() ?? 0;
      const db = b.date?.getTime() ?? 0;
      return da - db;
    });
  }

  function secteurScore(key: string): number {
    const list = bySecteur.get(key) || [];
    if (list.length === 0) return -Infinity;
    const num = list[0]?.secteurNumero;
    const missingBonus =
      num != null && allNums.includes(num) && !visited.has(num) ? 1_000_000 : 0;
    const volume = list.reduce((s, x) => s + (x.montant || 0), 0);
    return missingBonus + volume * 10 + list.length;
  }

  const remainingKeys = () =>
    [...bySecteur.keys()].filter((k) => (bySecteur.get(k)?.length || 0) > 0);

  const days: OptimizedDay[] = [];

  for (let s = 0; s < nbSemaines; s++) {
    const semaine = startSemaine + s;
    // Reset monthly rotation every 4 weeks
    if (s > 0 && s % 4 === 0) {
      visited.clear();
    }

    for (const jour of JOURS_SEMAINE) {
      const keys = remainingKeys().sort(
        (a, b) => secteurScore(b) - secteurScore(a)
      );
      if (keys.length === 0) return days;

      let chosenKey = keys[0];
      for (const k of keys) {
        const list = bySecteur.get(k)!;
        const top = list.slice(0, CAPACITE_JOURNEE.jobsMax);
        const sum = top.reduce((acc, x) => acc + (x.montant || 0), 0);
        if (
          list.length >= CAPACITE_JOURNEE.jobsMin &&
          sum >= CAPACITE_JOURNEE.montantMin
        ) {
          chosenKey = k;
          break;
        }
        if (list.length >= CAPACITE_JOURNEE.jobsMin) {
          chosenKey = k;
        }
      }

      const queue = bySecteur.get(chosenKey)!;
      const stops: OptimizableContrat[] = [];
      let montantTotal = 0;
      let charge = 0;

      while (queue.length > 0 && stops.length < CAPACITE_JOURNEE.jobsMax) {
        const next = queue[0];
        const nextCharge =
          (next.piedLinG || 0) + (next.piedLinD || 0) || 40;

        // After 4 jobs + 5k$, still allow a 5th
        if (
          stops.length >= CAPACITE_JOURNEE.jobsMin &&
          montantTotal >= CAPACITE_JOURNEE.montantMin &&
          stops.length >= CAPACITE_JOURNEE.jobsMax
        ) {
          break;
        }

        queue.shift();
        stops.push(next);
        montantTotal += next.montant || 0;
        charge += nextCharge;
      }

      if (stops.length === 0) continue;

      const num = stops[0]?.secteurNumero ?? null;
      if (num != null) visited.add(num);

      days.push({
        semaine,
        jourSemaine: jour.n,
        jourLabel: jour.label,
        secteurId: chosenKey === "__aucun__" ? null : chosenKey,
        secteurNom: stops[0]?.secteurNom ?? null,
        secteurNumero: num,
        stops,
        charge,
        montantTotal,
        meetsTarget:
          stops.length >= CAPACITE_JOURNEE.jobsMin &&
          montantTotal >= CAPACITE_JOURNEE.montantMin,
      });
    }
  }

  return days;
}
