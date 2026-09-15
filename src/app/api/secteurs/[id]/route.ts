import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const data: { nom?: string; couleur?: string; numero?: number } = {};
  if (body.nom != null) data.nom = String(body.nom).trim();
  if (body.couleur != null) data.couleur = String(body.couleur);
  if (body.numero != null) data.numero = Number(body.numero);
  return NextResponse.json(await prisma.secteur.update({ where: { id }, data }));
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.secteur.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
