import type { Collector } from "./types";

/**
 * 클린아이 (지방공기업 경영정보) — 크롤링
 * 서울교통공사, 인천도시공사 같은 지방공기업 채용은 잡알리오에 거의 없어 여기서 보완한다.
 * 공식 API를 못 찾았으므로 채용공고 게시판을 크롤링한다.
 *
 * TODO: 게시판 URL과 HTML 구조를 확인한 뒤 구현한다.
 */
export const cleaneye: Collector = {
  id: "cleaneye",
  name: "클린아이",
  kind: "crawl",
  isReady: () => process.env.ENABLE_CRAWLERS === "1",
  async collect({ log }) {
    log("클린아이 크롤러는 아직 구현 전입니다.");
    return [];
  },
};
