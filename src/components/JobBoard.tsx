"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { daysLeft, todayKST } from "@/lib/deadline";
import { isOpenToHighSchoolGrads } from "@/lib/education";
import { JOB_FIELDS } from "@/lib/fields";
import { SOURCE_LABELS, toSlug } from "@/lib/postings";
import { REGIONS } from "@/lib/regions";
import type { JobPosting, OrgType } from "@/lib/types";
import { DeadlineBadge } from "./DeadlineBadge";

type Tab = "open" | "closed";

interface Filters {
  tab: Tab;
  field: string;
  q: string;
  region: string;
  orgType: string;
  source: string;
  includeOver: boolean; // '고졸 이상'(대졸과 함께 경쟁) 공고도 보기
}

const DEFAULT: Filters = { tab: "open", field: "", q: "", region: "", orgType: "", source: "", includeOver: true };
const ORG_TYPES: OrgType[] = ["공기업", "준정부기관", "기타공공기관", "지방공기업", "지방출자출연기관", "중앙정부", "지방자치단체"];

function readFromUrl(): Filters {
  const p = new URLSearchParams(window.location.search);
  return {
    tab: p.get("tab") === "closed" ? "closed" : "open",
    field: p.get("field") ?? "",
    q: p.get("q") ?? "",
    region: p.get("region") ?? "",
    orgType: p.get("orgType") ?? "",
    source: p.get("source") ?? "",
    includeOver: p.get("over") !== "0",
  };
}

function writeToUrl(f: Filters) {
  const p = new URLSearchParams();
  if (f.tab !== "open") p.set("tab", f.tab);
  if (f.field) p.set("field", f.field);
  if (f.q) p.set("q", f.q);
  if (f.region) p.set("region", f.region);
  if (f.orgType) p.set("orgType", f.orgType);
  if (f.source) p.set("source", f.source);
  if (!f.includeOver) p.set("over", "0");
  const qs = p.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

const isClosed = (p: JobPosting, today: string) => {
  const d = daysLeft(p.deadline, today);
  return d !== null && d < 0;
};

/**
 * 공고 목록 + 필터.
 * - variant "board": 진행중 / 마감(14일 이내) 탭으로 나눠 보여준다
 * - variant "archive": 보관함. 탭 없이 최근 마감 순으로 보여준다
 */
export function JobBoard({
  postings,
  updatedAt,
  variant = "board",
}: {
  postings: JobPosting[];
  updatedAt: string;
  variant?: "board" | "archive";
}) {
  const [f, setF] = useState<Filters>(DEFAULT);
  // 빌드한 날이 아니라 방문한 날 기준으로 진행중/마감과 D-day를 계산한다
  const [today, setToday] = useState<string>(updatedAt.slice(0, 10));

  useEffect(() => {
    setF(readFromUrl());
    setToday(todayKST());
  }, []);

  const update = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    setF(next);
    writeToUrl(next);
  };

  const sources = useMemo(() => [...new Set(postings.map((p) => p.source))], [postings]);

  // 탭을 뺀 나머지 필터를 먼저 적용한다(탭별 건수를 보여주려고)
  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return postings.filter((p) => {
      if (!isOpenToHighSchoolGrads(p.education, f.includeOver)) return false;
      if (f.field && !p.fields.includes(f.field as JobPosting["fields"][number])) return false;
      if (f.region && !p.regions.includes(f.region) && !p.regions.includes("전국")) return false;
      if (f.orgType && p.orgType !== f.orgType) return false;
      if (f.source && p.source !== f.source) return false;
      if (q && !`${p.title} ${p.org}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [postings, f, today]);

  const openList = filtered
    .filter((p) => !isClosed(p, today))
    .sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999")); // 마감 임박 순, 상시는 맨 뒤
  const closedList = filtered
    .filter((p) => variant === "archive" || isClosed(p, today))
    .sort((a, b) => (b.deadline ?? "").localeCompare(a.deadline ?? "")); // 최근 마감 순

  const list = variant === "archive" ? closedList : f.tab === "open" ? openList : closedList;

  return (
    <section>
      {variant === "board" && (
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={f.tab === "open"} className={f.tab === "open" ? "on" : ""} onClick={() => update({ tab: "open" })}>
            진행중 <span className="count">{openList.length}</span>
          </button>
          <button role="tab" aria-selected={f.tab === "closed"} className={f.tab === "closed" ? "on" : ""} onClick={() => update({ tab: "closed" })}>
            마감 <span className="count">{closedList.length}</span>
          </button>
        </div>
      )}

      <div className="chips" role="group" aria-label="분야">
        {["", ...JOB_FIELDS].map((fd) => (
          <button key={fd || "all"} className={f.field === fd ? "chip on" : "chip"} onClick={() => update({ field: fd })}>
            {fd || "전체 분야"}
          </button>
        ))}
      </div>

      <div className="filters" role="search">
        <input type="search" placeholder="기관명·공고명 검색" value={f.q} onChange={(e) => update({ q: e.target.value })} aria-label="검색" />
        <select value={f.region} onChange={(e) => update({ region: e.target.value })} aria-label="지역">
          <option value="">전체 지역</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={f.orgType} onChange={(e) => update({ orgType: e.target.value })} aria-label="기관 유형">
          <option value="">전체 기관</option>
          {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={f.source} onChange={(e) => update({ source: e.target.value })} aria-label="출처">
          <option value="">전체 출처</option>
          {sources.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s] ?? s}</option>)}
        </select>
        <label className="check">
          <input type="checkbox" checked={f.includeOver} onChange={(e) => update({ includeOver: e.target.checked })} />
          고졸 이상 공고 포함
        </label>
      </div>

      <p className="meta">
        {variant === "archive"
          ? `${list.length}건 · 마감 후 14일이 지난 공고 · 최근 마감 순`
          : f.tab === "open"
            ? `${list.length}건 · 마감 임박 순 · 업데이트 ${updatedAt.slice(0, 10)}`
            : `${list.length}건 · 마감 후 14일 이내 공고 · 더 지난 공고는 보관함에 있어요`}
      </p>

      {list.length === 0 ? (
        <p className="empty">조건에 맞는 공고가 없어요. 필터를 바꿔 보세요.</p>
      ) : (
        <ul className="job-list">
          {list.map((p) => (
            <li key={p.id} className={isClosed(p, today) ? "job-card closed" : "job-card"}>
              <Link href={`/jobs/${toSlug(p.id)}/`}>
                <div className="job-top">
                  <DeadlineBadge deadline={p.deadline} today={today} />
                  {p.fields.map((fd) => <span key={fd} className="badge field">{fd}</span>)}
                  <span className={`badge edu-${p.education}`}>{p.education}</span>
                  <span className="badge muted">{p.employmentType}</span>
                </div>
                <h2>{p.title}</h2>
                <p className="job-org">
                  {p.org} · {p.orgType} · {p.regions.join(", ") || "지역 미상"}
                </p>
                <p className="job-dates">
                  접수 {p.startDate ?? "?"} ~ {p.deadline ?? "채용 시까지"}
                  {p.headcount ? ` · ${p.headcount}명` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
