"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DayPicker } from "react-day-picker";
import { ko } from "date-fns/locale";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarDays, Clock, Users, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "react-day-picker/style.css";

const TIME_OPTIONS = Array.from({ length: 49 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

function CreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("edit");

  const [title, setTitle] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"DATETIME" | "DATE_ONLY">("DATETIME");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const lastClickedDateRef = useRef<Date | null>(null);
  const [timeRangeStart, setTimeRangeStart] = useState("09:00");
  const [timeRangeEnd, setTimeRangeEnd] = useState("18:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(!!editSlug);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load existing event data in edit mode
  useEffect(() => {
    if (!editSlug) return;

    // organizerEmail은 보안상 API 응답에 포함되지 않으므로 sessionStorage에서 읽음
    const savedEmail = sessionStorage.getItem(`editEmail:${editSlug}`);
    if (!savedEmail) {
      toast.error("약속 수정 권한이 없습니다");
      router.push(`/e/${editSlug}`);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/events/${editSlug}`);
        if (!res.ok) throw new Error();
        const { event } = await res.json();

        setTitle(event.title);
        setOrganizerName(event.organizerName);
        setOrganizerEmail(savedEmail);
        setDescription(event.description || "");
        setMode(event.mode);
        setTimeRangeStart(event.timeRangeStart);
        setTimeRangeEnd(event.timeRangeEnd);
        setSelectedDates(
          event.dates.map((d: { date: string }) => new Date(d.date))
        );
      } catch (error) {
        console.error("load event error:", error);
        toast.error("약속을 불러올 수 없습니다");
        router.push("/create");
      } finally {
        setIsLoadingEvent(false);
      }
    })();
  }, [editSlug, router]);

  const handleDayClick = useCallback((day: Date, _modifiers: Record<string, boolean>, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedDateRef.current) {
      const start = lastClickedDateRef.current;
      const end = day;
      const from = start < end ? start : end;
      const to = start < end ? end : start;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const rangeDates: Date[] = [];
      const current = new Date(from);
      while (current <= to) {
        if (current >= today) {
          rangeDates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      }

      setSelectedDates((prev) => {
        const existingSet = new Set(prev.map((d) => d.toDateString()));
        const merged = [...prev];
        for (const d of rangeDates) {
          if (!existingSet.has(d.toDateString())) {
            merged.push(d);
          }
        }
        return merged;
      });
    }
    lastClickedDateRef.current = day;
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("약속 제목을 입력해주세요");
      return;
    }
    if (!organizerName.trim()) {
      toast.error("이름을 입력해주세요");
      return;
    }
    if (!organizerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(organizerEmail)) {
      toast.error("올바른 이메일을 입력해주세요");
      return;
    }
    if (selectedDates.length === 0) {
      toast.error("후보 날짜를 선택해주세요");
      return;
    }
    if (mode === "DATETIME" && timeRangeStart >= timeRangeEnd) {
      toast.error("종료 시간은 시작 시간보다 뒤여야 합니다");
      return;
    }
    if (!editSlug && !agreedToPrivacy) {
      toast.error("개인정보 수집·이용에 동의해주세요");
      return;
    }

    setIsSubmitting(true);
    try {
      const sortedDates = selectedDates
        .sort((a, b) => a.getTime() - b.getTime())
        .map((d) => format(d, "yyyy-MM-dd"));

      if (editSlug) {
        // Update existing event
        const res = await fetch(`/api/events/${editSlug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verifyEmail: organizerEmail.trim(),
            title: title.trim(),
            organizerName: organizerName.trim(),
            organizerEmail: organizerEmail.trim(),
            description: description.trim() || undefined,
            mode,
            dates: sortedDates,
            timeRangeStart,
            timeRangeEnd,
            slotDuration: 30,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "약속 수정에 실패했습니다");
        }

        toast.success("약속이 수정되었습니다!");
        router.push(`/e/${editSlug}`);
      } else {
        // Create new event
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            organizerName: organizerName.trim(),
            organizerEmail: organizerEmail.trim(),
            description: description.trim() || undefined,
            mode,
            dates: sortedDates,
            timeRangeStart,
            timeRangeEnd,
            slotDuration: 30,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "약속 생성에 실패했습니다");
        }

        const { event } = await res.json();
        toast.success("약속이 생성되었습니다!");
        sessionStorage.setItem(`respondEmail:${event.slug}`, organizerEmail.trim());
        sessionStorage.setItem(`editEmail:${event.slug}`, organizerEmail.trim());
        router.push(`/e/${event.slug}?respond=organizer`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href={editSlug ? `/e/${editSlug}` : "/"}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {editSlug ? "약속으로 돌아가기" : "돌아가기"}
        </Link>

        <h1 className="text-2xl font-bold mb-8">
          {editSlug ? "약속 수정" : "새 약속 만들기"}
        </h1>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">약속 제목</Label>
                <Input
                  id="title"
                  placeholder="예: 교육품질 제고를 위한 위원회"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="name">내 이름</Label>
                <Input
                  id="name"
                  placeholder="예: 홍길동"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="예: hong@example.com"
                  value={organizerEmail}
                  onChange={(e) => setOrganizerEmail(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  내 약속 목록 확인 시 사용됩니다
                </p>
              </div>
              <div>
                <Label htmlFor="desc">설명 (선택)</Label>
                <Input
                  id="desc"
                  placeholder="약속에 대한 간단한 설명"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* 모드 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5" />
                응답 방식
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode("DATETIME")}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    mode === "DATETIME"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="font-medium">날짜 + 시간</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    구체적인 시간대까지 조율
                  </div>
                </button>
                <button
                  onClick={() => setMode("DATE_ONLY")}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    mode === "DATE_ONLY"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="font-medium">날짜만</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    가능한 날짜만 선택
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* 날짜 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="w-5 h-5" />
                후보 날짜
                {selectedDates.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({selectedDates.length}일 선택됨)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <DayPicker
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={(dates) => setSelectedDates(dates || [])}
                  onDayClick={handleDayClick}
                  locale={ko}
                  numberOfMonths={isMobile ? 1 : 2}
                  disabled={{ before: new Date() }}
                />
              </div>
              {selectedDates.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedDates
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((date) => (
                      <span
                        key={date.toISOString()}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
                      >
                        {format(date, "M/d (EEE)", { locale: ko })}
                        <button
                          onClick={() =>
                            setSelectedDates((prev) =>
                              prev.filter(
                                (d) => d.toDateString() !== date.toDateString()
                              )
                            )
                          }
                          className="text-muted-foreground hover:text-foreground ml-1"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 시간 설정 (DATETIME 모드에서만) */}
          {mode === "DATETIME" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5" />
                  시간 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>시작 시간</Label>
                    <select
                      value={timeRangeStart}
                      onChange={(e) => setTimeRangeStart(e.target.value)}
                      className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>종료 시간</Label>
                    <select
                      value={timeRangeEnd}
                      onChange={(e) => setTimeRangeEnd(e.target.value)}
                      className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 날짜 변경 시 기존 응답 안내 */}
          {editSlug && (
            <p className="text-sm text-muted-foreground text-center">
              날짜를 삭제하면 해당 날짜의 참여자 응답도 함께 삭제됩니다.
            </p>
          )}

          {/* 개인정보 동의 (신규 생성 시만) */}
          {!editSlug && (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
              />
              <span className="text-sm text-muted-foreground">
                <Link href="/privacy" target="_blank" className="underline text-foreground">
                  개인정보처리방침
                </Link>
                에 따라 이름과 이메일을 수집·이용하는 것에 동의합니다.
              </span>
            </label>
          )}

          {/* 제출 */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="lg"
            className="w-full"
          >
            {isSubmitting
              ? editSlug
                ? "수정 중..."
                : "생성 중..."
              : editSlug
                ? "약속 수정하기"
                : "약속 만들기"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CreateForm />
    </Suspense>
  );
}
