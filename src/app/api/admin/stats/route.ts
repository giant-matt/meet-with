import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const password = request.headers.get("x-admin-password");
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalEvents,
    totalParticipants,
    totalResponses,
    recentEvents,
    last7DaysEvents,
  ] = await Promise.all([
    prisma.event.count(),
    prisma.participant.count(),
    prisma.response.count(),
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: { select: { participants: true, dates: true } },
      },
    }),
    prisma.event.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return NextResponse.json({
    summary: {
      totalEvents,
      totalParticipants,
      totalResponses,
      last7DaysEvents,
    },
    recentEvents: recentEvents.map((e) => ({
      title: e.title,
      slug: e.slug,
      organizerName: e.organizerName,
      organizerEmail: e.organizerEmail,
      mode: e.mode,
      participantCount: e._count.participants,
      dateCount: e._count.dates,
      createdAt: e.createdAt,
    })),
  });
}
