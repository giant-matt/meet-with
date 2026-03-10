export function getHeatmapColor(count: number, maxCount: number): string {
  if (count === 0) return "transparent";
  if (maxCount === 0) return "transparent";

  const ratio = count / maxCount;
  const lightness = 90 - ratio * 55;
  return `hsl(142, 70%, ${lightness}%)`;
}

export function getHeatmapTextColor(count: number, maxCount: number): string {
  if (maxCount === 0) return "inherit";
  const ratio = count / maxCount;
  return ratio > 0.6 ? "white" : "inherit";
}
