"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Trophy } from "lucide-react";
import { formatTime } from "@/lib/slots";

interface EventDate {
  id: string;
  date: string;
}

interface ParticipantResponse {
  eventDateId: string;
  startTime: string;
}

interface Participant {
  id: string;
  name: string;
  responses: ParticipantResponse[];
}

interface BestTimeSectionProps {
  dates: EventDate[];
  participants: Participant[];
  mode: string;
  totalParticipants: number;
}

interface BestSlot {
  dateId: string;
  date: string;
  startTime: string;
  count: number;
  names: string[];
}

export default function BestTimeSection({
  dates,
  participants,
  mode,
  totalParticipants,
}: BestTimeSectionProps) {
  const bestSlots = useMemo(() => {
    if (participants.length === 0) return [];

    const countMap = new Map<string, { count: number; names: string[] }>();

    for (const p of participants) {
      for (const r of p.responses) {
        const key = `${r.eventDateId}-${r.startTime}`;
        const existing = countMap.get(key) || { count: 0, names: [] };
        existing.count++;
        existing.names.push(p.name);
        countMap.set(key, existing);
      }
    }

    const dateMap = new Map(dates.map((d) => [d.id, d.date]));
    const slots: BestSlot[] = [];

    for (const [key, data] of countMap.entries()) {
      // key format: "eventDateId-HH:MM" — find the last "-" before ":"
      const timeMatch = key.match(/-(\d{2}:\d{2})$/);
      if (!timeMatch) continue;
      const time = timeMatch[1];
      const dId = key.slice(0, -(time.length + 1));
      const dateStr = dateMap.get(dId);
      if (!dateStr) continue;

      slots.push({
        dateId: dId,
        date: dateStr,
        startTime: time,
        count: data.count,
        names: data.names,
      });
    }

    slots.sort((a, b) => b.count - a.count);
    return slots.slice(0, 3);
  }, [dates, participants]);

  if (bestSlots.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-medium">최적 시간 추천</span>
      </div>
      <div className="space-y-2">
        {bestSlots.map((slot, i) => (
          <div
            key={`${slot.dateId}-${slot.startTime}-${i}`}
            className="flex items-center gap-3 p-2 rounded-md bg-secondary/50"
          >
            <span className="text-lg font-bold text-muted-foreground w-6 text-center">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">
                {format(new Date(slot.date), "M월 d일 (EEE)", { locale: ko })}
                {mode !== "DATE_ONLY" && (
                  <span className="ml-1 text-muted-foreground">
                    {formatTime(slot.startTime)}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {slot.count}/{totalParticipants}명 ·{" "}
                {slot.names.join(", ")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
