import { test } from "node:test";
import assert from "node:assert/strict";
import { mapEducation, mapEmployment, mapFields, toPosting } from "./jobalio";
import { hideKey } from "./http";
import { mergePostings } from "./merge";
import { normalizeRegions } from "../lib/regions";

// 2026-10-21 실제 응답에서 본 값들
test("잡알리오 학력 값", () => {
  assert.equal(mapEducation("고졸"), "고졸");
  assert.equal(mapEducation("중졸이하,고졸"), "고졸");
  assert.equal(mapEducation("학력무관,고졸"), "고졸");
  assert.equal(mapEducation("고졸,대졸(2~3년),대졸(4년)"), "고졸이상");
  assert.equal(mapEducation("학력무관"), "학력무관");
  assert.equal(mapEducation("대졸(4년),석사,박사"), "대졸이상");
  assert.equal(mapEducation(""), "미확인");
});

test("잡알리오 고용형태", () => {
  assert.equal(mapEmployment("비정규직"), "계약직");
  assert.equal(mapEmployment("정규직"), "정규직");
  assert.equal(mapEmployment("청년인턴(채용형)"), "인턴");
  assert.equal(mapEmployment("무기계약직"), "무기계약직");
});

test("잡알리오 분야: 제목 우선, 없으면 NCS", () => {
  assert.deepEqual(mapFields({ recrutPbancTtl: "2026년 고졸 전기직 채용", ncsCdNmLst: "경영.회계.사무" }), ["전기"]);
  assert.deepEqual(mapFields({ recrutPbancTtl: "2026년 신입사원 채용", ncsCdNmLst: "전기.전자,정보통신" }), ["전기", "전자", "전산·IT", "통신"]);
  assert.deepEqual(mapFields({ recrutPbancTtl: "간호사 채용", ncsCdNmLst: "보건.의료" }), []);
});

test("지역: 전남광주는 둘로 나눈다", () => {
  assert.deepEqual(normalizeRegions("서울,전남광주,해외"), ["서울", "전남", "광주"]);
});

test("공고 변환", () => {
  const p = toPosting(
    {
      recrutPblntSn: 306230, instNm: "한국전력공사", recrutPbancTtl: " 2026 고졸 배전직 채용 ", pbancBgngYmd: "20261021",
      pbancEndYmd: "20261105", workRgnNmLst: "서울", hireTypeNmLst: "정규직", acbgCondNmLst: "고졸", ncsCdNmLst: "전기.전자", recrutNope: 3,
    },
    new Date("2026-10-21T00:00:00Z"),
  );
  assert.equal(p.id, "jobalio:306230");
  assert.equal(p.title, "2026 고졸 배전직 채용");
  assert.equal(p.deadline, "2026-11-05");
  assert.deepEqual(p.fields, ["전기"]);
  assert.equal(p.education, "고졸");
});

test("인증키는 오류 메시지에서 가린다", () => {
  assert.equal(hideKey("https://x/list?serviceKey=abc%2B1&pageNo=1"), "https://x/list?serviceKey=***&pageNo=1");
});

test("수집에서 빠진 공고: 마감이면 남기고, 마감 전이면 지운다", () => {
  const base = { source: "jobalio" as const, title: "", org: "", orgType: "공공기관" as const, regions: [], education: "고졸" as const,
    fields: ["전기" as const], employmentType: "정규직" as const, headcount: null, startDate: null, url: "", collectedAt: "" };
  const closed = { ...base, id: "jobalio:1", sourceId: "1", deadline: "2026-10-18" };
  const old = { ...base, id: "jobalio:2", sourceId: "2", deadline: "2026-09-01" };
  const withdrawn = { ...base, id: "jobalio:3", sourceId: "3", deadline: "2026-11-30" };
  const r = mergePostings([closed, old, withdrawn], [], [], new Set(["jobalio"]), { now: new Date("2026-10-21T03:00:00Z") });
  assert.deepEqual(r.postings.map((p) => p.sourceId), ["1"]);
  assert.deepEqual(r.archive.map((p) => p.sourceId), ["2"]);
});
