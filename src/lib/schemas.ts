import { z } from "zod";

/** "HH:MM" 24시간제 */
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "시간 형식이 올바르지 않습니다");

/** 날짜 — "YYYY-MM-DD" 또는 그 뒤에 시각이 붙은 ISO 문자열(클라이언트가 Date.toISOString()으로 보냄), 실제로 해석되는 날짜여야 한다 */
export const dateSchema = z
  .string()
  .max(30)
  .regex(/^\d{4}-\d{2}-\d{2}(T[0-9:.]+Z?)?$/, "날짜 형식이 올바르지 않습니다")
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "날짜 형식이 올바르지 않습니다");
