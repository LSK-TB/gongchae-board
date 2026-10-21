import { getAllPostings, getArchivedPostings } from "@/lib/postings";

// 빌드할 때 한 번 만들어 두는 정적 파일
export const dynamic = "force-static";

const HEADER = ["구분", "기관", "기관 유형", "분야", "공고명", "학력", "고용 형태", "채용 인원", "근무지역", "접수 시작", "마감", "원문 링크"];

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function GET() {
  const rows = [
    ...getAllPostings().map((p) => ["채용공고", p] as const),
    ...getArchivedPostings().map((p) => ["보관함", p] as const),
  ].map(([kind, p]) =>
    [kind, p.org, p.orgType, p.fields.join("/"), p.title, p.education, p.employmentType, p.headcount, p.regions.join("/"), p.startDate, p.deadline ?? "상시", p.url]
      .map(cell)
      .join(","),
  );
  // 엑셀에서 한글이 깨지지 않도록 BOM을 붙인다
  const body = "﻿" + [HEADER.join(","), ...rows].join("\r\n") + "\r\n";
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8" } });
}
