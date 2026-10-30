const SLUGS_KEY = "myEventSlugs";
const MAX_REMEMBERED = 100;

export function rememberEvent(slug: string) {
  const list = listRememberedEvents();
  if (list.includes(slug)) return;
  localStorage.setItem(
    SLUGS_KEY,
    JSON.stringify([slug, ...list].slice(0, MAX_REMEMBERED))
  );
}

export function forgetEvent(slug: string) {
  const list = listRememberedEvents();
  localStorage.setItem(
    SLUGS_KEY,
    JSON.stringify(list.filter((s) => s !== slug))
  );
}

export function listRememberedEvents(): string[] {
  try {
    const raw = localStorage.getItem(SLUGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getHostToken(slug: string): string | null {
  return localStorage.getItem(`hostToken:${slug}`);
}

export function setHostToken(slug: string, token: string) {
  localStorage.setItem(`hostToken:${slug}`, token);
}
