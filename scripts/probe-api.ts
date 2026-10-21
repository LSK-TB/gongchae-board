/**
 * 공공데이터포털 API 응답 점검용.
 *   DATA_GO_KR_SERVICE_KEY=... npm run probe
 * - 나라일터: 인증키가 등록됐는지 한 건만 호출해 본다
 * - 잡알리오: 진행 중 공고 전체를 받아 학력·직무·고용형태 값의 분포와,
 *   이 사이트 기준(분야·학력)으로 몇 건이 남는지 출력한다
 * 인증키는 출력하지 않는다.
 */
import { jobalio } from "../src/collectors/jobalio";
import { isOpenToHighSchoolGrads } from "../src/lib/education";

const KEY = process.env.DATA_GO_KR_SERVICE_KEY ?? "";
const redact = (s: string) => (KEY ? s.split(KEY).join("***").split(encodeURIComponent(KEY)).join("***") : s);

async function rawAlio(page: number) {
  const url = `https://apis.data.go.kr/1051000/recruitment/list?resultType=json&numOfRows=100&pageNo=${page}&ongoingYn=Y&serviceKey=${encodeURIComponent(KEY)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  return (await res.json()) as { totalCount: number; result?: Record<string, unknown>[] };
}

function count(values: string[]) {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

async function main() {
  if (!KEY) throw new Error("DATA_GO_KR_SERVICE_KEY가 비어 있습니다.");

  console.log("===== 나라일터 API 명세 (공공데이터포털 페이지) =====");
  try {
    const html = await (await fetch("https://www.data.go.kr/data/15156780/openapi.do", { signal: AbortSignal.timeout(30_000) })).text();
    const i = html.indexOf("swaggerJson");
    console.log("swaggerJson 위치:", i);
    if (i >= 0) console.log(html.slice(i, i + 6000));
    else console.log([...html.matchAll(/요청변수[\s\S]{0,3000}/g)].map((m) => m[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).join("\n").slice(0, 4000));
  } catch (e) {
    console.log("명세 페이지 실패:", e instanceof Error ? e.message : e);
  }

  console.log("\n===== 나라일터 1쪽 (최근 글 정렬 여부) =====");
  for (const extra of ["", "&sort=desc", "&srchBgnDe=20261001"]) {
    const t0 = Date.now();
    try {
      const r = await fetch(
        `https://apis.data.go.kr/1760000/PblJobService/getList?numOfRows=3&pageNo=1${extra}&serviceKey=${encodeURIComponent(KEY)}`,
        { signal: AbortSignal.timeout(60_000) },
      );
      console.log(`[${extra || "기본"}] HTTP ${r.status} ${Math.round((Date.now() - t0) / 1000)}초`, redact(await r.text()).slice(0, 1200));
    } catch (e) {
      console.log(`[${extra || "기본"}] 실패`, e instanceof Error ? e.message : e);
    }
  }

  console.log("\n===== 잡알리오 진행 중 공고 분포 =====");
  const items: Record<string, unknown>[] = [];
  for (let page = 1; page <= 10; page++) {
    const r = await rawAlio(page);
    items.push(...(r.result ?? []));
    if (page === 1) console.log("진행 중 전체:", r.totalCount);
    if ((r.result ?? []).length < 100) break;
  }
  console.log("받은 건수:", items.length);
  const split = (k: string) => items.flatMap((it) => String(it[k] ?? "").split(",").map((s) => s.trim()).filter(Boolean));
  for (const k of ["acbgCondNmLst", "acbgCondLst", "ncsCdNmLst", "hireTypeNmLst", "recrutSeNm", "workRgnNmLst"]) {
    console.log(`\n[${k}]`, JSON.stringify(count(split(k))));
  }
  console.log("\n[학력 조합]", JSON.stringify(count(items.map((it) => String(it.acbgCondNmLst ?? "")))));
  console.log("\n[files 예시]", JSON.stringify(items.find((it) => Array.isArray(it.files) && (it.files as unknown[]).length)?.files ?? null).slice(0, 800));

  console.log("\n===== 수집기로 변환한 결과 =====");
  const mapped = await jobalio.collect({ now: new Date(), log: () => {} });
  const target = mapped.filter((p) => p.fields.length > 0 && isOpenToHighSchoolGrads(p.education, true));
  console.log(`변환 ${mapped.length}건, 대상 ${target.length}건`);
  console.log("[education 분포]", JSON.stringify(count(mapped.map((p) => p.education))));
  for (const p of target.slice(0, 40)) {
    console.log(`- ${p.education} | ${p.fields.join("/")} | ${p.org} | ${p.title} | ${p.startDate}~${p.deadline}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? redact(e.message) : e);
  process.exit(1);
});
