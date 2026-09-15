import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id: routeId } = await ctx.params;
    const body = await req.json();
    if (!body.contratId) {
      return NextResponse.json({ error: "contratId requis." }, { status: 400 });
    }
    const max = await prisma.routeStop.aggregate({
      where: { routeId },
      _max: { ordre: true },
    });
    const stop = await prisma.routeStop.create({
      data: {
        routeId,
        contratId: body.contratId,
        ordre: (max._max.ordre ?? -1) + 1,
      },
      include: { contrat: true },
    });
    return NextResponse.json(stop);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Déjà sur cette tournée." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id: routeId } = await ctx.params;
    const body = await req.json();
    const orderedStopIds: string[] = body.orderedStopIds || [];
    await prisma.$transaction(
      orderedStopIds.map((stopId, ordre) =>
        prisma.routeStop.update({ where: { id: stopId }, data: { ordre, routeId } })
      )
    );
    return NextResponse.json(
      await prisma.routeStop.findMany({
        where: { routeId },
        include: { contrat: true },
        orderBy: { ordre: "asc" },
      })
    );
  } catch {
    return NextResponse.json({ error: "Erreur de réordonnancement." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id: fromRouteId } = await ctx.params;
    const body = await req.json();
    const { stopId, toRouteId } = body;
    if (!stopId || !toRouteId) {
      return NextResponse.json({ error: "stopId et toRouteId requis." }, { status: 400 });
    }
    const max = await prisma.routeStop.aggregate({
      where: { routeId: toRouteId },
      _max: { ordre: true },
    });
    const stop = await prisma.routeStop.update({
      where: { id: stopId },
      data: { routeId: toRouteId, ordre: (max._max.ordre ?? -1) + 1 },
    });
    const remaining = await prisma.routeStop.findMany({
      where: { routeId: fromRouteId },
      orderBy: { ordre: "asc" },
    });
    await prisma.$transaction(
      remaining.map((s, i) =>
        prisma.routeStop.update({ where: { id: s.id }, data: { ordre: i } })
      )
    );
    return NextResponse.json(stop);
  } catch {
    return NextResponse.json({ error: "Erreur de déplacement." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const { id: routeId } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const stopId = body.stopId as string | undefined;
    if (!stopId) {
      return NextResponse.json({ error: "stopId requis." }, { status: 400 });
    }
    const existing = await prisma.routeStop.findFirst({
      where: { id: stopId, routeId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Arrêt introuvable sur cette tournée." }, { status: 404 });
    }
    await prisma.routeStop.delete({ where: { id: stopId } });
    const remaining = await prisma.routeStop.findMany({
      where: { routeId },
      orderBy: { ordre: "asc" },
    });
    await prisma.$transaction(
      remaining.map((s, i) =>
        prisma.routeStop.update({ where: { id: s.id }, data: { ordre: i } })
      )
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur de retrait." }, { status: 500 });
  }
}
