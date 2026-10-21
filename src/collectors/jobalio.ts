import { classifyEducation } from "../lib/education";
import { classifyFields } from "../lib/fields";
import { normalizeRegion } from "../lib/regions";
import type { EducationLevel, EmploymentType, JobPosting, OrgType } from "../lib/types";
import { fetchJson, toIsoDate } from "./http";
import type { Collector } from "./types";

/**
 * 잡알리오 (기획재정부 공공기관 채용정보) — data.go.kr 15125273
 * https://www.data.go.kr/data/15125273/openapi.do
 *
 * TODO(인증키 발급 후 확인): 아래 필드명은 공개 명세 기준 추정값이다.
 * 실제 응답 한 건을 받아 보고 맞춰야 한다. 특히 학력 코드값(acbgCondLst)은
 * 코드정의서 PDF와 대조해서 ACBG_CODE 표를 채운다.
 */
const BASE = "https://apis.data.go.kr/1051000/recruitment/list";

interface AlioItem {
  recrutPblntSn: number | string; // 공고 일련번호
  instNm: string; // 기관명
  recrutPbancTtl: string; // 공고 제목
  pbancBgngYmd?: string; // 접수 시작
  pbancEndYmd?: string; // 접수 마감
  srcUrl?: string; // 원문 링크
  workRgnNmLst?: string; // 근무지역 (쉼표 구분)
  hireTypeNmLst?: string; // 고용형태
  acbgCondNmLst?: string; // 학력조건 이름 목록
  ncsCdNmLst?: string; // NCS 직무분류 이름 목록
  recrutNope?: number | string; // 채용 인원
  aplyQlfcCn?: string; // 응시자격
  replmprYn?: string; // 대체인력 여부
}

interface AlioResponse {
  resultCode?: number;
  result?: AlioItem[];
  totalCount?: number;
}

const ACBG_CODE: Record<string, EducationLevel> = {
  // 예: "고졸": "고졸", "학력무관": "학력무관", "대졸(4년)": "대졸이상" ...
};

function mapEducation(item: AlioItem): EducationLevel {
  const names = (item.acbgCondNmLst ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const levels = names.map((n) => ACBG_CODE[n] ?? classifyEducation(n));
  if (levels.includes("학력무관")) return "학력무관";
  if (levels.includes("고졸")) return levels.length === 1 ? "고졸" : "고졸이상";
  if (levels.length && levels.every((l) => l === "대졸이상")) return "대졸이상";
  return classifyEducation(`${item.recrutPbancTtl} ${item.aplyQlfcCn ?? ""}`);
}

function mapEmployment(raw = ""): EmploymentType {
  if (raw.includes("정규")) return "정규직";
  if (raw.includes("무기")) return "무기계약직";
  if (raw.includes("인턴")) return "인턴";
  if (raw.includes("비정규") || raw.includes("계약")) return "계약직";
  return "기타";
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
    for (let page = 1; page <= 20; page++) {
      const url = `${BASE}?serviceKey=${encodeURIComponent(key)}&resultType=json&numOfRows=${rows}&pageNo=${page}&ongoingYn=Y`;
      const res = await fetchJson<AlioResponse>(url);
      const items = res.result ?? [];
      for (const it of items) {
        out.push({
          id: `jobalio:${it.recrutPblntSn}`,
          source: "jobalio",
          sourceId: String(it.recrutPblntSn),
          title: it.recrutPbancTtl,
          org: it.instNm,
          orgType: "공기업" as OrgType, // TODO: 기관 유형 필드 또는 기관 목록으로 구분
          regions: (it.workRgnNmLst ?? "").split(",").map(normalizeRegion).filter((r): r is string => !!r),
          education: mapEducation(it),
          fields: classifyFields(`${it.recrutPbancTtl} ${it.ncsCdNmLst ?? ""}`),
          employmentType: mapEmployment(it.hireTypeNmLst),
          headcount: it.recrutNope ? Number(it.recrutNope) : null,
          startDate: toIsoDate(it.pbancBgngYmd),
          deadline: toIsoDate(it.pbancEndYmd),
          url: it.srcUrl || `https://job.alio.go.kr/recruitview.do?idx=${it.recrutPblntSn}`,
          summary: it.aplyQlfcCn?.slice(0, 500),
          collectedAt: now.toISOString(),
        });
      }
      log(`잡알리오 ${page}쪽: ${items.length}건`);
      if (items.length < rows) break;
    }
    return out;
  },
};
