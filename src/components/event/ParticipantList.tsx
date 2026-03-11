"use client";

import { Users, Check } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  responses: { eventDateId: string; startTime: string }[];
}

interface ParticipantListProps {
  participants: Participant[];
  highlightedParticipant: string | null;
  onHighlight: (id: string | null) => void;
}

export default function ParticipantList({
  participants,
  highlightedParticipant,
  onHighlight,
}: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className="text-center py-6 space-y-2">
        <Users className="w-8 h-8 text-muted-foreground/40 mx-auto" />
        <p className="text-sm text-muted-foreground">
          아직 응답한 사람이 없습니다
        </p>
        <p className="text-xs text-muted-foreground/70">
          링크를 공유하여 참여자를 초대하세요
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          참여자 ({participants.length}명)
        </span>
      </div>
      <div className="space-y-1">
        <button
          onClick={() => onHighlight(null)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            highlightedParticipant === null
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          전체 보기
        </button>
        {participants.map((p) => (
          <button
            key={p.id}
            onClick={() =>
              onHighlight(highlightedParticipant === p.id ? null : p.id)
            }
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
              highlightedParticipant === p.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary"
            }`}
          >
            <span>{p.name}</span>
            <span className="flex items-center gap-1 text-xs opacity-70">
              <Check className="w-3 h-3" />
              {p.responses.length}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
