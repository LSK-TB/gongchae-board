import { classifyEducation } from "../lib/education";
import { classifyFields } from "../lib/fields";
import { normalizeRegion } from "../lib/regions";
import type { JobPosting } from "../lib/types";
import { fetchJson, toIsoDate } from "./http";
import type { Collector } from "./types";

/**
 * 나라일터 (인사혁신처 공공채용정보) — data.go.kr 15156780
 * 중앙부처·지자체 공무직/기간제 채용이 많다. 고졸 지원 가능한 공고가 자주 섞여 있다.
 *
 * TODO(인증키 발급 후 확인): 응답 구조와 필드명을 실제 응답에 맞춘다.
 */
const BASE = "https://apis.data.go.kr/1760000/PblJobService/getList";

interface NaraItem {
  [k: string]: string | undefined;
}

export const narailter: Collector = {
  id: "narailter",
  name: "나라일터",
  kind: "api",
  isReady: () => Boolean(process.env.DATA_GO_KR_SERVICE_KEY),
  async collect({ now, log }) {
    const key = process.env.DATA_GO_KR_SERVICE_KEY!;
    const url = `${BASE}?serviceKey=${encodeURIComponent(key)}&type=json&numOfRows=100&pageNo=1`;
    const res = await fetchJson<{ response?: { body?: { items?: { item?: NaraItem[] } } } }>(url);
    const items = res.response?.body?.items?.item ?? [];
    log(`나라일터: ${items.length}건`);
    return items.map((it): JobPosting => {
      const sn = it.pbancSn ?? it.sn ?? "";
      const title = it.pbancTtl ?? it.title ?? "";
      return {
        id: `narailter:${sn}`,
        source: "narailter",
        sourceId: sn,
        title,
        org: it.instNm ?? it.orgNm ?? "",
        orgType: "중앙정부",
        regions: [normalizeRegion(it.workRgn ?? "") ?? "전국"],
        education: classifyEducation(`${title} ${it.aplyQlfc ?? ""}`),
        fields: classifyFields(`${title} ${it.jobFld ?? ""}`),
        employmentType: "기타",
        headcount: null,
        startDate: toIsoDate(it.rcptBgngDt),
        deadline: toIsoDate(it.rcptEndDt),
        url: it.url ?? "https://www.gojobs.go.kr/",
        collectedAt: now.toISOString(),
      };
    });
  },
};
