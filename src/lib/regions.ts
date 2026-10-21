export const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
] as const;

const ALIASES: Record<string, string> = {
  서울특별시: "서울", 부산광역시: "부산", 대구광역시: "대구", 인천광역시: "인천",
  광주광역시: "광주", 대전광역시: "대전", 울산광역시: "울산", 세종특별자치시: "세종",
  경기도: "경기", 강원도: "강원", 강원특별자치도: "강원", 충청북도: "충북", 충청남도: "충남",
  전라북도: "전북", 전북특별자치도: "전북", 전라남도: "전남", 경상북도: "경북", 경상남도: "경남",
  제주특별자치도: "제주", 제주도: "제주",
};

/** 잡알리오는 "전남광주"처럼 두 지역을 붙여 쓰기도 한다 */
export function normalizeRegions(raw: string): string[] {
  const out = new Set<string>();
  for (const part of raw.split(/[,/]/).map((s) => s.trim()).filter(Boolean)) {
    if (part === "전남광주") {
      out.add("전남");
      out.add("광주");
      continue;
    }
    const r = normalizeRegion(part);
    if (r) out.add(r);
  }
  return [...out];
}

/** "인천광역시 남동구", "경기도" 같은 표기를 "인천", "경기"로 맞춘다 */
export function normalizeRegion(raw: string): string | null {
  const t = raw.trim();
  for (const [full, short] of Object.entries(ALIASES)) if (t.startsWith(full)) return short;
  for (const r of REGIONS) if (t.startsWith(r)) return r;
  if (/전국|무관/.test(t)) return "전국";
  return null;
}
