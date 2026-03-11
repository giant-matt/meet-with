import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function StepNumber({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#3A7D44] text-white text-sm font-bold shrink-0">
      {n}
    </span>
  );
}

function AnnotatedImage({
  src,
  alt,
  annotations,
}: {
  src: string;
  alt: string;
  annotations: {
    top: string;
    left: string;
    label: string;
    direction?: "top" | "bottom" | "left" | "right";
  }[];
}) {
  return (
    <div className="relative border border-border rounded-xl overflow-hidden shadow-sm">
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={800}
        className="w-full h-auto"
      />
      {annotations.map((a, i) => {
        const arrow = {
          top: "↓",
          bottom: "↑",
          left: "→",
          right: "←",
        }[a.direction || "bottom"];

        const flexDir = {
          top: "flex-col",
          bottom: "flex-col-reverse",
          left: "flex-row",
          right: "flex-row-reverse",
        }[a.direction || "bottom"];

        return (
          <div
            key={i}
            className="absolute z-10"
            style={{ top: a.top, left: a.left, transform: "translate(-50%, -50%)" }}
          >
            <div className={`flex ${flexDir} items-center gap-0.5`}>
              <span className="bg-[#E53E3E] text-white px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap shadow-lg border border-white/50">
                {a.label}
              </span>
              <span className="text-[#E53E3E] text-lg sm:text-xl font-bold leading-none drop-shadow-md">
                {arrow}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            되는 시간
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            홈으로
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold">사용 가이드</h1>
          <p className="mt-2 text-muted-foreground">
            4단계로 알아보는 &lsquo;되는 시간&rsquo; 사용법
          </p>
        </div>

        <div className="space-y-12">
          {/* ========== Step 1: 메인 화면 ========== */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <StepNumber n={1} />
                <div>
                  <h2 className="text-lg font-bold">약속 만들기</h2>
                  <p className="text-sm text-muted-foreground">
                    메인 화면에서 초록색 버튼을 클릭하여 시작합니다
                  </p>
                </div>
              </div>

              <AnnotatedImage
                src="/guide/메인화면.png"
                alt="메인 화면"
                annotations={[
                  {
                    top: "57%",
                    left: "50%",
                    label: "↑ 여기를 클릭!",
                    direction: "bottom",
                  },
                  {
                    top: "5.5%",
                    left: "82%",
                    label: "여기를 클릭! ↗",
                    direction: "bottom",
                  },
                ]}
              />

              <div className="bg-[#3A7D44]/5 border border-[#3A7D44]/20 rounded-lg p-3">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li><strong className="text-foreground">새 약속 만들기</strong> 버튼을 클릭하면 약속 생성 페이지로 이동합니다</li>
                  <li>우측 상단 <strong className="text-foreground">내 약속</strong>을 클릭하면 내가 만든/참여한 약속을 조회할 수 있습니다</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* ========== Step 2: 약속 생성 ========== */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <StepNumber n={2} />
                <div>
                  <h2 className="text-lg font-bold">약속 정보 입력</h2>
                  <p className="text-sm text-muted-foreground">
                    제목, 이름, 후보 날짜, 시간 범위를 설정합니다
                  </p>
                </div>
              </div>

              <AnnotatedImage
                src="/guide/이벤트 만들기.png"
                alt="약속 생성 페이지"
                annotations={[
                  {
                    top: "10%",
                    left: "88%",
                    label: "① 기본 정보 입력",
                    direction: "left",
                  },
                  {
                    top: "40%",
                    left: "88%",
                    label: "② 응답 방식 선택",
                    direction: "left",
                  },
                  {
                    top: "62%",
                    left: "88%",
                    label: "③ 후보 날짜 선택",
                    direction: "left",
                  },
                  {
                    top: "87%",
                    left: "88%",
                    label: "④ 시간 범위 설정",
                    direction: "left",
                  },
                  {
                    top: "97%",
                    left: "50%",
                    label: "← 모두 입력 후 클릭!",
                    direction: "top",
                  },
                ]}
              />

              <div className="bg-[#3A7D44]/5 border border-[#3A7D44]/20 rounded-lg p-3">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li><strong className="text-foreground">약속 제목</strong>, <strong className="text-foreground">이름</strong>, <strong className="text-foreground">이메일</strong>을 입력합니다</li>
                  <li><strong className="text-foreground">날짜 + 시간</strong> 또는 <strong className="text-foreground">날짜만</strong> 응답 방식을 선택합니다</li>
                  <li>캘린더에서 <strong className="text-foreground">후보 날짜</strong>를 클릭하여 여러 날 선택할 수 있습니다</li>
                  <li>시작/종료 시간과 시간 단위(15분/30분/60분)를 설정합니다</li>
                  <li>하단 <strong className="text-foreground">약속 만들기</strong> 버튼을 클릭하면 완료!</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* ========== Step 3: 약속 상세 & 시간 입력 ========== */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <StepNumber n={3} />
                <div>
                  <h2 className="text-lg font-bold">링크 공유 &amp; 시간 입력</h2>
                  <p className="text-sm text-muted-foreground">
                    링크를 공유하고, 참여자들이 되는 시간을 입력합니다
                  </p>
                </div>
              </div>

              <AnnotatedImage
                src="/guide/이벤트 생성 페이지.png"
                alt="약속 상세 페이지"
                annotations={[
                  {
                    top: "4%",
                    left: "88%",
                    label: "① 링크 복사 클릭!",
                    direction: "top",
                  },
                  {
                    top: "4%",
                    left: "68%",
                    label: "약속 수정",
                    direction: "top",
                  },
                  {
                    top: "18%",
                    left: "80%",
                    label: "② 입력 후 저장 클릭!",
                    direction: "top",
                  },
                  {
                    top: "75%",
                    left: "40%",
                    label: "③ 여기를 드래그하여 시간 선택!",
                    direction: "top",
                  },
                ]}
              />

              <div className="bg-[#3A7D44]/5 border border-[#3A7D44]/20 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-[#3A7D44]">주최자 안내</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>우측 상단 <strong className="text-foreground">링크 복사</strong> 버튼으로 링크를 복사합니다</li>
                  <li>카카오톡, 문자, 이메일 등으로 참여자들에게 공유하세요</li>
                </ul>
                <p className="text-sm font-medium text-[#3A7D44] pt-1">참여자 안내</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li><strong className="text-foreground">내 시간 입력하기</strong> 버튼을 클릭 → 이름/이메일 입력</li>
                  <li>그리드에서 <strong className="text-foreground">클릭 또는 드래그</strong>로 가능한 시간을 선택합니다</li>
                  <li><strong className="text-foreground">저장</strong> 버튼을 누르면 완료!</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* ========== Step 4: 내 약속 ========== */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <StepNumber n={4} />
                <div>
                  <h2 className="text-lg font-bold">내 약속 관리</h2>
                  <p className="text-sm text-muted-foreground">
                    내가 만들거나 참여한 약속을 조회합니다
                  </p>
                </div>
              </div>

              <AnnotatedImage
                src="/guide/내이벤트.png"
                alt="내 약속 페이지"
                annotations={[
                  {
                    top: "55%",
                    left: "42%",
                    label: "① 이메일 입력",
                    direction: "bottom",
                  },
                  {
                    top: "55%",
                    left: "85%",
                    label: "② 조회 클릭!",
                    direction: "bottom",
                  },
                ]}
              />

              <div className="bg-[#3A7D44]/5 border border-[#3A7D44]/20 rounded-lg p-3">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>약속 생성 또는 참여 시 입력한 <strong className="text-foreground">이메일</strong>로 조회합니다</li>
                  <li><strong className="text-foreground">내가 만든 약속</strong>과 <strong className="text-foreground">참여한 약속</strong>이 분류되어 표시됩니다</li>
                  <li>약속을 클릭하면 해당 약속 페이지로 이동합니다</li>
                  <li>내가 만든 약속은 <strong className="text-foreground">삭제</strong>할 수 있습니다 (참여자 응답도 함께 삭제됨)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4 pt-4 pb-8">
            <p className="text-lg font-medium">
              지금 바로 약속을 만들어 보세요!
            </p>
            <Link href="/create">
              <Button
                size="lg"
                className="gap-2 bg-[#3A7D44] hover:bg-[#2E6436] text-white"
              >
                새 약속 만들기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
