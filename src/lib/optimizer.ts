import { CAPACITE_JOURNEE } from "./constants";

export const JOURS_SEMAINE = [
  { n: 1, label: "Lundi" },
  { n: 2, label: "Mardi" },
  { n: 3, label: "Mercredi" },
  { n: 4, label: "Jeudi" },
  { n: 5, label: "Vendredi" },
] as const;

/** Centroïdes approximatifs (QC Centre-du-Québec / Estrie) — heuristique km sans API */
export const VILLE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  victoriaville: { lat: 46.055, lng: -71.959 },
  "val-des-sources": { lat: 45.871, lng: -71.948 },
  asbest: { lat: 45.871, lng: -71.948 },
  plessisville: { lat: 46.218, lng: -71.771 },
  princeville: { lat: 46.171, lng: -71.878 },
  warwick: { lat: 45.954, lng: -71.974 },
  "st-christophe-d'arthabaska": { lat: 46.022, lng: -71.925 },
  "saint-christophe-d'arthabaska": { lat: 46.022, lng: -71.925 },
  chesterville: { lat: 45.965, lng: -71.82 },
  daveluyville: { lat: 46.2, lng: -72.133 },
  laurierville: { lat: 46.3, lng: -71.65 },
  danville: { lat: 45.783, lng: -72.017 },
  "ham-sud": { lat: 45.733, lng: -71.583 },
  inverness: { lat: 46.25, lng: -71.533 },
  "kingsey falls": { lat: 45.85, lng: -72.067 },
  lyster: { lat: 46.367, lng: -71.617 },
  "st-albert": { lat: 45.95, lng: -72.083 },
  "saint-albert": { lat: 45.95, lng: -72.083 },
  "st-ferdinand": { lat: 46.1, lng: -71.567 },
  "saint-ferdinand": { lat: 46.1, lng: -71.567 },
  "st-fortunat": { lat: 45.967, lng: -71.533 },
  "saint-fortunat": { lat: 45.967, lng: -71.533 },
  "st-rosaire": { lat: 46.0, lng: -72.083 },
  "saint-rosaire": { lat: 46.0, lng: -72.083 },
  "ste-helene-de-chester": { lat: 45.967, lng: -71.667 },
  "sainte-helene-de-chester": { lat: 45.967, lng: -71.667 },
  "thetford mines": { lat: 46.094, lng: -71.302 },
  tingwick: { lat: 45.883, lng: -71.85 },
  adstock: { lat: 46.05, lng: -71.15 },
  "beaulac-garthby": { lat: 45.85, lng: -71.3 },
  "ham-nord": { lat: 45.85, lng: -71.7 },
  "maddington falls": { lat: 46.2, lng: -72.15 },
  "notre-dame-de-ham": { lat: 45.9, lng: -71.733 },
  "notre-dame-du-bon-conseil": { lat: 46.0, lng: -72.317 },
  "saint-martyrs-canadiens": { lat: 45.85, lng: -71.533 },
  "st-martyrs-canadien": { lat: 45.85, lng: -71.533 },
  "st-georges-de-windsor": { lat: 45.7, lng: -71.833 },
  "st-gedeon": { lat: 46.15, lng: -71.75 },
  "st-louis-de-blandford": { lat: 46.25, lng: -72.0 },
  "st-norbert": { lat: 46.15, lng: -72.4 },
  "st-pierre-baptiste": { lat: 46.2, lng: -71.65 },
  "st-samuel": { lat: 46.05, lng: -72.2 },
  "st-sylvere": { lat: 46.22, lng: -72.2 },
  "st-valere": { lat: 46.07, lng: -72.1 },
  "ste-monique": { lat: 46.15, lng: -72.5 },
};

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
  villeNom?: string | null;
  civique?: string | null;
  rue?: string | null;
  lat?: number | null;
  lng?: number | null;
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

