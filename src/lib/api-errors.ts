import { NextResponse } from "next/server";
import { z } from "zod";
import { logError } from "@/lib/logger";

/**
 * API 라우트 공용 에러 응답 포맷.
 */
export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * API 라우트 catch 블록 공용 처리.
 * zod 검증 오류는 메시지를 그대로 400으로, 그 외 오류는 로깅 후 fallbackMessage로 500을 반환한다.
 */
export function handleApiError(
  context: string,
  error: unknown,
  fallbackMessage: string
) {
  if (error instanceof z.ZodError) {
    return jsonError(error.issues[0].message, 400);
  }
  logError(context, error);
  return jsonError(fallbackMessage, 500);
}

/**
 * 주최자 전용 작업(약속 수정·삭제)의 hostToken 검증.
 */
export function isValidHostToken(
  existingToken: string | null | undefined,
  providedToken: string | null | undefined
): boolean {
  return !!existingToken && !!providedToken && providedToken === existingToken;
}
