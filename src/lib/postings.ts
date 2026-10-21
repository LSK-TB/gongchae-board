import archiveData from "../../data/archive.json";
import data from "../../data/postings.json";
import resourcesData from "../../data/resources.json";
import type { JobPosting, ResourceItem } from "./types";

/**
 * 빌드 시점에 데이터 파일을 읽는다. 수집기(npm run collect)가 두 파일을 갱신한다.
 * - postings.json: 진행중 + 마감 후 14일 이내
 * - archive.json:  마감 후 14일이 지난 공고(보관함)
 */
export function getAllPostings(): JobPosting[] {
  return (data as { postings: JobPosting[] }).postings;
}

export function getArchivedPostings(): JobPosting[] {
  return (archiveData as { postings: JobPosting[] }).postings;
}

export function getUpdatedAt(): string {
  return (data as { updatedAt: string }).updatedAt;
}

/** URL에 쓸 ID ("jobalio:123" → "jobalio-123") */
export function toSlug(id: string): string {
  return id.replace(":", "-");
}

export function getPostingBySlug(slug: string): { posting: JobPosting; archived: boolean } | undefined {
  const active = getAllPostings().find((p) => toSlug(p.id) === slug);
  if (active) return { posting: active, archived: false };
  const old = getArchivedPostings().find((p) => toSlug(p.id) === slug);
  return old ? { posting: old, archived: true } : undefined;
}

export const SOURCE_LABELS: Record<string, string> = {
  jobalio: "잡알리오",
  narailter: "나라일터",
  incheon: "인천일자리포털",
  cleaneye: "클린아이",
  sample: "예시 데이터",
};

/**
 * 공고 자료실 항목. 지금은 data/resources.json을 손으로 관리한다.
 * TODO: 수집기가 공고 상세의 첨부파일(공고문 PDF 등)을 찾으면 여기에 자동으로 추가
 */
export function getResources(): ResourceItem[] {
  return (resourcesData as { items: ResourceItem[] }).items;
}
