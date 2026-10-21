/** 한국 시간 기준 오늘 날짜(YYYY-MM-DD) */
export function todayKST(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

/** 마감까지 남은 날짜 수. 상시채용이면 null, 지났으면 음수 */
export function daysLeft(deadline: string | null, today: string = todayKST()): number | null {
  if (!deadline) return null;
  const ms = Date.parse(deadline + "T00:00:00Z") - Date.parse(today + "T00:00:00Z");
  return Math.round(ms / 86_400_000);
}

export type DeadlineTone = "closed" | "urgent" | "soon" | "open" | "always";

export function deadlineLabel(deadline: string | null, today?: string): { text: string; tone: DeadlineTone } {
  const d = daysLeft(deadline, today);
  if (d === null) return { text: "상시", tone: "always" };
  if (d < 0) return { text: "마감", tone: "closed" };
  if (d === 0) return { text: "오늘 마감", tone: "urgent" };
  if (d <= 3) return { text: `D-${d}`, tone: "urgent" };
  if (d <= 7) return { text: `D-${d}`, tone: "soon" };
  return { text: `D-${d}`, tone: "open" };
}
