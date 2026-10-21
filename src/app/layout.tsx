import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "고졸 공채 알림판",
  description: "공기업·공공기관의 전기·전자·통신·전산·IT·사무·시설관리 분야 고졸 공개채용 공고를 한곳에 모아 마감일 순으로 보여줍니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <main className="container">{children}</main>
        <footer className="site-footer container">
          공고 출처: 잡알리오 · 나라일터 · 인천일자리포털 · 클린아이. 지원 전 반드시 원문 공고를 확인하세요.
        </footer>
      </body>
    </html>
  );
}
