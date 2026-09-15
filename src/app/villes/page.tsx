import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { VillesManager } from "@/components/VillesManager";

export const dynamic = "force-dynamic";

export default async function VillesPage() {
  const secteurs = await prisma.secteur.findMany({
    include: {
      villes: { orderBy: { nom: "asc" } },
      _count: { select: { contrats: true } },
    },
    orderBy: { numero: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Villes & secteurs 1–7"
        subtitle="Feuille Ville — base du calendrier de tournées"
      />
      <VillesManager initialSecteurs={secteurs} />
      <p className="mt-6 text-sm text-slate-500">
        Voir les contrats par secteur dans{" "}
        <Link href="/suivi" className="text-sky-700 hover:underline">Suivi 2026</Link>.
      </p>
    </div>
  );
}
