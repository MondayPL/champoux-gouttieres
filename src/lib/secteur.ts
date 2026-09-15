import { prisma } from "./prisma";
import { normVille } from "./normalize";

export async function findSecteurForVille(villeNom: string | null | undefined) {
  const n = normVille(villeNom);
  if (!n) return null;
  const ville = await prisma.ville.findUnique({
    where: { nomNorm: n },
    include: { secteur: true },
  });
  if (ville) return ville.secteur;
  // partial: ST-CHRISTOPHE matches ST-CHRISTOPHE-...
  const all = await prisma.ville.findMany({ include: { secteur: true } });
  const match = all.find(
    (v) => n.startsWith(v.nomNorm) || v.nomNorm.startsWith(n)
  );
  return match?.secteur ?? null;
}

export async function assignSecteurId(villeNom: string | null | undefined) {
  const secteur = await findSecteurForVille(villeNom);
  return secteur?.id ?? null;
}
