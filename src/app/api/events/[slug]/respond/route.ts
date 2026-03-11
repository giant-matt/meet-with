import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logError } from "@/lib/logger";

const respondSchema = z.object({
  participantName: z.string().min(1, "이름을 입력해주세요"),
  participantEmail: z.string().email("올바른 이메일을 입력해주세요").optional().or(z.literal("")),
  availability: z.record(z.string(), z.array(z.string())),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const data = respondSchema.parse(body);

    const event = await prisma.event.findUnique({
      where: { slug },
      include: { dates: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: "약속을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const validDateIds = new Set(event.dates.map((d) => d.id));
    for (const dateId of Object.keys(data.availability)) {
      if (!validDateIds.has(dateId)) {
        return NextResponse.json(
          { error: "유효하지 않은 날짜입니다" },
          { status: 400 }
        );
      }
    }

    const participant = await prisma.participant.upsert({
      where: {
        eventId_name: {
          eventId: event.id,
          name: data.participantName,
        },
      },
      update: { email: data.participantEmail || "" },
      create: {
        eventId: event.id,
        name: data.participantName,
        email: data.participantEmail || "",
      },
    });

    await prisma.response.deleteMany({
      where: { participantId: participant.id },
    });

    const responses: {
      participantId: string;
      eventDateId: string;
      startTime: string;
      endTime: string;
    }[] = [];

    for (const [eventDateId, startTimes] of Object.entries(data.availability)) {
      for (const startTime of startTimes) {
        const [h, m] = startTime.split(":").map(Number);
        const endMinutes = h * 60 + m + event.slotDuration;
        const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

        responses.push({
          participantId: participant.id,
          eventDateId,
          startTime,
          endTime,
        });
      }
    }

    if (responses.length > 0) {
      await prisma.response.createMany({
        data: responses,
      });
    }

    return NextResponse.json({
      participant,
      responseCount: responses.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    logError("POST /api/events/[slug]/respond", error);
    return NextResponse.json(
      { error: "응답 저장에 실패했습니다" },
      { status: 500 }
    );
  }
}
