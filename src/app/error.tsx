"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logError } from "@/lib/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("app/error boundary", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="w-10 h-10 text-muted-foreground" />
      <h1 className="text-xl font-bold">문제가 발생했습니다</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        페이지를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
      </p>
      <div className="flex gap-3">
        <Button
          onClick={() => reset()}
          className="bg-[#3A7D44] hover:bg-[#2E6436] text-white"
        >
          다시 시도
        </Button>
        <Link href="/">
          <Button variant="outline">홈으로</Button>
        </Link>
      </div>
    </div>
  );
}
