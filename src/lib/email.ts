/**
 * 이메일 주소를 대소문자 무시하고 비교합니다.
 */
export function emailsMatch(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}
