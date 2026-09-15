import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { ContratForm } from "@/components/ContratForm";
import { formatMoney, toInputDate, fullName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ContratDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await prisma.contrat.findUnique({
    where: { id },
    include: { secteur: true },
  });
  if (!c) notFound();

  return (
    <div>
      <PageHeader
        title={fullName(c.nom, c.prenom)}
        subtitle={`Contrat ${c.numContrat || "—"} · ${formatMoney(c.montant)}`}
        actions={
          <Link href="/suivi" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600">
            ← Liste
          </Link>
        }
      />
      {c.secteur && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.secteur.couleur }} />
          {c.secteur.nom}
        </div>
      )}
      <ContratForm
        initial={{
          id: c.id,
          numContrat: c.numContrat,
          date: toInputDate(c.date),
          nom: c.nom,
          prenom: c.prenom,
          telephone: c.telephone,
          civique: c.civique,
          rue: c.rue,
          villeNom: c.villeNom,
          gouttiere: c.gouttiere,
          piedLinG: c.piedLinG,
          descente: c.descente,
          piedLinD: c.piedLinD,
          equip: c.equip,
          enlvExist: c.enlvExist,
          friseIncl: c.friseIncl,
          toitTole: c.toitTole,
          montant: c.montant,
          grille: c.grille,
          piedLinGr: c.piedLinGr,
          statut: c.statut,
          colonne2: c.colonne2,
        }}
      />
    </div>
  );
}
