import type { Collector } from "./types";

/**
 * 인천일자리포털 공공일자리 — 크롤링
 * 목록: https://www.incheon.go.kr/job/JOB010201?curPage=N
 * 상세: https://www.incheon.go.kr/job/JOB010201/{번호}
 *
 * API가 없고 학력 필드도 없다. 상세 본문을 받아 classifyEducation()으로 판별한다.
 * 해외(클라우드) IP는 막힐 수 있어서 국내 서버나 내 PC에서 돌려야 할 수 있다.
 *
 * TODO: 목록 HTML 구조를 확인한 뒤 parseList/parseDetail을 구현한다.
 * 예상 흐름:
 *   1) 목록 1~N쪽을 받아 공고 번호·제목·기관·마감일을 뽑는다
 *   2) 새 번호만 상세를 받아 본문 텍스트로 학력·근무지를 판별한다
 *   3) 요청 사이에 1초 이상 쉬어 사이트에 부담을 주지 않는다
 */
export const incheon: Collector = {
  id: "incheon",
  name: "인천일자리포털",
  kind: "crawl",
  isReady: () => process.env.ENABLE_CRAWLERS === "1",
  async collect({ log }) {
    log("인천일자리포털 크롤러는 아직 구현 전입니다.");
    return [];
  },
};
