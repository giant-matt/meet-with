import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const GRACE_PERIOD_DAYS = 7;

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - GRACE_PERIOD_DAYS);

  // Find events where ALL dates are before the cutoff
  const expiredEvents = await prisma.event.findMany({
    where: {
      dates: {
        every: {
          date: { lt: cutoffDate },
        },
        some: {}, // Ensure at least one date exists
      },
    },
    select: { id: true, slug: true },
  });

  if (expiredEvents.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  // Cascade delete removes all related data (dates, participants, responses)
  const result = await prisma.event.deleteMany({
    where: {
      id: { in: expiredEvents.map((e) => e.id) },
    },
  });

  return NextResponse.json({
    deleted: result.count,
    slugs: expiredEvents.map((e) => e.slug),
  });
}
