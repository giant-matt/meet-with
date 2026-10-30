import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { handleApiError, jsonError, isValidHostToken } from "@/lib/api-errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const hostToken = new URL(request.url).searchParams.get("hostToken");

    const event = await prisma.event.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        organizerName: true,
        organizerEmail: true,
        hostToken: true,
        mode: true,
        timeRangeStart: true,
        timeRangeEnd: true,
        slotDuration: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
        dates: {
          select: { id: true, date: true },
          orderBy: { date: "asc" },
        },
        participants: {
          select: {
            id: true,
            name: true,
            responses: {
              select: { eventDateId: true, startTime: true, endTime: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!event) {
      return jsonError("약속을 찾을 수 없습니다", 404);
    }

    // organizerEmail/hostToken은 주최자 본인(올바른 hostToken 제공)에게만 노출
    const isHost = !!hostToken && !!event.hostToken && hostToken === event.hostToken;

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        organizerName: event.organizerName,
        ...(isHost ? { organizerEmail: event.organizerEmail } : {}),
        mode: event.mode,
        timeRangeStart: event.timeRangeStart,
        timeRangeEnd: event.timeRangeEnd,
        slotDuration: event.slotDuration,
        timezone: event.timezone,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        dates: event.dates,
        participants: event.participants,
      },
    });
  } catch (error) {
    return handleApiError(
      "GET /api/events/[slug]",
      error,
      "약속 조회에 실패했습니다"
    );
  }
}

const updateEventSchema = z.object({
  hostToken: z.string().min(1, "권한이 없습니다"),
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
      return jsonError("약속을 찾을 수 없습니다", 404);
    }

    // Verify host token
    if (!isValidHostToken(existing.hostToken, data.hostToken)) {
      return jsonError("권한이 없습니다", 403);
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

    await prisma.event.update({
      where: { slug },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(
      "PUT /api/events/[slug]",
      error,
      "약속 수정에 실패했습니다"
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { hostToken } = await request.json();

    if (!hostToken) {
      return jsonError("권한이 없습니다", 400);
    }

    const existing = await prisma.event.findUnique({
      where: { slug },
    });

    if (!existing) {
      return jsonError("약속을 찾을 수 없습니다", 404);
    }

    if (!isValidHostToken(existing.hostToken, hostToken)) {
      return jsonError("권한이 없습니다", 403);
    }

    await prisma.event.delete({ where: { slug } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(
      "DELETE /api/events/[slug]",
      error,
      "약속 삭제에 실패했습니다"
    );
  }
}
