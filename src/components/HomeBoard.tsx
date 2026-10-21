"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { daysLeft, todayKST } from "@/lib/deadline";
import { isOpenToHighSchoolGrads } from "@/lib/education";
import { JOB_FIELDS } from "@/lib/fields";
import { toSlug } from "@/lib/postings";
import { postingStatus, shortDate, STATUS_LABEL } from "@/lib/status";
import type { JobField, JobPosting, OrgType, ResourceItem } from "@/lib/types";
import { DeadlineBadge } from "./DeadlineBadge";

type Tab = "board" | "archive" | "resources";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** 기관 칩에 보여줄 묶음. 데이터에 있는 것만 보여준다 */
const ORG_GROUPS: { label: string; types: OrgType[] }[] = [
  { label: "공공기관", types: ["공공기관", "공기업", "준정부기관", "기타공공기관"] },
  { label: "지방공기업", types: ["지방공기업", "지방출자출연기관"] },
  { label: "정부·지자체", types: ["중앙정부", "지방자치단체"] },
];

const byDeadline = (a: JobPosting, b: JobPosting) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999");
const byDeadlineDesc = (a: JobPosting, b: JobPosting) => (b.deadline ?? "").localeCompare(a.deadline ?? "");

export function HomeBoard({
  postings,
  archive,
  resources,
  updatedAt,
  initialTab = "board",
}: {
  postings: JobPosting[];
  archive: JobPosting[];
  resources: ResourceItem[];
  updatedAt: string;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [q, setQ] = useState("");
  const [field, setField] = useState<JobField | "">("");
  const [org, setOrg] = useState("");
  const [includeOver, setIncludeOver] = useState(true);
  // 빌드한 날이 아니라 방문한 날 기준으로 상태와 D-day를 계산한다
  const [today, setToday] = useState(updatedAt.slice(0, 10));

  useEffect(() => {
    setToday(todayKST());
    const p = new URLSearchParams(window.location.search);
    const t = p.get("tab");
    if (t === "archive" || t === "resources") setTab(t);
  }, []);

  const changeTab = (t: Tab) => {
    setTab(t);
    window.history.replaceState(null, "", t === "board" ? window.location.pathname : `?tab=${t}`);
  };

  // 요약 숫자
  const stats = useMemo(() => {
    const live = postings.filter((p) => postingStatus(p, today) !== "closed");
    const soon = live.filter((p) => {
      const d = daysLeft(p.deadline, today);
      return d !== null && d <= 7 && postingStatus(p, today) === "open";
    });
    const year = today.slice(0, 4);
    const thisYear = [...postings, ...archive].filter((p) => (p.deadline ?? p.startDate ?? "").startsWith(year));
    return { live: live.length, soon: soon.length, year: thisYear.length };
  }, [postings, archive, today]);

  // 탭에 따라 대상 목록 → 분야 외 필터 적용(분야 칩 숫자 계산용) → 분야 필터
  const source = tab === "archive" ? archive : postings;
  const preField = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const group = ORG_GROUPS.find((g) => g.label === org);
    return source.filter(
      (p) =>
        isOpenToHighSchoolGrads(p.education, includeOver) &&
        (!group || group.types.includes(p.orgType)) &&
        (!kw || `${p.org} ${p.title}`.toLowerCase().includes(kw)),
    );
  }, [source, q, org, includeOver]);
  const shown = field ? preField.filter((p) => p.fields.includes(field)) : preField;

  // 자료실은 기관명 검색만 적용한 뒤 분야로 거른다
  const kwRes = q.trim().toLowerCase();
  const resPre = resources.filter((r) => !kwRes || `${r.org} ${r.title}`.toLowerCase().includes(kwRes));
  const resShown = (field ? resPre.filter((r) => r.fields.includes(field)) : resPre).sort((a, b) => b.date.localeCompare(a.date));

  const countBase: { fields: JobField[] }[] = tab === "resources" ? resPre : preField;
  const fieldCount = (f: JobField) => countBase.filter((p) => p.fields.includes(f)).length;
  const orgGroups = ORG_GROUPS.filter((g) => source.some((p) => g.types.includes(p.orgType)));

  const live = shown.filter((p) => postingStatus(p, today) !== "closed").sort(byDeadline);
  const closed = shown.filter((p) => postingStatus(p, today) === "closed").sort(byDeadlineDesc);

  return (
    <>
      <section className="hero">
        <p className="eyebrow">공공기관 · 고졸 전형</p>
        <h1>고졸 공채 알림판</h1>
        <p className="lead">
          공기업·공공기관 채용 중 고졸 대상 <strong>전기 · 전자 · 통신 · 전산/IT · 사무 · 시설관리</strong> 분야만 골라
          정리했습니다.
          학력무관 공고는 싣지 않습니다.
        </p>
        <div className="stats">
          <div className="stat">
            <span className="num">{stats.live}</span>
            <span className="label">접수 중·예정</span>
          </div>
          <div className="stat">
            <span className="num warn">{stats.soon}</span>
            <span className="label">7일 안에 마감</span>
          </div>
          <div className="stat">
            <span className="num">{stats.year}</span>
            <span className="label">올해 정리한 공고</span>
          </div>
        </div>
      </section>

      <aside className="callout">
        <span className="callout-icon" aria-hidden="true">!</span>
        <p>
          <strong>지원 전에 꼭</strong> 기관 채용 홈페이지나 잡알리오(job.alio.go.kr)의 공식 공고문으로 자격 요건과
          일정을 다시 확인하세요. 이 페이지는 요약본이라 세부 조건이 빠져 있을 수 있습니다.
        </p>
      </aside>

      <div className="toolbar">
        <a className="download" href={`${BASE}/postings.csv`} download="고졸공채_공고목록.csv">
          <span className="file-tag">CSV</span>
          전체 공고 엑셀로 내려받기
        </a>
        <span className="updated">업데이트 {updatedAt.slice(0, 10)}</span>
      </div>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "board"} className={tab === "board" ? "on" : ""} onClick={() => changeTab("board")}>
          채용공고 <span className="pill">{postings.length}</span>
        </button>
        <button role="tab" aria-selected={tab === "archive"} className={tab === "archive" ? "on" : ""} onClick={() => changeTab("archive")}>
          지난 공고 보관함 <span className="pill">{archive.length}</span>
        </button>
        <button role="tab" aria-selected={tab === "resources"} className={tab === "resources" ? "on" : ""} onClick={() => changeTab("resources")}>
          공고 자료실 <span className="pill">{resources.length}</span>
        </button>
      </div>

      <label className="search">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          id="q"
          type="search"
          placeholder="기관명 검색 (예: 한전, 수자원, 교통공사)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="기관명 검색"
        />
      </label>

      <div className="chip-row" role="group" aria-label="분야">
        <button className={field === "" ? "chip on" : "chip"} onClick={() => setField("")}>
          전체 <span className="n">{countBase.length}</span>
        </button>
        {JOB_FIELDS.map((f) => (
          <button key={f} className={field === f ? "chip on" : "chip"} onClick={() => setField(f)}>
            {f.replace("·", "/")} <span className="n">{fieldCount(f)}</span>
          </button>
        ))}
      </div>

      {tab !== "resources" && (
      <div className="chip-row small" role="group" aria-label="기관">
        <span className="row-label">기관</span>
        <button className={org === "" ? "chip on" : "chip"} onClick={() => setOrg("")}>전체</button>
        {orgGroups.map((g) => (
          <button key={g.label} className={org === g.label ? "chip on" : "chip"} onClick={() => setOrg(g.label)}>
            {g.label}
          </button>
        ))}
        <label className="toggle">
          <input type="checkbox" checked={includeOver} onChange={(e) => setIncludeOver(e.target.checked)} />
          고졸 이상 공고 포함
        </label>
      </div>
      )}

      {tab === "board" ? (
        <>
          <Section title="접수 중 · 접수 예정" list={live} today={today} empty="조건에 맞는 접수 중 공고가 없어요." />
          <Section
            title="최근 마감"
            note="마감 후 14일이 지나면 보관함으로 옮겨져요"
            list={closed}
            today={today}
            empty="최근 2주 안에 마감된 공고가 없어요."
          />
        </>
      ) : tab === "resources" ? (
        <ResourceSection list={resShown} />
      ) : (
        <Section
          title="지난 공고"
          note="마감 후 14일이 지난 공고 · 지난 채용 시기와 인원을 참고하세요"
          list={closed}
          today={today}
          empty="조건에 맞는 지난 공고가 없어요."
        />
      )}
    </>
  );
}

