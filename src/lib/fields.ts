import type { JobField } from "./types";

/**
 * 공고 제목·직무(NCS)·본문 텍스트에서 채용 분야를 찾는다.
 * 한 공고가 여러 분야를 뽑을 수 있어 배열로 돌려준다(예: "전기·통신").
 */
const RULES: [JobField, RegExp][] = [
  ["전기", /전기|배전|송변전|송전|변전|전력설비|발전설비|전기설비|전기직/],
  ["전자", /전자|반도체|계측|제어계측|전자직/],
  ["통신", /통신|네트워크|무선|방송기술|신호(?:제어)?/],
  ["전산·IT", /전산|정보기술|정보처리|정보시스템|정보보호|정보보안|사이버보안|소프트웨어|(?<![A-Za-z])(?:IT|ICT|SW)(?![A-Za-z])|데이터|프로그래밍|개발자|클라우드/],
  ["사무", /사무|행정|일반직|경영지원|회계|총무|고객지원|창구/],
  ["시설관리", /시설관리|시설직|시설운영|설비관리|기계설비|건축설비|청사관리|영선|시설물/],
];

export const JOB_FIELDS: JobField[] = RULES.map(([f]) => f);

export function classifyFields(text: string): JobField[] {
  return RULES.filter(([, re]) => re.test(text)).map(([f]) => f);
}
