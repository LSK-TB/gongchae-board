import { daysLeft, todayKST } from "../lib/deadline";
import type { JobPosting, SourceId } from "../lib/types";

/** 마감 후 이 날짜 수가 지나면 보관함으로 옮긴다 */
export const ARCHIVE_AFTER_DAYS = 14;

/** 마감 후 ARCHIVE_AFTER_DAYS일이 지났는지 (상시채용은 보관하지 않음) */
export function shouldArchive(p: JobPosting, today: string): boolean {
  const d = daysLeft(p.deadline, today);
  return d !== null && d < -ARCHIVE_AFTER_DAYS;
}

const byDeadline = (a: JobPosting, b: JobPosting) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999");

/**
 * 새로 수집한 공고를 기존 공고·보관함과 합친다.
 * - 이번에 실패했거나 건너뛴 출처의 기존 공고는 그대로 둔다(일시 장애로 공고가 사라지지 않게)
 * - 같은 ID는 새 데이터로 덮어쓴다
 * - 마감 후 14일이 지난 공고는 지우지 않고 보관함(archive)으로 옮긴다
 */
export function mergePostings(
  existing: JobPosting[],
  archive: JobPosting[],
  fresh: JobPosting[],
  refreshedSources: Set<SourceId>,
  opts: { now: Date },
): { postings: JobPosting[]; archive: JobPosting[] } {
  const today = todayKST(opts.now);
  const archived = new Map(archive.map((p) => [p.id, p]));
  const active = new Map<string, JobPosting>();

  for (const p of existing) {
    if (!refreshedSources.has(p.source)) active.set(p.id, p);
    else if (shouldArchive(p, today)) archived.set(p.id, p); // 출처에서 내려갔어도 기록은 남긴다
  }
  for (const p of fresh) {
    if (archived.has(p.id)) archived.set(p.id, p);
    else active.set(p.id, p);
  }
  for (const [id, p] of active) {
    if (shouldArchive(p, today)) {
      archived.set(id, p);
      active.delete(id);
    }
  }
  return {
    postings: [...active.values()].sort(byDeadline),
    archive: [...archived.values()].sort((a, b) => byDeadline(b, a)), // 최근 마감이 위로
  };
}