function Section({ title, note, list, today, empty }: { title: string; note?: string; list: JobPosting[]; today: string; empty: string }) {
  return (
    <section className="list-section">
      <h2 className="section-title">
        {title} <span className="pill">{list.length}건</span>
      </h2>
      {note && <p className="section-note">{note}</p>}
      {list.length === 0 ? (
        <p className="empty">{empty}</p>
      ) : (
        <ul className="job-list">
          {list.map((p) => (
            <JobCard key={p.id} p={p} today={today} />
          ))}
        </ul>
      )}
    </section>
  );
}

function JobCard({ p, today }: { p: JobPosting; today: string }) {
  const status = postingStatus(p, today);
  return (
    <li className={`job-card status-${status}`}>
      <Link href={`/jobs/${toSlug(p.id)}/`}>
        <div className="card-top">
          {status === "upcoming" ? (
            <span className="status-pill upcoming">
              <b>{shortDate(p.startDate)}</b> 접수 시작
            </span>
          ) : (
            <span className={`status-pill ${status}`}>
              <DeadlineBadge deadline={p.deadline} today={today} />
              {status === "closed" ? `${shortDate(p.deadline)} 마감` : STATUS_LABEL[status]}
            </span>
          )}
        </div>
        <h3>
          {p.org}
          {p.fields.map((f) => (
            <span key={f} className="field-tag">{f.replace("·", "/")}</span>
          ))}
        </h3>
        <p className="job-title">{p.title}</p>
        <p className="job-meta">
          {p.orgType} · {p.regions.join(", ") || "지역 미상"} · {p.employmentType}
          {p.headcount ? ` · ${p.headcount}명` : ""}
          {p.education === "고졸이상" ? " · 고졸 이상" : ""}
        </p>
        <p className="job-meta">
          접수 {shortDate(p.startDate) || "?"} ~ {p.deadline ? shortDate(p.deadline) : "채용 시까지"}
        </p>
      </Link>
    </li>
  );
}

function ResourceSection({ list }: { list: ResourceItem[] }) {
  return (
    <section className="list-section">
      <h2 className="section-title">
        공고 자료실 <span className="pill">{list.length}건</span>
      </h2>
      <p className="section-note">공고문, 직무기술서, 필기시험 안내처럼 지원 준비에 필요한 자료를 모았어요. 누르면 원문이 새 창으로 열려요.</p>
      {list.length === 0 ? (
        <p className="empty">조건에 맞는 자료가 없어요.</p>
      ) : (
        <ul className="job-list">
          {list.map((r) => (
            <li key={r.id} className="job-card resource-card">
              <a href={r.url} target="_blank" rel="noopener noreferrer">
                <div className="card-top">
                  <span className="kind-tag">{r.kind}</span>
                </div>
                <h3>
                  {r.org}
                  {r.fields.map((f) => (
                    <span key={f} className="field-tag">{f.replace("·", "/")}</span>
                  ))}
                </h3>
                <p className="job-title">{r.title}</p>
                <p className="job-meta">
                  게시 {shortDate(r.date)}
                  {r.note ? ` · ${r.note}` : ""}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
