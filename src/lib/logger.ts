export function logError(context: string, error: unknown) {
  // console.error는 Vercel 함수 로그로 수집된다 — 서버리스 환경에서는
  // 로컬 파일 쓰기가 배포마다 초기화되어 남지 않으므로 쓰지 않는다.
  console.error(`[${context}]`, error);
}
