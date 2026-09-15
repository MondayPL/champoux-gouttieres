import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignSecteurId } from "@/lib/secteur";

export async function GET() {
  const items = await prisma.contrat.findMany({
    include: { secteur: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const secteurId = await assignSecteurId(body.villeNom);
    const created = await prisma.contrat.create({
      data: {
        numContrat: body.numContrat || null,
        date: body.date ? new Date(body.date) : null,
        nom: body.nom || null,
        prenom: body.prenom || null,
        telephone: body.telephone || null,
        civique: body.civique || null,
        rue: body.rue || null,
        villeNom: body.villeNom || null,
        gouttiere: body.gouttiere || null,
        piedLinG: body.piedLinG != null && body.piedLinG !== "" ? Number(body.piedLinG) : null,
        descente: body.descente || null,
        piedLinD: body.piedLinD != null && body.piedLinD !== "" ? Number(body.piedLinD) : null,
        equip: body.equip || null,
        enlvExist: !!body.enlvExist,
        friseIncl: !!body.friseIncl,
        toitTole: !!body.toitTole,
        montant: body.montant != null && body.montant !== "" ? Number(body.montant) : null,
        grille: body.grille || null,
        piedLinGr: body.piedLinGr != null && body.piedLinGr !== "" ? Number(body.piedLinGr) : null,
        statut: body.statut || null,
        colonne2: body.colonne2 || null,
        secteurId,
      },
    });
    return NextResponse.json(created);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur de création." }, { status: 500 });
  }
}
