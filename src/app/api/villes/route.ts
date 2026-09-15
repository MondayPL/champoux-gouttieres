import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normVille } from "@/lib/normalize";

export async function GET() {
  return NextResponse.json(
    await prisma.ville.findMany({ include: { secteur: true }, orderBy: { nom: "asc" } })
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.nom?.trim() || !body.secteurId) {
      return NextResponse.json({ error: "Nom et secteurId requis." }, { status: 400 });
    }
    const nom = body.nom.trim();
    const created = await prisma.ville.create({
      data: { nom, nomNorm: normVille(nom), secteurId: body.secteurId },
    });
    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: "Ville déjà existante ?" }, { status: 400 });
  }
}
