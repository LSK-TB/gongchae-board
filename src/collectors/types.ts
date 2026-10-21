import type { JobPosting, SourceId } from "../lib/types";

/**
 * 수집기 하나 = 출처 하나.
 * 새 출처를 붙이려면 이 인터페이스를 구현하고 registry.ts에 등록하면 된다.
 */
export interface Collector {
  id: SourceId;
  name: string;
  /** "api"는 공식 API, "crawl"은 웹페이지 크롤링 */
  kind: "api" | "crawl";
  /** 실행에 필요한 조건(인증키 등)이 갖춰졌는지. false면 건너뛴다 */
  isReady(): boolean;
  collect(ctx: CollectContext): Promise<JobPosting[]>;
}

export interface CollectContext {
  now: Date;
  log: (msg: string) => void;
}
