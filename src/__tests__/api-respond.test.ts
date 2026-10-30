import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEventFindUnique = vi.fn();
const mockParticipantFindUnique = vi.fn();
const mockParticipantUpdate = vi.fn();
const mockParticipantCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    event: {
      findUnique: (...a: unknown[]) => mockEventFindUnique(...a),
    },
    participant: {
      findUnique: (...a: unknown[]) => mockParticipantFindUnique(...a),
      update: (...a: unknown[]) => mockParticipantUpdate(...a),
      create: (...a: unknown[]) => mockParticipantCreate(...a),
    },
    response: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}));

import { POST } from "@/app/api/events/[slug]/respond/route";

const baseEvent = {
  id: "evt1",
  slotDuration: 30,
  dates: [{ id: "date1" }],
};

function routeParams(slug = "abc12345") {
  return { params: Promise.resolve({ slug }) };
}

function makeRequest(body: unknown, slug = "abc12345") {
  return new Request(`http://localhost/api/events/${slug}/respond`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/events/[slug]/respond", () => {
  beforeEach(() => {
    mockEventFindUnique.mockReset();
    mockParticipantFindUnique.mockReset();
    mockParticipantUpdate.mockReset();
    mockParticipantCreate.mockReset();
    mockTransaction.mockReset().mockResolvedValue([]);
  });

  it("새 참여자는 editToken을 새로 발급받는다", async () => {
    mockEventFindUnique.mockResolvedValue(baseEvent);
    mockParticipantFindUnique.mockResolvedValue(null);
    mockParticipantCreate.mockImplementation(async (args: { data: { editToken: string } }) => ({
      id: "p1",
      name: "김철수",
      editToken: args.data.editToken,
    }));

    const res = await POST(
      makeRequest({
        participantName: "김철수",
        availability: { date1: ["09:00"] },
      }),
      routeParams()
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.editToken).toBe("string");
    expect(json.editToken.length).toBeGreaterThan(0);

    const createArg = mockParticipantCreate.mock.calls[0][0] as {
      data: { editToken: string };
    };
    expect(createArg.data.editToken).toBe(json.editToken);
  });

  it("기존 참여자의 editToken이 틀리면 403을 반환하고 응답을 수정하지 않는다", async () => {
    mockEventFindUnique.mockResolvedValue(baseEvent);
    mockParticipantFindUnique.mockResolvedValue({
      id: "p1",
      editToken: "real-token",
    });

    const res = await POST(
      makeRequest({
        participantName: "김철수",
        editToken: "wrong-token",
        availability: {},
      }),
      routeParams()
    );
    expect(res.status).toBe(403);
    expect(mockParticipantUpdate).not.toHaveBeenCalled();
  });

  it("올바른 editToken이면 기존 참여자의 응답을 갱신한다", async () => {
    mockEventFindUnique.mockResolvedValue(baseEvent);
    mockParticipantFindUnique.mockResolvedValue({
      id: "p1",
      editToken: "real-token",
    });
    mockParticipantUpdate.mockResolvedValue({ id: "p1", name: "김철수", editToken: "real-token" });

    const res = await POST(
      makeRequest({
        participantName: "김철수",
        editToken: "real-token",
        availability: { date1: ["09:00"] },
      }),
      routeParams()
    );
    expect(res.status).toBe(200);
    expect(mockParticipantUpdate).toHaveBeenCalledOnce();
  });

  it("존재하지 않는 날짜 ID를 보내면 400을 반환한다", async () => {
    mockEventFindUnique.mockResolvedValue(baseEvent);
    const res = await POST(
      makeRequest({
        participantName: "김철수",
        availability: { "invalid-date": ["09:00"] },
      }),
      routeParams()
    );
    expect(res.status).toBe(400);
  });

  it("잘못된 시간 형식은 400을 반환한다", async () => {
    mockEventFindUnique.mockResolvedValue(baseEvent);
    const res = await POST(
      makeRequest({
        participantName: "김철수",
        availability: { date1: ["9:00"] },
      }),
      routeParams()
    );
    expect(res.status).toBe(400);
  });

  it("존재하지 않는 이벤트는 404를 반환한다", async () => {
    mockEventFindUnique.mockResolvedValue(null);
    const res = await POST(
      makeRequest({ participantName: "김철수", availability: {} }, "nope"),
      routeParams("nope")
    );
    expect(res.status).toBe(404);
  });
});
