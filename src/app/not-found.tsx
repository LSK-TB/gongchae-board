import Link from "next/link";
export default function NotFound() {
  return (
    <section>
      <h1>공고를 찾을 수 없어요</h1>
      <p>마감되어 내려간 공고일 수 있어요. <Link href="/">목록으로 돌아가기</Link></p>
    </section>
  );
}
