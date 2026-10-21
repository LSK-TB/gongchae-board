/**
 * 공공데이터포털 API 응답 구조 점검용.
 *   DATA_GO_KR_SERVICE_KEY=... npm run probe
 * 각 API를 한두 건만 호출해서 HTTP 상태, 응답 구조(키 목록), 첫 항목을 출력한다.
 * 인증키는 출력하지 않는다(응답 안에 섞여 있어도 가린다).
 */
const KEY = process.env.DATA_GO_KR_SERVICE_KEY ?? "";

const targets: { name: string; url: string }[] = [
  { name: "잡알리오", url: "https://apis.data.go.kr/1051000/recruitment/list?resultType=json&numOfRows=2&pageNo=1" },
  { name: "잡알리오(진행중)", url: "https://apis.data.go.kr/1051000/recruitment/list?resultType=json&numOfRows=2&pageNo=1&ongoingYn=Y" },
  { name: "나라일터(type=json)", url: "https://apis.data.go.kr/1760000/PblJobService/getList?type=json&numOfRows=2&pageNo=1" },
  { name: "나라일터(resultType=json)", url: "https://apis.data.go.kr/1760000/PblJobService/getList?resultType=json&numOfRows=2&pageNo=1" },
  { name: "나라일터(기본)", url: "https://apis.data.go.kr/1760000/PblJobService/getList?numOfRows=2&pageNo=1" },
];

const redact = (s: string) => (KEY ? s.split(KEY).join("***").split(encodeURIComponent(KEY)).join("***") : s);

function shape(v: unknown, depth = 0): unknown {
  if (depth > 4) return "…";
  if (Array.isArray(v)) return v.length ? [shape(v[0], depth + 1), `(${v.length}개)`] : [];
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x, depth + 1)]));
  return typeof v;
}

async function main() {
  if (!KEY) {
    console.log("DATA_GO_KR_SERVICE_KEY가 비어 있습니다.");
    process.exit(1);
  }
  for (const t of targets) {
    console.log(`\n===== ${t.name} =====`);
    try {
      const res = await fetch(`${t.url}&serviceKey=${encodeURIComponent(KEY)}`, { signal: AbortSignal.timeout(20_000) });
      const text = redact(await res.text());
      console.log(`HTTP ${res.status} · ${res.headers.get("content-type")}`);
      try {
        const json = JSON.parse(text);
        console.log("구조:", JSON.stringify(shape(json), null, 1).slice(0, 3000));
        console.log("원문 앞부분:", JSON.stringify(json).slice(0, 4000));
      } catch {
        console.log("JSON 아님. 원문 앞부분:", text.slice(0, 2000));
      }
    } catch (e) {
      console.log("요청 실패:", e instanceof Error ? e.message : e);
    }
  }
}

main();
