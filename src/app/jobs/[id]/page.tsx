import Link from "next/link";
import { notFound } from "next/navigation";
import { DeadlineBadge } from "@/components/DeadlineBadge";
import { getAllPostings, getArchivedPostings, getPostingBySlug, SOURCE_LABELS, toSlug } from "@/lib/postings";

export function generateStaticParams() {
  return [...getAllPostings(), ...getArchivedPostings()].map((p) => ({ id: toSlug(p.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = getPostingBySlug((await params).id)?.posting;
  return { title: p ? `${p.org} ${p.title} | 고졸 공채 알림판` : "공고 없음" };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const found = getPostingBySlug((await params).id);
  if (!found) notFound();
  const { posting: p, archived } = found;

  const rows: [string, string][] = [
    ["기관", `${p.org} (${p.orgType})`],
    ["분야", p.fields.join(", ")],
    ["근무지역", p.regions.join(", ") || "지역 미상"],
    ["학력 조건", p.education],
    ["고용 형태", p.employmentType],
    ["채용 인원", p.headcount ? `${p.headcount}명` : "공고 참고"],
    ["접수 기간", `${p.startDate ?? "?"} ~ ${p.deadline ?? "채용 시까지"}`],
    ["출처", SOURCE_LABELS[p.source] ?? p.source],
  ];

  return (
    <article className="detail">
      <Link href={archived ? "/archive/" : "/"} className="back">← {archived ? "보관함으로" : "공고 목록으로"}</Link>
      {archived && <p className="notice">마감 후 14일이 지나 보관함으로 옮겨진 공고입니다.</p>}
      <div className="job-top">
        <DeadlineBadge deadline={p.deadline} />
        <span className={`badge edu-${p.education}`}>{p.education}</span>
      </div>
      <h1>{p.title}</h1>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k} className="row">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {p.summary && <p className="summary">{p.summary}</p>}
      <a className="primary" href={p.url} target="_blank" rel="noopener noreferrer">
        원문 공고 보기
      </a>
      <p className="meta">수집 {p.collectedAt.slice(0, 10)} · 마감일은 원문 기준으로 다시 확인하세요.</p>
    </article>
  );
}
