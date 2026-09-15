import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatDate, formatMoney, fullName, fullAddress } from "@/lib/format";

export const dynamic = "force-dynamic";

type SP = Promise<{ secteur?: string; q?: string; ville?: string }>;

export default async function SuiviPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const secteurs = await prisma.secteur.findMany({ orderBy: { numero: "asc" } });

  const where: Record<string, unknown> = {};
  if (sp.secteur) where.secteurId = sp.secteur;
  if (sp.ville) where.villeNom = { contains: sp.ville };
  if (sp.q) {
    where.OR = [
      { nom: { contains: sp.q } },
      { prenom: { contains: sp.q } },
      { numContrat: { contains: sp.q } },
      { rue: { contains: sp.q } },
      { statut: { contains: sp.q } },
    ];
  }

  const contrats = await prisma.contrat.findMany({
    where,
    include: { secteur: true },
    orderBy: [{ date: "desc" }, { nom: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Liste de suivi 2026"
        subtitle="Contrats gouttières — source Excel Champoux"
        actions={
          <Link href="/suivi/nouveau"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
            + Nouveau contrat
          </Link>
        }
      />

      <form className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Recherche</label>
          <input name="q" defaultValue={sp.q || ""} placeholder="Nom, # contrat, notes…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Ville</label>
          <input name="ville" defaultValue={sp.ville || ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Secteur</label>
          <select name="secteur" defaultValue={sp.secteur || ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Tous (1–7)</option>
            {secteurs.map((s) => (
              <option key={s.id} value={s.id}>{s.nom}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white">Filtrer</button>
          <Link href="/suivi" className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600">Réinit.</Link>
        </div>
      </form>

      {contrats.length === 0 ? (
        <EmptyState title="Aucun contrat" description="Importez l'Excel ou créez un contrat."
          action={<Link href="/suivi/nouveau" className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white">Créer</Link>} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Client</th>
                <th className="px-3 py-3">Adresse</th>
                <th className="px-3 py-3">Secteur</th>
                <th className="px-3 py-3">Gouttière</th>
                <th className="px-3 py-3">Montant</th>
                <th className="px-3 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contrats.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-600">
                    <Link href={`/suivi/${c.id}`} className="text-sky-700 hover:underline">
                      {c.numContrat || "—"}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{formatDate(c.date)}</td>
                  <td className="px-3 py-2.5 font-medium">{fullName(c.nom, c.prenom)}</td>
                  <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-600" title={fullAddress(c.civique, c.rue, c.villeNom)}>
                    {fullAddress(c.civique, c.rue, c.villeNom)}
                  </td>
                  <td className="px-3 py-2.5">
                    {c.secteur ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.secteur.couleur }} />
                        {c.secteur.numero}
                      </span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="max-w-[120px] truncate px-3 py-2.5 text-slate-600">{c.gouttiere || "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium">{formatMoney(c.montant)}</td>
                  <td className="max-w-[160px] truncate px-3 py-2.5 text-xs text-slate-500" title={c.statut || ""}>
                    {c.statut || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
            {contrats.length} contrat(s)
          </div>
        </div>
      )}
    </div>
  );
}
