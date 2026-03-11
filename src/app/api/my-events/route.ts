import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logError } from "@/lib/logger";

const emailSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다").max(254),
});

export async function GET(request: NextRequest) {
  try {
  const rawEmail = request.nextUrl.searchParams.get("email");

  if (!rawEmail) {
    return NextResponse.json(
      { error: "이메일을 입력해주세요" },
      { status: 400 }
    );
  }

  // Validate email format to prevent arbitrary queries
  const { email } = emailSchema.parse({ email: rawEmail.trim().toLowerCase() });

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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    logError("GET /api/my-events", error);
    return NextResponse.json(
      { error: "조회에 실패했습니다" },
      { status: 500 }
    );
  }
}
