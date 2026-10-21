import { classifyEducation } from "../lib/education";
import { classifyFields } from "../lib/fields";
import type { JobPosting } from "../lib/types";
import { fetchText, toIsoDate } from "./http";
import type { Collector } from "./types";

/**
 * 나라일터 (인사혁신처 공공채용정보) — data.go.kr 15156780
 * 중앙부처·지자체의 공무직/기간제 채용 게시판이다.
 *
 * 2026-10-21 실제 응답으로 확인한 것:
 * - type=json을 줘도 XML로 온다
 * - 항목: idx, title, insttname(기관), regdate(등록일), enddate(마감일), areacode, type01, type02, readnum, moddate
 * - 오래된 글부터 정렬되어 있어서(전체 약 29만 건) 마지막 쪽부터 거꾸로 읽는다
 * - 학력 필드가 없어 제목으로만 학력을 판별한다
 */
const BASE = "https://apis.data.go.kr/1760000/PblJobService/getList";
const ROWS = 100;
const MAX_PAGES = 3; // 최신 300건이면 마감 2주 이내 공고는 대부분 덮는다
// 나라일터 서버가 느려서(한 쪽에 수십 초) 넉넉하게 기다린다
const SLOW = { timeoutMs: 60_000, retries: 1 };

export interface NaraItem {
  idx: string;
  title: string;
  insttname: string;
  regdate?: string;
  enddate?: string;
  areacode?: string;
  type01?: string;
  type02?: string;
}

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").trim();

/** 나라일터 XML 응답에서 totalCount와 item 목록을 꺼낸다 */
export function parseNaraXml(xml: string): { resultCode: string; totalCount: number; items: NaraItem[] } {
  const tag = (src: string, name: string) => {
    const m = src.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
    return m ? decode(m[1]) : undefined;
  };
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, body]) => ({
    idx: tag(body, "idx") ?? "",
    title: tag(body, "title") ?? "",
    insttname: tag(body, "insttname") ?? "",
    regdate: tag(body, "regdate"),
    enddate: tag(body, "enddate"),
    areacode: tag(body, "areacode"),
    type01: tag(body, "type01"),
    type02: tag(body, "type02"),
  }));
  return {
    resultCode: tag(xml, "resultCode") ?? tag(xml, "returnReasonCode") ?? "",
    totalCount: Number(tag(xml, "totalCount") ?? 0),
    items,
  };
}

export function toNaraPosting(it: NaraItem, now: Date): JobPosting {
  return {
    id: `narailter:${it.idx}`,
    source: "narailter",
    sourceId: it.idx,
    title: it.title,
    org: it.insttname,
    orgType: "중앙정부",
    regions: [],
    education: classifyEducation(it.title),
    fields: classifyFields(it.title),
    employmentType: /기간제|계약/.test(it.title) ? "계약직" : /공무직/.test(it.title) ? "무기계약직" : "기타",
    headcount: null,
    startDate: toIsoDate(it.regdate),
    deadline: toIsoDate(it.enddate),
    // TODO: 상세 페이지 주소 형식 확인 필요. 확인 전까지는 나라일터 채용공고 목록으로 보낸다
    url: "https://www.gojobs.go.kr/apmList.do",
    collectedAt: now.toISOString(),
  };
}

async function getPage(key: string, page: number, rows = ROWS) {
  const xml = await fetchText(`${BASE}?serviceKey=${encodeURIComponent(key)}&numOfRows=${rows}&pageNo=${page}`, SLOW);
  const r = parseNaraXml(xml);
  if (r.resultCode !== "00") throw new Error(`나라일터 오류 코드 ${r.resultCode}`);
  return r;
}

export const narailter: Collector = {
  id: "narailter",
  name: "나라일터",
  kind: "api",
  // 최신 글이 있는 마지막 쪽 응답이 1분 넘게 걸려 지금은 꺼 둔다.
  // 최신순 정렬이나 날짜 검색 옵션을 찾으면 켠다 (ENABLE_NARAILTER=1)
  isReady: () => Boolean(process.env.DATA_GO_KR_SERVICE_KEY) && process.env.ENABLE_NARAILTER === "1",
  async collect({ now, log }) {
    const key = process.env.DATA_GO_KR_SERVICE_KEY!;
    // 전체 건수만 알려고 1건짜리로 먼저 부른다
    const { totalCount } = await getPage(key, 1, 1);
    const last = Math.max(1, Math.ceil(totalCount / ROWS));
    const out: JobPosting[] = [];
    for (let page = last; page > Math.max(0, last - MAX_PAGES); page--) {
      const t0 = Date.now();
      const r = await getPage(key, page);
      out.push(...r.items.map((it) => toNaraPosting(it, now)));
      log(`나라일터 ${page}쪽: ${r.items.length}건 (${Math.round((Date.now() - t0) / 1000)}초)`);
    }
    log(`나라일터 최신 ${out.length}건 (전체 ${totalCount}건)`);
    return out;
  },
};
