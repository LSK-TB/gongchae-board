import { daysLeft } from "./deadline";
import type { JobPosting } from "./types";

export type PostingStatus = "upcoming" | "open" | "closed";

/** 접수 예정 / 접수 중 / 마감 */
export function postingStatus(p: JobPosting, today: string): PostingStatus {
  const end = daysLeft(p.deadline, today);
  if (end !== null && end < 0) return "closed";
  const start = daysLeft(p.startDate, today);
  if (start !== null && start > 0) return "upcoming";
  return "open";
}

export const STATUS_LABEL: Record<PostingStatus, string> = {
  upcoming: "접수 예정",
  open: "접수 중",
  closed: "마감",
};

/** "2026-10-27" → "10.27" */
export function shortDate(d: string | null): string {
  return d ? `${d.slice(5, 7)}.${d.slice(8, 10)}` : "";
}
