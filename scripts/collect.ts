/**
 * 모든 수집기를 돌려 data/postings.json(진행중·최근 마감)과 data/archive.json(보관함)을 갱신한다.
 *   npm run collect                 # 준비된 수집기 전부
 *   npm run collect -- jobalio      # 특정 수집기만
 * 하루 1~2번 GitHub Actions(또는 국내 서버 cron)로 돌린 뒤 사이트를 다시 빌드하는 구조다.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { collectors } from "../src/collectors/registry";
import { mergePostings } from "../src/collectors/merge";
import { isOpenToHighSchoolGrads } from "../src/lib/education";
import type { JobPosting, SourceId } from "../src/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const POSTINGS_FILE = path.join(DATA_DIR, "postings.json");
const ARCHIVE_FILE = path.join(DATA_DIR, "archive.json");

async function readJson(file: string): Promise<{ postings: JobPosting[] }> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return { postings: [] };
  }
}

/** 이 사이트의 대상: 전기·전자·통신·전산·IT·사무·시설관리 분야의 고졸 또는 고졸 이상 공고 (학력무관 제외) */
function isTarget(p: JobPosting): boolean {
  return p.fields.length > 0 && isOpenToHighSchoolGrads(p.education, true);
}

async function main() {
  const only = process.argv.slice(2);
  const now = new Date();
  const existing = await readJson(POSTINGS_FILE);
  const archive = await readJson(ARCHIVE_FILE);

  const fresh: JobPosting[] = [];
  const refreshed = new Set<SourceId>();
  for (const c of collectors) {
    if (only.length && !only.includes(c.id)) continue;
    if (!c.isReady()) {
      console.log(`- ${c.name}: 건너뜀 (인증키/설정 없음)`);
      continue;
    }
    try {
      const got = await c.collect({ now, log: (m) => console.log(`  ${m}`) });
      const kept = got.filter(isTarget);
      fresh.push(...kept);
      refreshed.add(c.id);
      console.log(`✓ ${c.name}: ${got.length}건 중 대상 분야 ${kept.length}건`);
    } catch (e) {
      console.error(`✗ ${c.name}: 실패, 기존 데이터 유지 —`, e instanceof Error ? e.message : e);
    }
  }

  // 실제 데이터가 하나라도 들어오면 예시 데이터는 지운다(보관함으로도 옮기지 않음)
  if (fresh.length) {
    existing.postings = existing.postings.filter((p) => p.source !== "sample");
    archive.postings = archive.postings.filter((p) => p.source !== "sample");
  }

  const merged = mergePostings(existing.postings, archive.postings, fresh, refreshed, { now });
  const updatedAt = now.toISOString();
  await writeFile(POSTINGS_FILE, JSON.stringify({ updatedAt, postings: merged.postings }, null, 2) + "\n");
  await writeFile(ARCHIVE_FILE, JSON.stringify({ updatedAt, postings: merged.archive }, null, 2) + "\n");
  console.log(`저장: 진행중·최근 마감 ${merged.postings.length}건, 보관함 ${merged.archive.length}건`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
