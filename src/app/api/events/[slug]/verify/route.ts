import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logError } from "@/lib/logger";
import { emailsMatch } from "@/lib/email";

const verifySchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const data = verifySchema.parse(body);

    const event = await prisma.event.findUnique({
      where: { slug },
      select: { organizerEmail: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: "약속을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (!emailsMatch(data.email, event.organizerEmail)) {
      return NextResponse.json(
        { error: "주최자 이메일이 일치하지 않습니다" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      verified: true,
      organizerEmail: event.organizerEmail,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    logError("POST /api/events/[slug]/verify", error);
    return NextResponse.json(
      { error: "인증에 실패했습니다" },
      { status: 500 }
    );
  }
}
