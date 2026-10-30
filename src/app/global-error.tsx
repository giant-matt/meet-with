"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("app/global-error boundary", error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1rem",
            textAlign: "center",
            background: "#ffffff",
            color: "#1a1a1a",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
            문제가 발생했습니다
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6b6b6b",
              maxWidth: "24rem",
              margin: 0,
            }}
          >
            앱을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "0.5rem",
              background: "#3A7D44",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
