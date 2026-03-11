import { describe, it, expect } from "vitest";
import { generateTimeSlots, formatTime } from "@/lib/slots";

describe("generateTimeSlots", () => {
  it("30분 간격으로 슬롯을 생성한다", () => {
    const slots = generateTimeSlots("09:00", "11:00", 30);
    expect(slots).toEqual([
      { start: "09:00", end: "09:30" },
      { start: "09:30", end: "10:00" },
      { start: "10:00", end: "10:30" },
      { start: "10:30", end: "11:00" },
    ]);
  });

  it("60분 간격으로 슬롯을 생성한다", () => {
    const slots = generateTimeSlots("09:00", "12:00", 60);
    expect(slots).toEqual([
      { start: "09:00", end: "10:00" },
      { start: "10:00", end: "11:00" },
      { start: "11:00", end: "12:00" },
    ]);
  });

  it("15분 간격으로 슬롯을 생성한다", () => {
    const slots = generateTimeSlots("14:00", "15:00", 15);
    expect(slots).toHaveLength(4);
    expect(slots[0]).toEqual({ start: "14:00", end: "14:15" });
    expect(slots[3]).toEqual({ start: "14:45", end: "15:00" });
  });

  it("시작과 끝이 같으면 빈 배열을 반환한다", () => {
    const slots = generateTimeSlots("09:00", "09:00", 30);
    expect(slots).toEqual([]);
  });

  it("남는 시간이 슬롯 크기보다 작으면 포함하지 않는다", () => {
    const slots = generateTimeSlots("09:00", "09:45", 30);
    expect(slots).toHaveLength(1);
    expect(slots[0]).toEqual({ start: "09:00", end: "09:30" });
  });

  it("자정 전후 시간을 처리한다", () => {
    const slots = generateTimeSlots("23:00", "24:00", 30);
    expect(slots).toEqual([
      { start: "23:00", end: "23:30" },
      { start: "23:30", end: "24:00" },
    ]);
  });
});

describe("formatTime", () => {
  it("시간 문자열을 그대로 반환한다", () => {
    expect(formatTime("09:00")).toBe("09:00");
    expect(formatTime("23:30")).toBe("23:30");
  });
});
