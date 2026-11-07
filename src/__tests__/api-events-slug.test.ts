import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockDeleteMany = vi.fn();
const mockCreateMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    event: {
      findUnique: (...a: unknown[]) => mockFindUnique(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
      delete: (...a: unknown[]) => mockDelete(...a),
    },
    eventDate: {
      deleteMany: (...a: unknown[]) => mockDeleteMany(...a),
      createMany: (...a: unknown[]) => mockCreateMany(...a),
    },
  },
}));

import { GET, PUT, DELETE } from "@/app/api/events/[slug]/route";

const baseEvent = {
  id: "evt1",
  title: "팀 회의",
  slug: "abc12345",
  description: null,
  organizerName: "홍길동",
  organizerEmail: "host@example.com",
  hostToken: "secret-token",
  mode: "DATETIME",
  timeRangeStart: "09:00",
  timeRangeEnd: "18:00",
  slotDuration: 30,
  timezone: "Asia/Seoul",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  dates: [],
  participants: [],
};

function routeParams(slug = "abc12345") {
  return { params: Promise.resolve({ slug }) };
}

describe("GET /api/events/[slug]", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
  });

  it("hostToken 없이 조회하면 organizerEmail을 숨긴다", async () => {
    mockFindUnique.mockResolvedValue(baseEvent);
    const req = new Request("http://localhost/api/events/abc12345");
    const res = await GET(req, routeParams());
    const json = await res.json();
    expect(json.event.organizerEmail).toBeUndefined();
  });

  it("올바른 hostToken으로 조회하면 organizerEmail을 노출한다", async () => {
    mockFindUnique.mockResolvedValue(baseEvent);
    const req = new Request("http://localhost/api/events/abc12345", {
      headers: { "x-host-token": "secret-token" },
    });
    const res = await GET(req, routeParams());
    const json = await res.json();
    expect(json.event.organizerEmail).toBe("host@example.com");
  });

  it("틀린 hostToken으로 조회하면 organizerEmail을 계속 숨긴다", async () => {
    mockFindUnique.mockResolvedValue(baseEvent);
    const req = new Request("http://localhost/api/events/abc12345", {
      headers: { "x-host-token": "wrong" },
    });
    const res = await GET(req, routeParams());
    const json = await res.json();
    expect(json.event.organizerEmail).toBeUndefined();
  });

  it("존재하지 않는 이벤트는 404를 반환한다", async () => {
    mockFindUnique.mockResolvedValue(null);
    const req = new Request("http://localhost/api/events/nope");
    const res = await GET(req, routeParams("nope"));
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/events/[slug]", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockUpdate.mockReset();
    mockDeleteMany.mockReset();
    mockCreateMany.mockReset();
  });

  it("hostToken이 틀리면 403을 반환하고 수정하지 않는다", async () => {
    mockFindUnique.mockResolvedValue({ ...baseEvent, dates: [] });
    const req = new Request("http://localhost/api/events/abc12345", {
      method: "PUT",
      body: JSON.stringify({ hostToken: "wrong", title: "변경" }),
    });
    const res = await PUT(req, routeParams());
    expect(res.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("올바른 hostToken이면 수정에 성공한다", async () => {
    mockFindUnique.mockResolvedValue({ ...baseEvent, dates: [] });
    mockUpdate.mockResolvedValue({});
    const req = new Request("http://localhost/api/events/abc12345", {
      method: "PUT",
      body: JSON.stringify({ hostToken: "secret-token", title: "변경됨" }),
    });
    const res = await PUT(req, routeParams());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it("존재하지 않는 이벤트는 404를 반환한다", async () => {
    mockFindUnique.mockResolvedValue(null);
    const req = new Request("http://localhost/api/events/nope", {
      method: "PUT",
      body: JSON.stringify({ hostToken: "x" }),
    });
    const res = await PUT(req, routeParams("nope"));
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/events/[slug]", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockDelete.mockReset();
  });

  it("hostToken 없이 삭제 요청하면 400을 반환한다", async () => {
    const req = new Request("http://localhost/api/events/abc12345", {
      method: "DELETE",
      body: JSON.stringify({}),
    });
    const res = await DELETE(req, routeParams());
    expect(res.status).toBe(400);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("틀린 hostToken이면 403을 반환하고 삭제하지 않는다", async () => {
    mockFindUnique.mockResolvedValue(baseEvent);
    const req = new Request("http://localhost/api/events/abc12345", {
      method: "DELETE",
      body: JSON.stringify({ hostToken: "wrong" }),
    });
    const res = await DELETE(req, routeParams());
    expect(res.status).toBe(403);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("올바른 hostToken이면 삭제에 성공한다", async () => {
    mockFindUnique.mockResolvedValue(baseEvent);
    mockDelete.mockResolvedValue({});
    const req = new Request("http://localhost/api/events/abc12345", {
      method: "DELETE",
      body: JSON.stringify({ hostToken: "secret-token" }),
    });
    const res = await DELETE(req, routeParams());
    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalledOnce();
  });
});
