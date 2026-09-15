import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignSecteurId } from "@/lib/secteur";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const secteurId = await assignSecteurId(body.villeNom);
    const updated = await prisma.contrat.update({
      where: { id },
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
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur de mise à jour." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.contrat.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
