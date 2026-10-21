import { cleaneye } from "./cleaneye";
import { incheon } from "./incheon";
import { jobalio } from "./jobalio";
import { narailter } from "./narailter";
import type { Collector } from "./types";

/**
 * 등록된 수집기 목록. 새 출처(시·도 일자리포털, 고용24 등)는
 * src/collectors/<이름>.ts 를 만들고 여기에 한 줄 추가한다.
 */
export const collectors: Collector[] = [jobalio, narailter, incheon, cleaneye];
