import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";
import { z } from "zod";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        dates: {
          orderBy: { date: "asc" },
        },
        participants: {
          include: {
            responses: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "약속을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    logError("GET /api/events/[slug]", error);
    return NextResponse.json(
      { error: "약속 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

const updateEventSchema = z.object({
  verifyEmail: z.string().email("이메일 인증이 필요합니다"),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  organizerName: z.string().min(1).optional(),
  organizerEmail: z.string().email().optional(),
  mode: z.enum(["DATETIME", "DATE_ONLY"]).optional(),
  dates: z.array(z.string()).min(1).optional(),
  timeRangeStart: z.string().optional(),
  timeRangeEnd: z.string().optional(),
  slotDuration: z.number().min(15).max(60).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const data = updateEventSchema.parse(body);

    const existing = await prisma.event.findUnique({
      where: { slug },
      include: { dates: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "약속을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Verify organizer email
    if (data.verifyEmail.toLowerCase() !== existing.organizerEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "주최자 이메일이 일치하지 않습니다" },
        { status: 403 }
      );
    }

    // Build update payload
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.organizerName !== undefined) updateData.organizerName = data.organizerName;
    if (data.organizerEmail !== undefined) updateData.organizerEmail = data.organizerEmail;
    if (data.mode !== undefined) updateData.mode = data.mode;
    if (data.timeRangeStart !== undefined) updateData.timeRangeStart = data.timeRangeStart;
    if (data.timeRangeEnd !== undefined) updateData.timeRangeEnd = data.timeRangeEnd;
    if (data.slotDuration !== undefined) updateData.slotDuration = data.slotDuration;

    // If dates changed, delete removed dates (and their responses cascade) + add new ones
    if (data.dates) {
      const newDateStrs = new Set(data.dates);
      const existingDateStrs = existing.dates.map((d) =>
        d.date.toISOString().split("T")[0]
      );

      // Dates to remove
      const datesToRemove = existing.dates.filter(
        (d) => !newDateStrs.has(d.date.toISOString().split("T")[0])
      );

      // Dates to add
      const datesToAdd = data.dates.filter(
        (ds) => !existingDateStrs.includes(ds)
      );

      if (datesToRemove.length > 0) {
        await prisma.eventDate.deleteMany({
          where: {
            id: { in: datesToRemove.map((d) => d.id) },
          },
        });
      }

      if (datesToAdd.length > 0) {
        await prisma.eventDate.createMany({
          data: datesToAdd.map((dateStr) => ({
            eventId: existing.id,
            date: new Date(dateStr),
          })),
        });
      }
    }

    const event = await prisma.event.update({
      where: { slug },
      data: updateData,
      include: {
        dates: { orderBy: { date: "asc" } },
        participants: {
          include: { responses: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    logError("PUT /api/events/[slug]", error);
    return NextResponse.json(
      { error: "약속 수정에 실패했습니다" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "이메일 인증이 필요합니다" },
        { status: 400 }
      );
    }

    const existing = await prisma.event.findUnique({
      where: { slug },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "약속을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (email.toLowerCase() !== existing.organizerEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "주최자 이메일이 일치하지 않습니다" },
        { status: 403 }
      );
    }

    await prisma.event.delete({ where: { slug } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("DELETE /api/events/[slug]", error);
    return NextResponse.json(
      { error: "약속 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}
