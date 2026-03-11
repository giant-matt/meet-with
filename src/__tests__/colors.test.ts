import { describe, it, expect } from "vitest";
import { getHeatmapColor, getHeatmapTextColor } from "@/lib/colors";

describe("getHeatmapColor", () => {
  it("count가 0이면 transparent를 반환한다", () => {
    expect(getHeatmapColor(0, 5)).toBe("transparent");
  });

  it("maxCount가 0이면 transparent를 반환한다", () => {
    expect(getHeatmapColor(3, 0)).toBe("transparent");
  });

  it("count가 높을수록 더 진한 색을 반환한다", () => {
    const light = getHeatmapColor(1, 5);
    const dark = getHeatmapColor(5, 5);
    // Extract lightness values
    const lightMatch = light.match(/(\d+)%\)$/);
    const darkMatch = dark.match(/(\d+)%\)$/);
    expect(lightMatch).not.toBeNull();
    expect(darkMatch).not.toBeNull();
    expect(Number(lightMatch![1])).toBeGreaterThan(Number(darkMatch![1]));
  });

  it("HSL 형식의 문자열을 반환한다", () => {
    const color = getHeatmapColor(3, 5);
    expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });
});

describe("getHeatmapTextColor", () => {
  it("maxCount가 0이면 inherit를 반환한다", () => {
    expect(getHeatmapTextColor(0, 0)).toBe("inherit");
  });

  it("비율이 높으면 white를 반환한다", () => {
    expect(getHeatmapTextColor(4, 5)).toBe("white");
    expect(getHeatmapTextColor(5, 5)).toBe("white");
  });

  it("비율이 낮으면 inherit를 반환한다", () => {
    expect(getHeatmapTextColor(1, 5)).toBe("inherit");
    expect(getHeatmapTextColor(2, 5)).toBe("inherit");
  });
});
