import { classifyEducation } from "../lib/education";
import { classifyFields } from "../lib/fields";
import { normalizeRegions } from "../lib/regions";
import type { EducationLevel, EmploymentType, JobField, JobPosting } from "../lib/types";
import { fetchJson, toIsoDate } from "./http";
import type { Collector } from "./types";

/**
 * 잡알리오 (기획재정부 공공기관 채용정보) — data.go.kr 15125273
 * https://www.data.go.kr/data/15125273/openapi.do
 * 필드명과 코드값은 2026-10-21 실제 응답(진행 중 497건)으로 확인했다.
 */
const BASE = "https://apis.data.go.kr/1051000/recruitment/list";

export interface AlioItem {
  recrutPblntSn: number; // 공고 일련번호
  instNm: string; // 기관명
  recrutPbancTtl: string; // 공고 제목
  pbancBgngYmd?: string; // 접수 시작 (YYYYMMDD)
  pbancEndYmd?: string; // 접수 마감 (YYYYMMDD)
  srcUrl?: string; // 기관 원문 링크
  workRgnNmLst?: string; // 근무지역, 쉼표 구분 (예: "서울,전남광주")
  hireTypeNmLst?: string; // 정규직 / 비정규직 / 무기계약직 / 청년인턴(체험형) / 청년인턴(채용형)
  acbgCondNmLst?: string; // 학력: 학력무관 / 중졸이하 / 고졸 / 대졸(2~3년) / 대졸(4년) / 석사 / 박사
  ncsCdNmLst?: string; // NCS 대분류 (예: "전기.전자", "정보통신", "경영.회계.사무")
  recrutNope?: number; // 채용 인원
  aplyQlfcCn?: string; // 응시자격
}

interface AlioResponse {
  resultCode?: number;
  resultMsg?: string;
  totalCount?: number;
  result?: AlioItem[];
}

const list = (s?: string) => (s ?? "").split(",").map((x) => x.trim()).filter(Boolean);

/**
 * 학력 목록 → 이 사이트의 학력 구분.
 * 공고 하나에 여러 직무가 섞이면 "학력무관,고졸"처럼 여러 값이 온다.
 * 고졸이 명시돼 있으면 고졸 지원 가능 공고로 본다.
 */
export function mapEducation(raw?: string): EducationLevel {
  const names = list(raw);
  const hasHs = names.includes("고졸");
  const hasHigher = names.some((n) => n.startsWith("대졸") || n === "석사" || n === "박사");
  if (hasHs) return hasHigher ? "고졸이상" : "고졸";
  if (names.includes("학력무관")) return "학력무관";
  if (hasHigher) return "대졸이상";
  return "미확인";
}

export function mapEmployment(raw = ""): EmploymentType {
  // "비정규직"에도 "정규"가 들어 있으니 순서가 중요하다
  if (raw.includes("비정규")) return "계약직";
  if (raw.includes("인턴")) return "인턴";
  if (raw.includes("무기")) return "무기계약직";
  if (raw.includes("정규")) return "정규직";
  return "기타";
}

const NCS_FIELDS: Record<string, JobField[]> = {
  "전기.전자": ["전기", "전자"],
  정보통신: ["전산·IT", "통신"],
  "경영.회계.사무": ["사무"],
};

/** 제목에서 분야를 먼저 찾고, 없으면 NCS 대분류로 추정한다 */
export function mapFields(item: Pick<AlioItem, "recrutPbancTtl" | "ncsCdNmLst">): JobField[] {
  const fromTitle = classifyFields(item.recrutPbancTtl);
  if (fromTitle.length) return fromTitle;
  return [...new Set(list(item.ncsCdNmLst).flatMap((n) => NCS_FIELDS[n] ?? []))];
}

export function toPosting(it: AlioItem, now: Date): JobPosting {
  const education = mapEducation(it.acbgCondNmLst);
  return {
    id: `jobalio:${it.recrutPblntSn}`,
    source: "jobalio",
    sourceId: String(it.recrutPblntSn),
    title: it.recrutPbancTtl.trim(),
    org: it.instNm.trim(),
    orgType: "공공기관", // 응답에 기관 유형이 없다
    regions: normalizeRegions(it.workRgnNmLst ?? ""),
    education: education === "미확인" ? classifyEducation(`${it.recrutPbancTtl} ${it.aplyQlfcCn ?? ""}`) : education,
    fields: mapFields(it),
    employmentType: mapEmployment(it.hireTypeNmLst),
    headcount: it.recrutNope ? Number(it.recrutNope) : null,
    startDate: toIsoDate(it.pbancBgngYmd),
    deadline: toIsoDate(it.pbancEndYmd),
    url: `https://job.alio.go.kr/recruitview.do?idx=${it.recrutPblntSn}`,
    summary: it.aplyQlfcCn?.replace(/\r\n/g, "\n").trim().slice(0, 600),
    collectedAt: now.toISOString(),
  };
}

export const jobalio: Collector = {
  id: "jobalio",
  name: "잡알리오",
  kind: "api",
  isReady: () => Boolean(process.env.DATA_GO_KR_SERVICE_KEY),
  async collect({ now, log }) {
    const key = process.env.DATA_GO_KR_SERVICE_KEY!;
    const out: JobPosting[] = [];
    const rows = 100;
    for (let page = 1; page <= 30; page++) {
      const url = `${BASE}?serviceKey=${encodeURIComponent(key)}&resultType=json&numOfRows=${rows}&pageNo=${page}&ongoingYn=Y`;
      const res = await fetchJson<AlioResponse>(url);
      if (res.resultCode !== undefined && res.resultCode !== 200) throw new Error(`잡알리오 오류 ${res.resultCode} ${res.resultMsg ?? ""}`);
      const items = res.result ?? [];
      out.push(...items.map((it) => toPosting(it, now)));
      log(`잡알리오 ${page}쪽: ${items.length}건 (전체 ${res.totalCount ?? "?"})`);
      if (items.length < rows) break;
    }
    return out;
  },
};
