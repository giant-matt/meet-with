"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarDays, Users, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listRememberedEvents, getHostToken, forgetEvent } from "@/lib/myEvents";

interface EventItem {
  id: string;
  title: string;
  slug: string;
  organizerName: string;
  createdAt: string;
  participants: { id: string }[];
  dates: { id: string }[];
}

export default function MyEventsPage() {
  const [organized, setOrganized] = useState<EventItem[]>([]);
  const [participated, setParticipated] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slugs = listRememberedEvents();
    if (slugs.length === 0) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    (async () => {
      const results = await Promise.all(
        slugs.map(async (slug) => {
          try {
            const res = await fetch(`/api/events/${slug}`);
            if (!res.ok) {
              forgetEvent(slug);
              return null;
            }
            const { event } = await res.json();
            return event as EventItem;
          } catch {
            return null;
          }
        })
      );

      const found = results.filter((e): e is EventItem => e !== null);
      setOrganized(found.filter((e) => !!getHostToken(e.slug)));
      setParticipated(found.filter((e) => !getHostToken(e.slug)));
      setLoading(false);
    })();
  }, []);

  const handleDelete = async (slug: string, title: string) => {
    const confirmed = window.confirm(
      `"${title}" 약속을 삭제하시겠습니까?\n모든 참여자 응답도 함께 삭제됩니다.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/events/${slug}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostToken: getHostToken(slug) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "삭제에 실패했습니다");
      }

      forgetEvent(slug);
      toast.success("약속이 삭제되었습니다");
      setOrganized((prev) => prev.filter((e) => e.slug !== slug));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "삭제에 실패했습니다"
      );
    }
  };

  const EventCard = ({
    event,
    role,
    canDelete,
  }: {
    event: EventItem;
    role: string;
    canDelete?: boolean;
  }) => (
    <Card className="hover:bg-secondary/30 transition-colors">
      <CardContent className="flex items-center justify-between py-4">
        <Link href={`/e/${event.slug}`} className="min-w-0 flex-1 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{event.title}</span>
            <Badge variant="secondary" className="text-xs shrink-0">
              {role}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {event.participants.length}명 참여
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {event.dates.length}일
            </span>
            <span>
              {format(new Date(event.createdAt), "M월 d일", { locale: ko })}
            </span>
          </div>
        </Link>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${event.title} 삭제`}
            className="shrink-0 text-muted-foreground hover:text-destructive ml-2"
            onClick={(e) => {
              e.preventDefault();
              handleDelete(event.slug, event.title);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            언제되니
          </Link>
          <Link href="/create">
            <Button size="sm">새 약속 만들기</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">내 약속</h1>
        <p className="text-xs text-muted-foreground mb-6">
          이 기기에서 만들거나 참여한 약속만 보입니다
        </p>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && (
          <div className="space-y-8">
            {organized.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">
                  내가 만든 약속 ({organized.length})
                </h2>
                <div className="space-y-2">
                  {organized.map((event) => (
                    <EventCard key={event.id} event={event} role="주최자" canDelete />
                  ))}
                </div>
              </div>
            )}

            {participated.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">
                  참여한 약속 ({participated.length})
                </h2>
                <div className="space-y-2">
                  {participated.map((event) => (
                    <EventCard key={event.id} event={event} role="참여자" />
                  ))}
                </div>
              </div>
            )}

            {organized.length === 0 && participated.length === 0 && (
              <div className="text-center py-12 text-muted-foreground space-y-2">
                <CalendarDays className="w-8 h-8 mx-auto opacity-50" />
                <p>아직 이 기기에서 만들거나 참여한 약속이 없습니다</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
