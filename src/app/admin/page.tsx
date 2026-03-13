"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Lock, BarChart3, Users, Calendar, MessageSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface Summary {
  totalEvents: number;
  totalParticipants: number;
  totalResponses: number;
  last7DaysEvents: number;
}

interface RecentEvent {
  title: string;
  slug: string;
  organizerName: string;
  organizerEmail: string;
  mode: string;
  participantCount: number;
  dateCount: number;
  createdAt: string;
}

interface StatsData {
  summary: Summary;
  recentEvents: RecentEvent[];
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-password": password },
      });
      if (!res.ok) {
        setError("비밀번호가 올바르지 않습니다");
        return;
      }
      setData(await res.json());
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-sm mx-4">
          <CardHeader className="text-center">
            <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <CardTitle>Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              autoFocus
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleLogin} disabled={loading} className="w-full">
              {loading ? "확인 중..." : "로그인"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, recentEvents } = data;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold">Admin Dashboard</span>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              홈으로
            </Link>
            <button
              onClick={() => { setData(null); setPassword(""); }}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">총 약속</span>
              </div>
              <p className="text-2xl font-bold">{summary.totalEvents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">총 참여자</span>
              </div>
              <p className="text-2xl font-bold">{summary.totalParticipants}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs">총 응답</span>
              </div>
              <p className="text-2xl font-bold">{summary.totalResponses}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BarChart3 className="w-4 h-4" />
                <span className="text-xs">최근 7일 약속</span>
              </div>
              <p className="text-2xl font-bold">{summary.last7DaysEvents}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">전체 약속 목록 (최근 20개)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">제목</th>
                    <th className="pb-2 pr-4">주최자</th>
                    <th className="pb-2 pr-4">이메일</th>
                    <th className="pb-2 pr-4 text-center">참여자</th>
                    <th className="pb-2 pr-4 text-center">후보일</th>
                    <th className="pb-2 pr-4">방식</th>
                    <th className="pb-2">생성일</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        아직 생성된 약속이 없습니다
                      </td>
                    </tr>
                  ) : recentEvents.map((event) => (
                    <tr key={event.slug} className="border-b border-border/30 hover:bg-secondary/30">
                      <td className="py-2 pr-4">
                        <Link
                          href={`/e/${event.slug}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {event.title}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">{event.organizerName}</td>
                      <td className="py-2 pr-4 text-muted-foreground text-xs">
                        {event.organizerEmail || "—"}
                      </td>
                      <td className="py-2 pr-4 text-center">{event.participantCount}명</td>
                      <td className="py-2 pr-4 text-center">{event.dateCount}일</td>
                      <td className="py-2 pr-4">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-secondary">
                          {event.mode === "DATETIME" ? "날짜+시간" : "날짜만"}
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground text-xs whitespace-nowrap">
                        {format(new Date(event.createdAt), "M월 d일 HH:mm", { locale: ko })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
