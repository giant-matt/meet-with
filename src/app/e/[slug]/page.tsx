"use client";

import { useEffect, useState, useCallback, use, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Check, Pencil, Save, X, Loader2, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import AvailabilityGrid from "@/components/event/AvailabilityGrid";
import ParticipantList from "@/components/event/ParticipantList";
import ParticipantNameDialog from "@/components/event/ParticipantNameDialog";
import BestTimeSection from "@/components/event/BestTimeSection";

interface EventData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  organizerName: string;
  mode: string;
  timeRangeStart: string;
  timeRangeEnd: string;
  slotDuration: number;
  timezone: string;
  dates: { id: string; date: string }[];
  participants: {
    id: string;
    name: string;
    responses: { eventDateId: string; startTime: string; endTime: string }[];
  }[];
}

function EventPageInner({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [highlightedParticipant, setHighlightedParticipant] = useState<
    string | null
  >(null);
  const [autoRespondHandled, setAutoRespondHandled] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editEmail, setEditEmail] = useState("");

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${slug}`);
      if (!res.ok) throw new Error("약속을 찾을 수 없습니다");
      const data = await res.json();
      setEvent(data.event);
    } catch {
      toast.error("약속을 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // Auto-enter edit mode for organizer after event creation
  useEffect(() => {
    if (autoRespondHandled || !event || loading) return;
    if (searchParams.get("respond") === "organizer") {
      setParticipantName(event.organizerName);
      const savedEmail = sessionStorage.getItem(`respondEmail:${slug}`);
      setParticipantEmail(savedEmail || "");
      sessionStorage.removeItem(`respondEmail:${slug}`);
      setIsEditing(true);
      setAutoRespondHandled(true);
      // Clean up URL
      window.history.replaceState({}, "", `/e/${slug}`);
    }
  }, [event, loading, autoRespondHandled, searchParams, slug]);

  const handleStartEdit = () => {
    setShowNameDialog(true);
  };

  const handleNameSubmit = (name: string, email: string) => {
    setParticipantName(name);
    setParticipantEmail(email);
    setShowNameDialog(false);
    setIsEditing(true);

    // Pre-fill if participant already exists
    if (event) {
      const existing = event.participants.find((p) => p.name === name);
      if (existing) {
        const slots = new Set<string>();
        for (const r of existing.responses) {
          slots.add(`${r.eventDateId}-${r.startTime}`);
        }
        setSelectedSlots(slots);
      } else {
        setSelectedSlots(new Set());
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedSlots(new Set());
    setParticipantName("");
  };

  const handleSave = async () => {
    if (!event) return;

    setIsSaving(true);
    try {
      const availability: Record<string, string[]> = {};
      for (const key of selectedSlots) {
        const timeMatch = key.match(/-(\d{2}:\d{2})$/);
        if (!timeMatch) continue;
        const startTime = timeMatch[1];
        const dateId = key.slice(0, -(startTime.length + 1));

        if (!availability[dateId]) availability[dateId] = [];
        availability[dateId].push(startTime);
      }

      // Include editToken if available (for modifying existing responses)
      const storedToken = localStorage.getItem(`editToken:${slug}:${participantName}`);

      const res = await fetch(`/api/events/${slug}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName,
          participantEmail,
          editToken: storedToken || undefined,
          availability,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "저장에 실패했습니다");
      }

      const result = await res.json();
      // Save editToken for future edits
      if (result.editToken) {
        localStorage.setItem(`editToken:${slug}:${participantName}`, result.editToken);
      }

      toast.success("저장되었습니다!");
      setIsEditing(false);
      setSelectedSlots(new Set());
      setParticipantName("");
      setParticipantEmail("");
      await fetchEvent();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "저장에 실패했습니다"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const [isVerifying, setIsVerifying] = useState(false);

  const handleEditVerify = async () => {
    if (!event) return;
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/events/${event.slug}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editEmail }),
      });
      if (res.ok) {
        const { organizerEmail } = await res.json();
        sessionStorage.setItem(`editEmail:${event.slug}`, organizerEmail);
        setShowEditDialog(false);
        setEditEmail("");
        router.push(`/create?edit=${event.slug}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "주최자 이메일이 일치하지 않습니다");
      }
    } catch {
      toast.error("인증에 실패했습니다");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("링크가 복사되었습니다");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("링크 복사에 실패했습니다");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">
          약속을 찾을 수 없습니다
        </p>
        <Link href="/">
          <Button variant="outline">홈으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            되는 시간
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/my-events"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              내 약속
            </Link>
            <Link href="/create">
              <Button size="sm">새 약속 만들기</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{event.title}</h1>
              {event.description && (
                <p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-2">
                  {event.description}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                주최: {event.organizerName}
              </p>
            </div>
            <div className="flex gap-1.5 sm:gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditDialog(true)}
                title="약속 수정"
              >
                <Settings className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">약속 수정</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                title={copied ? "복사됨" : "링크 복사"}
              >
                {copied ? (
                  <Check className="w-4 h-4 sm:mr-1" />
                ) : (
                  <Copy className="w-4 h-4 sm:mr-1" />
                )}
                <span className="hidden sm:inline">{copied ? "복사됨" : "링크 복사"}</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Main grid area */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 gap-2">
              <CardTitle className="text-sm sm:text-base truncate">
                {isEditing ? (
                  <span className="flex items-center gap-2">
                    <Pencil className="w-4 h-4 shrink-0" />
                    <span className="truncate">{participantName}님의 되는 시간</span>
                  </span>
                ) : (
                  "되는 시간"
                )}
              </CardTitle>
              <div className="flex gap-1.5 sm:gap-2 shrink-0">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      <X className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">취소</span>
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 sm:mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 sm:mr-1" />
                      )}
                      저장
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={handleStartEdit}>
                    <Pencil className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">내 시간 입력하기</span>
                    <span className="sm:hidden">입력하기</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing && (
                <p className="text-xs text-muted-foreground mb-3">
                  클릭하거나 드래그하여 되는 시간을 표시하세요. 다시 클릭하면
                  해제됩니다.
                </p>
              )}
              <AvailabilityGrid
                dates={event.dates}
                participants={event.participants}
                mode={event.mode}
                timeRangeStart={event.timeRangeStart}
                timeRangeEnd={event.timeRangeEnd}
                slotDuration={event.slotDuration}
                isEditing={isEditing}
                selectedSlots={selectedSlots}
                onSlotsChange={setSelectedSlots}
                highlightedParticipant={highlightedParticipant}
              />
              {/* Empty state prompt */}
              {!isEditing && event.participants.length === 0 && (
                <div className="text-center py-6 space-y-3 border-t border-border/30 mt-4">
                  <p className="text-sm text-muted-foreground">
                    아직 아무도 응답하지 않았어요
                  </p>
                  <Button size="sm" onClick={handleStartEdit}>
                    <Pencil className="w-4 h-4 mr-1" />
                    첫 번째로 시간 입력하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <ParticipantList
                  participants={event.participants}
                  highlightedParticipant={highlightedParticipant}
                  onHighlight={setHighlightedParticipant}
                />
              </CardContent>
            </Card>

            {event.participants.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <BestTimeSection
                    dates={event.dates}
                    participants={event.participants}
                    mode={event.mode}
                    totalParticipants={event.participants.length}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <ParticipantNameDialog
        open={showNameDialog}
        onOpenChange={setShowNameDialog}
        existingNames={event.participants.map((p) => p.name)}
        slug={slug}
        onSubmit={handleNameSubmit}
      />

      {/* Edit verification dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowEditDialog(false);
              setEditEmail("");
            }}
          />
          <div className="relative bg-background rounded-lg shadow-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-1">약속 수정</h3>
            <p className="text-sm text-muted-foreground mb-4">
              주최자 이메일을 입력하여 본인 확인을 해주세요.
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="edit-email">이메일</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="약속 생성 시 입력한 이메일"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEditVerify()}
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditEmail("");
                  }}
                >
                  취소
                </Button>
                <Button size="sm" onClick={handleEditVerify} disabled={isVerifying}>
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : null}
                  확인
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <EventPageInner slug={slug} />
    </Suspense>
  );
}
