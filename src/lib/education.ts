import type { EducationLevel } from "./types";

/**
 * 공고 제목·본문 텍스트에서 학력 조건을 추정한다.
 * 인천일자리포털·클린아이처럼 학력 필드가 없는 출처에서 쓴다.
 * 순서가 중요하다: 더 구체적인 표현을 먼저 검사한다.
 */
const RULES: [RegExp, EducationLevel][] = [
  [/고졸\s*(전형|채용|인재|제한|이하)|고등학교\s*졸업\s*(예정자\s*)?(이하|만)|특성화고|마이스터고|고졸자\s*대상/, "고졸"],
  [/학력\s*(무관|제한\s*없|불문)|학력\s*:\s*무관/, "학력무관"],
  [/고졸\s*이상|고등학교\s*졸업\s*이상/, "고졸이상"],
  [/(대졸|학사|전문학사|대학교?\s*졸업)\s*(이상|예정)|석사|박사/, "대졸이상"],
];

export function classifyEducation(text: string): EducationLevel {
  for (const [re, level] of RULES) {
    if (re.test(text)) return level;
  }
  return "미확인";
}

/**
 * 이 사이트에 올릴 학력 조건인지.
 * - 고졸 전용 채용은 항상 포함
 * - "고졸 이상"(대졸과 함께 경쟁)은 includeOver가 true일 때만
 * - 학력무관 공고는 사용자 요청(2026-10-21)으로 제외
 */
export function isOpenToHighSchoolGrads(level: EducationLevel, includeOver: boolean): boolean {
  if (level === "고졸") return true;
  if (includeOver && level === "고졸이상") return true;
  return false;
}
