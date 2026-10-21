/** 공고를 올린 기관의 종류 */
export type OrgType =
  | "공기업"
  | "준정부기관"
  | "기타공공기관"
  | "지방공기업"
  | "지방출자출연기관"
  | "중앙정부"
  | "지방자치단체"
  | "기타";

/** 학력 조건 판별 결과 */
export type EducationLevel =
  | "고졸" // 고졸(또는 고졸 이하) 전용 채용
  | "학력무관" // 학력 제한 없음 → 고졸도 지원 가능
  | "고졸이상" // 고졸 이상이면 지원 가능(대졸도 함께 경쟁)
  | "대졸이상" // 고졸 지원 불가
  | "미확인"; // 원문에서 학력 정보를 못 찾음

/** 이 사이트가 다루는 채용 분야 */
export type JobField = "전기" | "전자" | "통신" | "전산·IT";

export type EmploymentType = "정규직" | "무기계약직" | "계약직" | "인턴" | "기타";

/** 수집처 식별자. 수집기를 추가하면 여기에도 추가한다. */
export type SourceId = "jobalio" | "narailter" | "incheon" | "cleaneye" | "sample";

/** 모든 수집기가 공통으로 만들어 내는 공고 한 건 */
export interface JobPosting {
  /** `${source}:${원본 ID}` 형태의 고유 ID */
  id: string;
  source: SourceId;
  sourceId: string;
  title: string;
  org: string;
  orgType: OrgType;
  /** 근무지역(시·도). 여러 곳이면 여러 개 */
  regions: string[];
  education: EducationLevel;
  /** 채용 분야. 비어 있으면 대상 분야가 아니라서 수집 단계에서 버린다 */
  fields: JobField[];
  employmentType: EmploymentType;
  /** 채용 인원(모르면 null) */
  headcount: number | null;
  /** 접수 시작/마감 (YYYY-MM-DD). 상시채용이면 deadline = null */
  startDate: string | null;
  deadline: string | null;
  /** 원문 공고 링크 */
  url: string;
  /** 상세 화면에 보여줄 요약(원문 일부) */
  summary?: string;
  /** 수집 시각(ISO) */
  collectedAt: string;
}
