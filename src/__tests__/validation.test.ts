import { describe, it, expect } from "vitest";
import { z } from "zod";

// Replicate schemas from API routes to test validation logic
const createEventSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  organizerName: z.string().min(1, "이름을 입력해주세요"),
  organizerEmail: z.string().email("올바른 이메일을 입력해주세요"),
  description: z.string().optional(),
  mode: z.enum(["DATETIME", "DATE_ONLY"]),
  dates: z.array(z.string()).min(1, "날짜를 하나 이상 선택해주세요"),
  timeRangeStart: z.string().default("09:00"),
  timeRangeEnd: z.string().default("18:00"),
  slotDuration: z.number().min(15).max(60).default(30),
  timezone: z.string().default("Asia/Seoul"),
});

const emailSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다").max(254),
});

describe("createEventSchema", () => {
  const validInput = {
    title: "팀 회의",
    organizerName: "홍길동",
    organizerEmail: "test@example.com",
    mode: "DATETIME" as const,
    dates: ["2026-03-15"],
  };

  it("유효한 입력을 통과시킨다", () => {
    const result = createEventSchema.parse(validInput);
    expect(result.title).toBe("팀 회의");
    expect(result.timeRangeStart).toBe("09:00");
    expect(result.slotDuration).toBe(30);
  });

  it("빈 제목을 거부한다", () => {
    expect(() =>
      createEventSchema.parse({ ...validInput, title: "" })
    ).toThrow();
  });

  it("잘못된 이메일을 거부한다", () => {
    expect(() =>
      createEventSchema.parse({ ...validInput, organizerEmail: "not-email" })
    ).toThrow();
  });

  it("빈 날짜 배열을 거부한다", () => {
    expect(() =>
      createEventSchema.parse({ ...validInput, dates: [] })
    ).toThrow();
  });

  it("잘못된 mode를 거부한다", () => {
    expect(() =>
      createEventSchema.parse({ ...validInput, mode: "INVALID" })
    ).toThrow();
  });

  it("slotDuration 범위를 검증한다", () => {
    expect(() =>
      createEventSchema.parse({ ...validInput, slotDuration: 10 })
    ).toThrow();
    expect(() =>
      createEventSchema.parse({ ...validInput, slotDuration: 120 })
    ).toThrow();
    expect(
      createEventSchema.parse({ ...validInput, slotDuration: 15 }).slotDuration
    ).toBe(15);
  });
});

describe("emailSchema (my-events)", () => {
  it("유효한 이메일을 통과시킨다", () => {
    const result = emailSchema.parse({ email: "user@example.com" });
    expect(result.email).toBe("user@example.com");
  });

  it("잘못된 이메일을 거부한다", () => {
    expect(() => emailSchema.parse({ email: "not-an-email" })).toThrow();
  });

  it("빈 문자열을 거부한다", () => {
    expect(() => emailSchema.parse({ email: "" })).toThrow();
  });

  it("254자 초과 이메일을 거부한다", () => {
    const longEmail = "a".repeat(250) + "@b.com";
    expect(() => emailSchema.parse({ email: longEmail })).toThrow();
  });
});
