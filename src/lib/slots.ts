export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  for (let t = startTotal; t + durationMinutes <= endTotal; t += durationMinutes) {
    const sH = Math.floor(t / 60);
    const sM = t % 60;
    const eH = Math.floor((t + durationMinutes) / 60);
    const eM = (t + durationMinutes) % 60;

    slots.push({
      start: `${String(sH).padStart(2, "0")}:${String(sM).padStart(2, "0")}`,
      end: `${String(eH).padStart(2, "0")}:${String(eM).padStart(2, "0")}`,
    });
  }

  return slots;
}

export function formatTime(time: string): string {
  return time;
}
