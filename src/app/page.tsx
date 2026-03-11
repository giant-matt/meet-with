import Link from "next/link";
import { CalendarDays, Users, Share2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            되는 시간
          </Link>
          <Link
            href="/my-events"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            내 약속
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center">
        <div className="max-w-5xl mx-auto px-4 py-20 w-full">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              함께 만날 시간,
              <br />
              <span className="text-primary/70">쉽고 빠르게</span> 찾기
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto">
              가입 없이 몇 초 만에 약속을 만들고,
              <br />
              링크를 공유하여,
              <br />
              모두가 가능한 &lsquo;되는 시간&rsquo;을 찾아보세요.
            </p>
            <div className="mt-8 flex gap-3 justify-center">
              <Link href="/create">
                <Button size="lg" className="gap-2 bg-[#3A7D44] hover:bg-[#2E6436] text-white">
                  새 약속 만들기
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-3 gap-8 mt-20">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary mb-4">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">간편한 약속 생성</h3>
              <p className="text-sm text-muted-foreground">
                후보 날짜를 선택하고 시간 범위를 정하면 끝.
                <br />
                가입이나 로그인은 필요 없어요.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary mb-4">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">링크 공유로 약속 공유</h3>
              <p className="text-sm text-muted-foreground">
                링크를 공유하여 참여자들의
                <br />
                &lsquo;되는 시간&rsquo;을 취합하세요.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">한눈에 보이는 시간</h3>
              <p className="text-sm text-muted-foreground">
                히트맵으로 참여자들의 &lsquo;되는 시간&rsquo;을
                <br />
                실시간으로 확인하세요.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          되는 시간 &mdash; 그룹 일정 조율 도구 &middot; <Link href="/privacy" className="hover:text-foreground transition-colors">개인정보처리방침</Link> &middot; &copy; All rights reserved. <a href="mailto:hwang@ulsan.ac.kr" className="hover:text-foreground transition-colors">hwang@ulsan.ac.kr</a>
        </div>
      </footer>
    </div>
  );
}
