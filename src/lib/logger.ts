import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "error.log");

export function logError(context: string, error: unknown) {
  const timestamp = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });
  const message =
    error instanceof Error
      ? `${error.message}\n  ${error.stack}`
      : String(error);

  const logLine = `[${timestamp}] [${context}]\n${message}\n${"─".repeat(60)}\n`;

  console.error(`[${context}]`, error);

  try {
    fs.appendFileSync(LOG_FILE, logLine, "utf-8");
  } catch {
    // 파일 쓰기 실패 시 무시
  }
}
