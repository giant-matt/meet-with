import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { nanoid } from "nanoid";
import { handleApiError } from "@/lib/api-errors";
import { dateSchema, timeSchema } from "@/lib/schemas";

const createEventSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200, "제목이 너무 깁니다"),
  organizerName: z.string().min(1, "이름을 입력해주세요").max(50, "이름이 너무 깁니다"),
  organizerEmail: z.string().email("올바른 이메일을 입력해주세요").max(254),
  description: z.string().max(2000, "설명이 너무 깁니다").optional(),
  mode: z.enum(["DATETIME", "DATE_ONLY"]),
  dates: z.array(dateSchema).min(1, "날짜를 하나 이상 선택해주세요").max(60, "날짜는 60개까지 고를 수 있습니다"),
  timeRangeStart: timeSchema.default("09:00"),
  timeRangeEnd: timeSchema.default("18:00"),
  slotDuration: z.number().min(15).max(60).default(30),
  timezone: z.string().max(64).default("Asia/Seoul"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createEventSchema.parse(body);

    const slug = nanoid(8);
    const hostToken = nanoid(24);

    const event = await prisma.event.create({
      data: {
        title: data.title,
        slug,
        hostToken,
        description: data.description,
        organizerName: data.organizerName,
        organizerEmail: data.organizerEmail,
        mode: data.mode,
        timeRangeStart: data.timeRangeStart,
        timeRangeEnd: data.timeRangeEnd,
        slotDuration: data.slotDuration,
        timezone: data.timezone,
        dates: {
          create: data.dates.map((dateStr) => ({
            date: new Date(dateStr),
          })),
        },
      },
      select: {
        slug: true,
        hostToken: true,
        dates: { select: { id: true, date: true } },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return handleApiError("POST /api/events", error, "약속 생성에 실패했습니다");
  }
}
