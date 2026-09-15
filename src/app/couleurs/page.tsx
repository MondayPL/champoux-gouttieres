import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function CouleursPage() {
  const couleurs = await prisma.couleur.findMany({ orderBy: [{ colonne: "asc" }, { ordre: "asc" }] });
  const byCol = new Map<number, typeof couleurs>();
  for (const c of couleurs) {
    if (!byCol.has(c.colonne)) byCol.set(c.colonne, []);
    byCol.get(c.colonne)!.push(c);
  }

  return (
    <div>
      <PageHeader title="Charte des couleurs" subtitle="Feuille Couleur du classeur Excel" />
      {couleurs.length === 0 ? (
        <EmptyState title="Aucune couleur" description="Réimportez la feuille Couleur." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...byCol.entries()].map(([col, list]) => (
            <div key={col} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Colonne {col}
              </h2>
              <ul className="space-y-3">
                {list.map((c) => (
                  <li key={c.id} className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="font-medium text-slate-900">{c.nomFr}</div>
                    {c.nomEn && <div className="text-xs text-slate-500">{c.nomEn}</div>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
