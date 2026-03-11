import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "이메일을 입력해주세요" },
      { status: 400 }
    );
  }

  const organized = await prisma.event.findMany({
    where: { organizerEmail: email },
    select: {
      id: true,
      title: true,
      slug: true,
      organizerName: true,
      createdAt: true,
      participants: { select: { id: true } },
      dates: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const participated = await prisma.participant.findMany({
    where: { email },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          organizerName: true,
          createdAt: true,
          participants: { select: { id: true } },
          dates: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const participatedEvents = participated
    .map((p) => p.event)
    .filter((e) => !organized.some((o) => o.id === e.id));

  return NextResponse.json({
    organized,
    participated: participatedEvents,
  });
}
