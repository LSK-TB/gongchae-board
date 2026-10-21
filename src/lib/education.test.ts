import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyEducation, isOpenToHighSchoolGrads } from "./education";
import { deadlineLabel } from "./deadline";
import { normalizeRegion } from "./regions";

test("학력 판별", () => {
  assert.equal(classifyEducation("2026년 고졸 제한경쟁 채용"), "고졸");
  assert.equal(classifyEducation("특성화고 졸업예정자 채용형 인턴"), "고졸");
  assert.equal(classifyEducation("응시자격: 학력 무관"), "학력무관");
  assert.equal(classifyEducation("고등학교 졸업 이상"), "고졸이상");
  assert.equal(classifyEducation("4년제 대학교 졸업 이상"), "대졸이상");
  assert.equal(classifyEducation("신규직원 채용"), "미확인");
});

test("고졸 지원 가능 여부", () => {
  assert.equal(isOpenToHighSchoolGrads("고졸", false), true);
  assert.equal(isOpenToHighSchoolGrads("학력무관", true), false); // 학력무관은 항상 제외
  assert.equal(isOpenToHighSchoolGrads("고졸이상", true), true);
  assert.equal(isOpenToHighSchoolGrads("고졸이상", false), false);
  assert.equal(isOpenToHighSchoolGrads("대졸이상", true), false);
});

test("마감일 표시", () => {
  assert.deepEqual(deadlineLabel("2026-10-21", "2026-10-21"), { text: "오늘 마감", tone: "urgent" });
  assert.deepEqual(deadlineLabel("2026-10-24", "2026-10-21"), { text: "D-3", tone: "urgent" });
  assert.deepEqual(deadlineLabel("2026-10-20", "2026-10-21"), { text: "마감", tone: "closed" });
  assert.deepEqual(deadlineLabel(null), { text: "상시", tone: "always" });
});

test("지역 정규화", () => {
  assert.equal(normalizeRegion("인천광역시 남동구"), "인천");
  assert.equal(normalizeRegion("강원특별자치도"), "강원");
});

import { classifyFields } from "./fields";
import { mergePostings } from "../collectors/merge";
import type { JobPosting } from "./types";

test("분야 판별", () => {
  assert.deepEqual(classifyFields("고졸 신입사원(배전·송변전)"), ["전기"]);
  assert.deepEqual(classifyFields("전기·전자·통신 분야"), ["전기", "전자", "통신"]);
  assert.deepEqual(classifyFields("IT 인턴 채용"), ["전산·IT"]);
  assert.deepEqual(classifyFields("6급 전산직"), ["전산·IT"]);
  assert.deepEqual(classifyFields("사무행정 채용"), ["사무"]);
  assert.deepEqual(classifyFields("청사 시설관리 직원"), ["시설관리"]);
  assert.deepEqual(classifyFields("조경 인부 채용"), []);
  assert.deepEqual(classifyFields("SPLIT 공사"), []); // 영단어 속 IT는 무시
});

const mk = (id: string, deadline: string | null): JobPosting => ({
  id: `jobalio:${id}`, source: "jobalio", sourceId: id, title: id, org: "", orgType: "공기업", regions: [],
  education: "고졸", fields: ["전기"], employmentType: "정규직", headcount: null, startDate: null, deadline,
  url: "", collectedAt: "",
});

test("마감 14일 지나면 보관함으로", () => {
  const now = new Date("2026-10-21T03:00:00Z");
  const r = mergePostings([], [], [mk("a", "2026-10-30"), mk("b", "2026-10-07"), mk("c", "2026-10-06"), mk("d", null)], new Set(["jobalio"]), { now });
  assert.deepEqual(r.postings.map((p) => p.sourceId), ["b", "a", "d"]);
  assert.deepEqual(r.archive.map((p) => p.sourceId), ["c"]);
});
