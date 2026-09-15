import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { optimizeRoutes, JOURS_SEMAINE } from "@/lib/optimizer";
import { fullAddress, fullName } from "@/lib/format";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const startSemaine = Number(body.startSemaine) || 1;
    const semaines = Number(body.semaines) || 4;

    const replaceExisting = body.replaceExisting !== false;

    // When replacing, clear routes first so previously assigned contracts re-enter the pool
    if (replaceExisting) {
      await prisma.route.deleteMany({});
    }

    const eligible = await prisma.contrat.findMany({
      where: {
        routeStops: { none: {} },
        OR: [{ montant: { gt: 0 } }, { piedLinG: { gt: 0 } }],
      },
      include: { secteur: true },
    });

    if (eligible.length === 0) {
      return NextResponse.json({
        created: 0,
        stops: 0,
        routes: [],
        message: "Aucun contrat libre à planifier.",
      });
    }

    const optimized = optimizeRoutes(
      eligible.map((c) => ({
        id: c.id,
        label: fullName(c.nom, c.prenom),
        adresse: fullAddress(c.civique, c.rue, c.villeNom),
        montant: c.montant || 0,
        date: c.date,
        piedLinG: c.piedLinG || 0,
        piedLinD: c.piedLinD || 0,
        secteurId: c.secteurId,
        secteurNom: c.secteur?.nom ?? null,
        secteurNumero: c.secteur?.numero ?? null,
        villeNom: c.villeNom,
        civique: c.civique,
        rue: c.rue,
      })),
      { startSemaine, semaines }
    );

    const installateurs = await prisma.installateur.findMany({
      where: { actif: true },
    });

    const createdRoutes = [];
    let stopCount = 0;
    let underTarget = 0;

    for (let i = 0; i < optimized.length; i++) {
      const day = optimized[i];
      const jourLabel =
        JOURS_SEMAINE.find((j) => j.n === day.jourSemaine)?.label || "";
      const installateur =
        installateurs[i % Math.max(installateurs.length, 1)];

      if (!day.meetsTarget) underTarget++;

      const route = await prisma.route.create({
        data: {
          semaine: day.semaine,
          jourSemaine: day.jourSemaine,
          nom: `Semaine ${day.semaine} — ${jourLabel}${
            day.secteurNumero != null ? ` · Secteur ${day.secteurNumero}` : ""
          }`,
          secteurId: day.secteurId,
          installateurId: installateur?.id ?? null,
          stops: {
            create: day.stops.map((s, ordre) => ({
              contratId: s.id,
              ordre,
            })),
          },
        },
        include: {
          secteur: true,
          installateur: true,
          stops: { include: { contrat: true }, orderBy: { ordre: "asc" } },
        },
      });
      stopCount += day.stops.length;
      createdRoutes.push(route);
    }

    const endSemaine = Math.max(
      ...optimized.map((d) => d.semaine),
      startSemaine
    );

    return NextResponse.json({
      created: createdRoutes.length,
      stops: stopCount,
      endSemaine,
      underTarget,
      routes: createdRoutes,
      /** Re-run: POST /api/routes/optimiser with { startSemaine, semaines, replaceExisting } */
      howToRerun:
        "POST /api/routes/optimiser { startSemaine:1, semaines:4, replaceExisting:true } — ou bouton « Générer le plan » dans Calendrier → Optimisé par IA",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur d'optimisation." }, { status: 500 });
  }
}
