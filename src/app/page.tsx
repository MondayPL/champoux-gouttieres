import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [contrats, comptes, reparations, villes, routes, totalMontant] =
    await Promise.all([
      prisma.contrat.count(),
      prisma.compteRendu.count(),
      prisma.reparation.count(),
      prisma.ville.count(),
      prisma.route.count(),
      prisma.contrat.aggregate({ _sum: { montant: true } }),
    ]);

  const aFaire = await prisma.reparation.count({
    where: { etat: "à faire" },
  });

  const cards = [
    {
      href: "/suivi",
      title: "Liste de suivi 2026",
      value: String(contrats),
      desc: `Pipeline ${formatMoney(totalMontant._sum.montant || 0)}`,
      color: "bg-sky-600",
    },
    {
      href: "/compte-rendu",
      title: "Compte rendu",
      value: String(comptes),
      desc: "Travaux complétés / montants",
      color: "bg-emerald-600",
    },
    {
      href: "/couleurs",
      title: "Couleurs",
      value: "Charte",
      desc: "Référence couleurs gouttières",
      color: "bg-amber-600",
    },
    {
      href: "/reparations",
      title: "Réparations 2026",
      value: String(reparations),
      desc: `${aFaire} à faire`,
      color: "bg-rose-600",
    },
    {
      href: "/villes",
      title: "Villes / Secteurs",
      value: String(villes),
      desc: "Secteurs 1 à 7",
      color: "bg-violet-600",
    },
    {
      href: "/calendrier",
      title: "Calendrier",
      value: String(routes),
      desc: "Tournées par secteur",
      color: "bg-slate-700",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle="Données importées du classeur Excel Champoux — Québec"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <div
              className={`mb-3 inline-flex min-w-[2.5rem] items-center justify-center rounded-xl px-2 py-2 text-sm font-bold text-white ${c.color}`}
            >
              {c.value}
            </div>
            <h2 className="text-lg font-semibold text-slate-900 group-hover:text-sky-700">
              {c.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
