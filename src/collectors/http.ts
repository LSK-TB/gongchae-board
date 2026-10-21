/** 수집기 공용 fetch: 타임아웃과 재시도 */
export async function fetchText(url: string, opts: { retries?: number; timeoutMs?: number } = {}): Promise<string> {
  const { retries = 2, timeoutMs = 15_000 } = opts;
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { "User-Agent": "gongchae-board/0.1 (+고졸 공채 알림판)" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
  throw lastErr;
}

export async function fetchJson<T>(url: string): Promise<T> {
  return JSON.parse(await fetchText(url)) as T;
}

/** "20261031", "2026.10.31", "2026-10-31" → "2026-10-31" */
export function toIsoDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.replace(/\s/g, "").match(/(\d{4})[.\-/]?(\d{2})[.\-/]?(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}
