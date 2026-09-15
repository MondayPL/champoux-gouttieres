import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SECTEUR_COLORS } from "@/lib/constants";

export async function GET() {
  const secteurs = await prisma.secteur.findMany({
    include: {
      villes: { orderBy: { nom: "asc" } },
      _count: { select: { contrats: true } },
    },
    orderBy: { numero: "asc" },
  });
  return NextResponse.json(secteurs);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const numero = Number(body.numero);
    if (!numero || numero < 1) {
      return NextResponse.json({ error: "numero requis (1–7)." }, { status: 400 });
    }
    const created = await prisma.secteur.create({
      data: {
        numero,
        nom: body.nom || `Secteur ${numero}`,
        couleur: body.couleur || SECTEUR_COLORS[numero] || "#3B82F6",
      },
    });
    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: "Erreur (numéro déjà utilisé ?)." }, { status: 400 });
  }
}
