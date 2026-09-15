import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

type SeedData = {
  secteurs: { numero: number; nom: string; couleur: string }[];
  villes: { nom: string; nomNorm: string; secteurNumero: number }[];
  couleurs: { nomFr: string; nomEn: string | null; colonne: number; ordre: number }[];
  contrats: Array<Record<string, unknown>>;
  compteRendus: Array<{ nom: string; montant: number | null; dateFait: string | null }>;
  reparations: Array<Record<string, unknown>>;
  installateurs: { nom: string; telephone: string | null }[];
};

function asDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

async function main() {
  const file = path.join(__dirname, "..", "data", "seed-data.json");
  if (!fs.existsSync(file)) {
    throw new Error(
      `Manquant: ${file}. Exécutez: python3 scripts/import-excel.py`
    );
  }
  const data: SeedData = JSON.parse(fs.readFileSync(file, "utf8"));

  await prisma.routeStop.deleteMany();
  await prisma.route.deleteMany();
  await prisma.contrat.deleteMany();
  await prisma.reparation.deleteMany();
  await prisma.compteRendu.deleteMany();
  await prisma.couleur.deleteMany();
  await prisma.ville.deleteMany();
  await prisma.secteur.deleteMany();
  await prisma.installateur.deleteMany();

  const secteurByNumero = new Map<number, string>();
  for (const s of data.secteurs) {
    const created = await prisma.secteur.create({ data: s });
    secteurByNumero.set(s.numero, created.id);
  }

  const secteurByNorm = new Map<string, string>();
  for (const v of data.villes) {
    const secteurId = secteurByNumero.get(v.secteurNumero);
    if (!secteurId) continue;
    await prisma.ville.create({
      data: { nom: v.nom, nomNorm: v.nomNorm, secteurId },
    });
    secteurByNorm.set(v.nomNorm, secteurId);
  }

  for (const c of data.couleurs) {
    await prisma.couleur.create({
      data: {
        nomFr: c.nomFr,
        nomEn: c.nomEn,
        colonne: c.colonne,
        ordre: c.ordre,
      },
    });
  }

  const installateurs = [];
  for (const i of data.installateurs) {
    installateurs.push(await prisma.installateur.create({ data: i }));
  }

  let contratCount = 0;
  const contratIds: string[] = [];
  for (const raw of data.contrats) {
    const villeNorm = String(raw.villeNorm || "");
    const secteurId = secteurByNorm.get(villeNorm) || null;
    const created = await prisma.contrat.create({
      data: {
        numContrat: (raw.numContrat as string) || null,
        date: asDate(raw.date),
        nom: (raw.nom as string) || null,
        prenom: (raw.prenom as string) || null,
        telephone: (raw.telephone as string) || null,
        civique: (raw.civique as string) || null,
        rue: (raw.rue as string) || null,
        villeNom: (raw.villeNom as string) || null,
        gouttiere: (raw.gouttiere as string) || null,
        piedLinG: (raw.piedLinG as number) ?? null,
        descente: (raw.descente as string) || null,
        piedLinD: (raw.piedLinD as number) ?? null,
        equip: (raw.equip as string) || null,
        enlvExist: !!raw.enlvExist,
        friseIncl: !!raw.friseIncl,
        toitTole: !!raw.toitTole,
        montant: (raw.montant as number) ?? null,
        grille: (raw.grille as string) || null,
        piedLinGr: (raw.piedLinGr as number) ?? null,
        statut: (raw.statut as string) || null,
        colonne2: (raw.colonne2 as string) || null,
        secteurId,
      },
    });
    contratIds.push(created.id);
    contratCount++;
  }

  for (const cr of data.compteRendus) {
    await prisma.compteRendu.create({
      data: {
        nom: cr.nom,
        montant: cr.montant,
        dateFait: asDate(cr.dateFait),
      },
    });
  }

  for (const r of data.reparations) {
    await prisma.reparation.create({
      data: {
        numContrat: (r.numContrat as string) || null,
        date: asDate(r.date),
        nom: (r.nom as string) || null,
        prenom: (r.prenom as string) || null,
        civique: (r.civique as string) || null,
        rue: (r.rue as string) || null,
        villeNom: (r.villeNom as string) || null,
        travaux: (r.travaux as string) || null,
        montant: (r.montant as number) ?? null,
        contratGouttiere: (r.contratGouttiere as string) || null,
        etat: (r.etat as string) || null,
      },
    });
  }

  // Sample fictional week routes (Semaine 1)
  const withSecteur = await prisma.contrat.findMany({
    where: { secteurId: { not: null }, montant: { not: null } },
    include: { secteur: true },
    orderBy: { montant: "desc" },
    take: 40,
  });

  const bySecteur = new Map<string, typeof withSecteur>();
  for (const c of withSecteur) {
    if (!c.secteurId) continue;
    if (!bySecteur.has(c.secteurId)) bySecteur.set(c.secteurId, []);
    bySecteur.get(c.secteurId)!.push(c);
  }

  let jour = 1;
  let routeCount = 0;
  for (const [secteurId, list] of bySecteur) {
    if (jour > 5) break;
    const stops = list.slice(0, 5);
    if (stops.length === 0) continue;
    const secteur = stops[0].secteur;
    await prisma.route.create({
      data: {
        semaine: 1,
        jourSemaine: jour,
        nom: `Semaine 1 — ${["Lundi","Mardi","Mercredi","Jeudi","Vendredi"][jour-1]} · ${secteur?.nom || ""}`,
        secteurId,
        installateurId: installateurs[routeCount % installateurs.length]?.id,
        stops: {
          create: stops.map((c, ordre) => ({ contratId: c.id, ordre })),
        },
      },
    });
    routeCount++;
    jour++;
  }

  console.log(
    `Seed OK: ${data.secteurs.length} secteurs, ${data.villes.length} villes, ` +
      `${data.couleurs.length} couleurs, ${contratCount} contrats, ` +
      `${data.compteRendus.length} comptes rendus, ${data.reparations.length} réparations, ` +
      `${routeCount} tournées exemple`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
