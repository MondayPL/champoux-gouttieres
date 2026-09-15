import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const updated = await prisma.reparation.update({
    where: { id },
    data: { etat: body.etat || null },
  });
  return NextResponse.json(updated);
}