function normalizeVilleKey(nom?: string | null): string {
  if (!nom) return "";
  return nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function parseCivique(civique?: string | null): number {
  if (!civique) return Number.POSITIVE_INFINITY;
  const m = String(civique).match(/\d+/);
  return m ? Number(m[0]) : Number.POSITIVE_INFINITY;
}

function coordsFor(c: OptimizableContrat): { lat: number; lng: number } | null {
  if (c.lat != null && c.lng != null && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
    return { lat: c.lat, lng: c.lng };
  }
  const key = normalizeVilleKey(c.villeNom);
  if (!key) return null;
  return VILLE_CENTROIDS[key] ?? null;
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Ordonne les arrêts d'une journée pour réduire les km (heuristique locale) :
 * - si ≥2 points ont des coords (lat/lng ou centroïde ville) → nearest-neighbour
 * - sinon : grouper par ville (ville la plus fréquente en premier), puis rue, puis civique
 */
export function orderStopsForDay(
  stops: OptimizableContrat[]
): OptimizableContrat[] {
  if (stops.length <= 1) return stops.slice();

  const withCoords = stops.map((s) => ({ s, c: coordsFor(s) }));
  const usable = withCoords.filter((x) => x.c != null);

  if (usable.length >= 2) {
    // Start from the city (centroid) that has the most stops
    const cityCount = new Map<string, number>();
    for (const s of stops) {
      const k = normalizeVilleKey(s.villeNom) || "__";
      cityCount.set(k, (cityCount.get(k) || 0) + 1);
    }
    let startIdx = 0;
    let bestCityCount = -1;
    for (let i = 0; i < withCoords.length; i++) {
      if (!withCoords[i].c) continue;
      const k = normalizeVilleKey(withCoords[i].s.villeNom) || "__";
      const n = cityCount.get(k) || 0;
      if (n > bestCityCount) {
        bestCityCount = n;
        startIdx = i;
      }
    }

    const remaining = withCoords.map((x, i) => ({ ...x, i }));
    const ordered: OptimizableContrat[] = [];
    let current = remaining.splice(startIdx, 1)[0];
    ordered.push(current.s);

    while (remaining.length > 0) {
      let bestJ = 0;
      let bestD = Number.POSITIVE_INFINITY;
      for (let j = 0; j < remaining.length; j++) {
        const a = current.c;
        const b = remaining[j].c;
        let d: number;
        if (a && b) {
          d = haversineKm(a, b);
        } else {
          // Prefer same city, then same street
          const sameVille =
            normalizeVilleKey(current.s.villeNom) ===
            normalizeVilleKey(remaining[j].s.villeNom);
          const sameRue =
            (current.s.rue || "").toLowerCase() ===
            (remaining[j].s.rue || "").toLowerCase();
          d = sameVille ? (sameRue ? 0.1 : 1) : 100 + j;
        }
        if (d < bestD) {
          bestD = d;
          bestJ = j;
        }
      }
      current = remaining.splice(bestJ, 1)[0];
      ordered.push(current.s);
    }
    return ordered;
  }

  // Fallback: secteur → ville (largest group first) → rue → civique
  const byVille = new Map<string, OptimizableContrat[]>();
  for (const s of stops) {
    const k = normalizeVilleKey(s.villeNom) || "zzz";
    if (!byVille.has(k)) byVille.set(k, []);
    byVille.get(k)!.push(s);
  }
  const villes = [...byVille.entries()].sort((a, b) => {
    if (b[1].length !== a[1].length) return b[1].length - a[1].length;
    return a[0].localeCompare(b[0], "fr");
  });

  const ordered: OptimizableContrat[] = [];
  for (const [, list] of villes) {
    list.sort((a, b) => {
      const sa = a.secteurNumero ?? 99;
      const sb = b.secteurNumero ?? 99;
      if (sa !== sb) return sa - sb;
      const ra = (a.rue || "").toLowerCase();
      const rb = (b.rue || "").toLowerCase();
      if (ra !== rb) return ra.localeCompare(rb, "fr");
      return parseCivique(a.civique) - parseCivique(b.civique);
    });
    ordered.push(...list);
  }
  return ordered;
}

/**
 * Planificateur de tournées (heuristique, sans API) — semaines fictives :
 * - Lun–Ven seulement (ignore les dates calendrier)
 * - Cap IA : max 2 emplois / jour
 * - Cible revenu 4000–6000 $ / jour (remplir jusqu’à ≥4000 ; ne pas ajouter si ça dépasse ~6000)
 * - Exactement 1 secteur par jour (pas d’emprunt depuis d’autres secteurs)
 * - Priorité date (plus ancien d’abord), puis montant
 * - Chaque secteur 1–7 au moins 1× par mois (rotation sur ~4 semaines)
 * - Arrêts ordonnés (ville / rue / centroïdes) pour limiter les km
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

  // Priorité date (plus ancien d’abord), montant en départage
  for (const [, list] of bySecteur) {
    list.sort((a, b) => {
      const da = a.date?.getTime() ?? Number.POSITIVE_INFINITY;
      const db = b.date?.getTime() ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      return (b.montant || 0) - (a.montant || 0);
    });
  }

  function secteurScore(key: string): number {
    const list = bySecteur.get(key) || [];
    if (list.length === 0) return -Infinity;
    const num = list[0]?.secteurNumero;
    const missingBonus =
      num != null && allNums.includes(num) && !visited.has(num) ? 1_000_000 : 0;
    const top = list.slice(0, CAPACITE_JOURNEE.jobsAiMax);
    const topSum = top.reduce((s, x) => s + (x.montant || 0), 0);
    const canHitMin = topSum >= CAPACITE_JOURNEE.montantMin ? 100_000 : 0;
    const volume = list.reduce((s, x) => s + (x.montant || 0), 0);
    // Prefer oldest backlog (earlier first date)
    const oldest = list[0]?.date?.getTime() ?? Number.POSITIVE_INFINITY;
    const ageBonus = Number.isFinite(oldest) ? Math.max(0, 2_000_000_000_000 - oldest) / 1e9 : 0;
    return missingBonus + canHitMin + volume * 10 + list.length + ageBonus;
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
        const top = list.slice(0, CAPACITE_JOURNEE.jobsAiMax);
        const sum = top.reduce((acc, x) => acc + (x.montant || 0), 0);
        if (sum >= CAPACITE_JOURNEE.montantMin) {
          chosenKey = k;
          break;
        }
      }

      const queue = bySecteur.get(chosenKey)!;
      const stops: OptimizableContrat[] = [];
      let montantTotal = 0;
      let charge = 0;

      // Pack from ONE secteur only — hard cap jobsAiMax, band 4–6 k$
      while (queue.length > 0 && stops.length < CAPACITE_JOURNEE.jobsAiMax) {
        const next = queue[0];
        const nextAmt = next.montant || 0;

        // Already in target band: only add if it stays ≤ montantMax
        if (
          stops.length > 0 &&
          montantTotal >= CAPACITE_JOURNEE.montantMin &&
          montantTotal + nextAmt > CAPACITE_JOURNEE.montantMax
        ) {
          break;
        }

        queue.shift();
        stops.push(next);
        montantTotal += nextAmt;
        charge += (next.piedLinG || 0) + (next.piedLinD || 0) || 40;
      }

      if (stops.length === 0) continue;

      const ordered = orderStopsForDay(stops);
      const primaryNumero =
        ordered.find((x) => (x.secteurId || "__aucun__") === chosenKey)
          ?.secteurNumero ??
        ordered[0]?.secteurNumero ??
        null;
      if (primaryNumero != null) visited.add(primaryNumero);

      const primaryStop =
        ordered.find((x) => (x.secteurId || "__aucun__") === chosenKey) ||
        ordered[0];

      days.push({
        semaine,
        jourSemaine: jour.n,
        jourLabel: jour.label,
        secteurId: chosenKey === "__aucun__" ? null : chosenKey,
        secteurNom: primaryStop?.secteurNom ?? null,
        secteurNumero: primaryNumero,
        stops: ordered,
        charge,
        montantTotal,
        meetsTarget:
          montantTotal >= CAPACITE_JOURNEE.montantMin &&
          montantTotal <= CAPACITE_JOURNEE.montantMax,
      });
    }
  }

  return days;
}
