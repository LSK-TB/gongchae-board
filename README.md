# 공기업 고졸 공채 알림판

공기업·공공기관의 **전기·전자·통신·전산·IT 분야 고졸 공개채용** 공고를 여러 곳에서 모아 보여주는 사이트입니다.

- 공고 화면은 **진행중**과 **마감**(마감 후 14일 이내) 탭으로 나뉩니다.
- 마감 후 14일이 지난 공고는 지우지 않고 **보관함**(`data/archive.json`, `/archive` 페이지)으로 옮깁니다.
- 분야는 제목·직무(NCS)·본문 키워드로 판별하고(`src/lib/fields.ts`), 대상 분야가 아닌 공고는 수집 단계에서 버립니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:3000 에서 확인
npm run collect    # 공고 수집 → data/postings.json 갱신
npm run build      # 정적 사이트를 out/ 에 생성
npm test           # 학력 판별·마감일 계산 테스트
```

공고 수집에는 공공데이터포털 인증키가 필요합니다. `.env.example`을 참고해 `DATA_GO_KR_SERVICE_KEY`를 환경변수로 넣으세요.
키가 없으면 수집기를 건너뛰고 `data/postings.json`의 예시 데이터를 보여줍니다.

## 구조

```
data/postings.json        진행중 + 마감 14일 이내 공고
data/archive.json         마감 후 14일 지난 공고(보관함)
scripts/collect.ts        모든 수집기를 돌려 위 파일을 갱신
src/collectors/
  types.ts                Collector 인터페이스 (출처 하나 = 수집기 하나)
  registry.ts             사용할 수집기 목록
  jobalio.ts              잡알리오 (data.go.kr API)
  narailter.ts            나라일터 (data.go.kr API)
  incheon.ts              인천일자리포털 (크롤링, 구현 예정)
  cleaneye.ts             클린아이 지방공기업 (크롤링, 구현 예정)
  merge.ts                기존·신규 공고 합치기, 마감 14일 지난 공고를 보관함으로 이동
  http.ts                 재시도·타임아웃 fetch, 날짜 변환
src/lib/
  types.ts                JobPosting 공통 형식
  fields.ts               분야 판별(전기/전자/통신/전산·IT)
  education.ts            본문 텍스트로 학력 조건 판별(고졸/고졸이상/대졸이상 등). 학력무관 공고는 제외
  deadline.ts             D-day 계산 (한국 시간 기준)
  regions.ts              지역명 정규화
src/app/                  화면 (목록 /, 보관함 /archive, 상세 /jobs/[id])
src/components/JobBoard   진행중/마감 탭, 분야 칩, 검색·지역·기관유형·출처·"고졸 이상 포함" 필터
.github/workflows/        하루 2번 자동 수집
```

## 새 출처 붙이기

1. `src/collectors/<이름>.ts`에 `Collector`를 구현합니다. 결과는 `JobPosting[]` 형식으로 맞춥니다.
2. `src/lib/types.ts`의 `SourceId`, `src/lib/postings.ts`의 `SOURCE_LABELS`에 이름을 추가합니다.
3. `src/collectors/registry.ts`에 한 줄 추가합니다.

한 출처가 실패해도 그 출처의 기존 공고는 유지되므로, 일시 장애로 공고가 사라지지 않습니다.

## 남은 일

- 잡알리오·나라일터: 인증키 발급 후 실제 응답 필드명과 학력 코드값 맞추기 (`TODO` 표시)
- 인천일자리포털·클린아이: 목록/상세 HTML 파싱 구현. 해외 IP 차단 가능성이 있어 국내 서버나 PC에서 실행 필요할 수 있음
- 시·도 일자리포털, 고용24 수집기 추가
- 호스팅(GitHub Pages 또는 Cloudflare Pages)과 수집 후 자동 재배포 연결
