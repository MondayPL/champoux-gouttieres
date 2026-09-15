import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { CalendrierClient } from "@/components/CalendrierClient";
import { CAPACITE_JOURNEE } from "@/lib/constants";

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
      civique: c.civique,
      rue: c.rue,
      villeNom: c.villeNom,
      montant: c.montant,
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
        civique: s.contrat.civique,
        rue: s.contrat.rue,
        villeNom: s.contrat.villeNom,
        montant: s.contrat.montant,
        piedLinG: s.contrat.piedLinG,
        piedLinD: s.contrat.piedLinD,
      },
    })),
  }));

  const maxSemaine = routes.reduce((m, r) => Math.max(m, r.semaine), 1);

  return (
    <div>
      <PageHeader
        title="Calendrier d'installation"
        subtitle={`Semaines fictives lun–ven · cible ${CAPACITE_JOURNEE.montantMin.toLocaleString("fr-CA")}$ · ${CAPACITE_JOURNEE.jobsMin}–${CAPACITE_JOURNEE.jobsMax} jobs · 1 secteur/jour`}
      />
      <CalendrierClient
        initialRoutes={serialized}
        contratsLibres={contratsLibres}
        maxSemaine={maxSemaine}
      />
    </div>
  );
}
