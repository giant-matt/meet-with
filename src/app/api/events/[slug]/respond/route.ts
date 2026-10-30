import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { nanoid } from "nanoid";
import { handleApiError, jsonError } from "@/lib/api-errors";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "시간 형식이 올바르지 않습니다");

const respondSchema = z.object({
  participantName: z.string().min(1, "이름을 입력해주세요").max(50, "이름이 너무 깁니다"),
  participantEmail: z.string().email("올바른 이메일을 입력해주세요").max(254).optional().or(z.literal("")),
  editToken: z.string().max(100).optional(),
  availability: z
    .record(z.string(), z.array(timeSchema).max(200, "선택한 시간이 너무 많습니다"))
    .refine((obj) => Object.keys(obj).length <= 60, "날짜가 너무 많습니다"),
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
      return jsonError("약속을 찾을 수 없습니다", 404);
    }

    const validDateIds = new Set(event.dates.map((d) => d.id));
    for (const dateId of Object.keys(data.availability)) {
      if (!validDateIds.has(dateId)) {
        return jsonError("유효하지 않은 날짜입니다", 400);
      }
    }

    // Check if participant already exists
    const existing = await prisma.participant.findUnique({
      where: {
        eventId_name: {
          eventId: event.id,
          name: data.participantName,
        },
      },
    });

    let participant;
    let newEditToken: string | undefined;

    if (existing) {
      // Existing participant: verify editToken
      if (existing.editToken && existing.editToken !== "") {
        if (!data.editToken || data.editToken !== existing.editToken) {
          return jsonError(
            "이 이름으로 이미 응답이 등록되어 있습니다. 같은 기기에서만 수정할 수 있습니다.",
            403
          );
        }
      }
      // Token matches or no token set (legacy data) — allow update
      participant = await prisma.participant.update({
        where: { id: existing.id },
        data: {
          email: data.participantEmail || "",
          // If legacy participant has no token, generate one now
          ...(existing.editToken === "" ? { editToken: nanoid(16) } : {}),
        },
      });
      // Return the token for legacy participants who just got one
      if (existing.editToken === "") {
        newEditToken = participant.editToken;
      }
    } else {
      // New participant: generate editToken
      newEditToken = nanoid(16);
      participant = await prisma.participant.create({
        data: {
          eventId: event.id,
          name: data.participantName,
          email: data.participantEmail || "",
          editToken: newEditToken,
        },
      });
    }

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

    await prisma.$transaction([
      prisma.response.deleteMany({ where: { participantId: participant.id } }),
      ...(responses.length > 0
        ? [prisma.response.createMany({ data: responses })]
        : []),
    ]);

    return NextResponse.json({
      participant: { id: participant.id, name: participant.name },
      responseCount: responses.length,
      ...(newEditToken ? { editToken: newEditToken } : {}),
    });
  } catch (error) {
    return handleApiError(
      "POST /api/events/[slug]/respond",
      error,
      "응답 저장에 실패했습니다"
    );
  }
}
