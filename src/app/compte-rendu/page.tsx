import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CompteRenduPage() {
  const items = await prisma.compteRendu.findMany({
    orderBy: [{ dateFait: "desc" }, { nom: "asc" }],
  });
  const total = items.reduce((s, x) => s + (x.montant || 0), 0);

  return (
    <div>
      <PageHeader
        title="Compte rendu"
        subtitle={`NOM · MONTANT · DATE FAIT — total ${formatMoney(total)}`}
      />
      {items.length === 0 ? (
        <EmptyState title="Aucun compte rendu" description="Importez la feuille Excel Compte rendu." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Date fait</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium">{i.nom}</td>
                  <td className="px-4 py-2.5">{formatMoney(i.montant)}</td>
                  <td className="px-4 py-2.5 text-slate-600">{formatDate(i.dateFait)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t px-4 py-2 text-xs text-slate-500">{items.length} entrée(s)</div>
        </div>
      )}
    </div>
  );
}
