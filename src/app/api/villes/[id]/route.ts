import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normVille } from "@/lib/normalize";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const data: { nom?: string; nomNorm?: string; secteurId?: string } = {};
  if (body.nom != null) {
    data.nom = String(body.nom).trim();
    data.nomNorm = normVille(data.nom);
  }
  if (body.secteurId != null) data.secteurId = String(body.secteurId);
  return NextResponse.json(await prisma.ville.update({ where: { id }, data }));
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.ville.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
