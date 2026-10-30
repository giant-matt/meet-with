import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    event: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

import { POST } from "@/app/api/events/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const validBody = {
  title: "팀 회의",
  organizerName: "홍길동",
  organizerEmail: "test@example.com",
  mode: "DATETIME" as const,
  dates: ["2026-03-15"],
};

describe("POST /api/events", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("유효한 입력으로 이벤트를 생성하고 slug/hostToken을 반환한다", async () => {
    mockCreate.mockResolvedValue({
      slug: "abc12345",
      hostToken: "host-token-xyz",
      dates: [{ id: "d1", date: new Date("2026-03-15") }],
    });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.event.slug).toBe("abc12345");
    expect(json.event.hostToken).toBe("host-token-xyz");

    const createArg = mockCreate.mock.calls[0][0] as { data: { hostToken: string } };
    expect(createArg.data.hostToken).toBeTruthy();
  });

  it("제목이 비어있으면 400을 반환하고 DB를 호출하지 않는다", async () => {
    const res = await POST(makeRequest({ ...validBody, title: "" }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("날짜가 비어있으면 400을 반환한다", async () => {
    const res = await POST(makeRequest({ ...validBody, dates: [] }));
    expect(res.status).toBe(400);
  });

  it("DB 오류 시 500을 반환한다", async () => {
    mockCreate.mockRejectedValue(new Error("db down"));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
  });
});
