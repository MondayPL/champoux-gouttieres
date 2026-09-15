import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const routes = await prisma.route.findMany({
    include: {
      secteur: true,
      installateur: true,
      stops: { include: { contrat: true }, orderBy: { ordre: "asc" } },
    },
    orderBy: [{ semaine: "asc" }, { jourSemaine: "asc" }],
  });
  return NextResponse.json(routes);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const semaine = Number(body.semaine);
    const jourSemaine = Number(body.jourSemaine);
    if (!semaine || !jourSemaine || jourSemaine < 1 || jourSemaine > 5) {
      return NextResponse.json(
        { error: "semaine et jourSemaine (1–5) requis." },
        { status: 400 }
      );
    }
    const created = await prisma.route.create({
      data: {
        semaine,
        jourSemaine,
        nom: body.nom || `Semaine ${semaine}`,
        notes: body.notes || null,
        secteurId: body.secteurId || null,
        installateurId: body.installateurId || null,
      },
      include: {
        secteur: true,
        installateur: true,
        stops: { include: { contrat: true } },
      },
    });
    return NextResponse.json(created);
  } catch (e: unknown) {
    const dup =
      e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002";
    return NextResponse.json(
      { error: dup ? "Une tournée existe déjà pour ce jour." : "Erreur de création." },
      { status: 400 }
    );
  }
}
