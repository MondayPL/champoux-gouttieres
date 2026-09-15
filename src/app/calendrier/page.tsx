import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { CalendrierClient } from "@/components/CalendrierClient";

export const dynamic = "force-dynamic";

export default async function CalendrierPage() {
  const [routes, allEligible] = await Promise.all([
    prisma.route.findMany({
      include: {
        secteur: true,
        installateur: true,
        stops: {
          include: { contrat: true },
          orderBy: { ordre: "asc" },
        },
      },
      orderBy: [{ semaine: "asc" }, { jourSemaine: "asc" }],
    }),
    prisma.contrat.findMany({
      where: { montant: { not: null } },
      include: { secteur: true, routeStops: true },
      orderBy: { montant: "desc" },
    }),
  ]);

  const contratsLibres = allEligible
    .filter((c) => c.routeStops.length === 0)
    .map((c) => ({
      id: c.id,
      numContrat: c.numContrat,
      nom: c.nom,
      prenom: c.prenom,
      telephone: c.telephone,
      civique: c.civique,
      rue: c.rue,
      villeNom: c.villeNom,
      montant: c.montant,
      piedLinG: c.piedLinG,
      piedLinD: c.piedLinD,
      equip: c.equip,
      statut: c.statut,
      secteurId: c.secteurId,
      secteur: c.secteur,
    }));

  const serialized = routes.map((r) => ({
    id: r.id,
    semaine: r.semaine,
    jourSemaine: r.jourSemaine,
    nom: r.nom,
    secteur: r.secteur,
    installateur: r.installateur,
    stops: r.stops.map((s) => ({
      id: s.id,
      ordre: s.ordre,
      contrat: {
        id: s.contrat.id,
        numContrat: s.contrat.numContrat,
        nom: s.contrat.nom,
        prenom: s.contrat.prenom,
        telephone: s.contrat.telephone,
        civique: s.contrat.civique,
        rue: s.contrat.rue,
        villeNom: s.contrat.villeNom,
        montant: s.contrat.montant,
        piedLinG: s.contrat.piedLinG,
        piedLinD: s.contrat.piedLinD,
        equip: s.contrat.equip,
        statut: s.contrat.statut,
      },
    })),
  }));

  const maxSemaine = routes.reduce((m, r) => Math.max(m, r.semaine), 1);

  return (
    <div>
      <PageHeader
        title="Calendrier d'installation"
        subtitle="IA : 2 jobs (3e si sous 4 k$) · 4–6 k$ · 1 secteur · date"
      />
      <CalendrierClient
        initialRoutes={serialized}
        contratsLibres={contratsLibres}
        maxSemaine={maxSemaine}
      />
    </div>
  );
}
