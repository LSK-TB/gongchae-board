# 공기업 고졸 공채 알림판

공기업·공공기관의 **전기·전자·통신·전산·IT·사무·시설관리 분야 고졸 공개채용** 공고를 여러 곳에서 모아 보여주는 사이트입니다.

- 첫 화면: 요약 숫자(접수 중·예정 / 7일 안 마감 / 올해 정리한 공고), 지원 전 확인 안내, CSV(엑셀) 내려받기, 기관명 검색, 분야·기관 버튼.
- **채용공고** 탭은 "접수 중·접수 예정"과 "최근 마감"(마감 후 14일 이내)으로 나뉩니다.
- 마감 후 14일이 지난 공고는 지우지 않고 **지난 공고 보관함** 탭(`data/archive.json`)으로 옮깁니다.
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
data/resources.json       공고 자료실(공고문·채용 안내 링크). 지금은 손으로 관리
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
  fields.ts               분야 판별(전기/전자/통신/전산·IT/사무/시설관리)
  education.ts            본문 텍스트로 학력 조건 판별(고졸/고졸이상/대졸이상 등). 학력무관 공고는 제외
  deadline.ts             D-day 계산 (한국 시간 기준)
  regions.ts              지역명 정규화
src/app/                  화면 (목록 /, 보관함 /archive, 상세 /jobs/[id], CSV /postings.csv)
src/components/HomeBoard  요약·탭·검색·분야/기관 칩·공고 카드
.github/workflows/        collect.yml 하루 2번 자동 수집, deploy.yml Pages 배포
```

## 배포 (GitHub Pages)

`.github/workflows/deploy.yml`이 main에 코드가 올라올 때와 공고 수집이 끝날 때마다 사이트를 빌드해 GitHub Pages에 올립니다.
주소는 `https://<계정>.github.io/<저장소 이름>/` 입니다.

처음 한 번은 직접 설정해야 합니다.

1. 저장소 Settings → Pages → Build and deployment → Source를 **GitHub Actions**로 바꿉니다.
2. 비공개 저장소는 GitHub 무료 플랜에서 Pages를 쓸 수 없습니다. 저장소를 공개로 바꾸거나 GitHub Pro 이상이 필요합니다.

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
