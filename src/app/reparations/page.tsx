import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { ReparationsClient } from "@/components/ReparationsClient";

export const dynamic = "force-dynamic";

export default async function ReparationsPage() {
  const items = await prisma.reparation.findMany({
    orderBy: [{ date: "desc" }, { nom: "asc" }],
  });
  const serialized = items.map((r) => ({
    ...r,
    date: r.date?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader
        title="Liste de réparation 2026"
        subtitle="Travaux · lien CONTRAT GOUTTIÈRE · fait / à faire"
      />
      <ReparationsClient initial={serialized} />
    </div>
  );
}
