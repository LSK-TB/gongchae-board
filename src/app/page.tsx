import { HomeBoard } from "@/components/HomeBoard";
import { getAllPostings, getArchivedPostings, getResources, getUpdatedAt } from "@/lib/postings";

export default function HomePage() {
  const postings = getAllPostings();
  const isSample = postings.some((p) => p.source === "sample");
  return (
    <>
      {isSample && <p className="sample-note">지금 보이는 공고는 화면 확인용 예시입니다. 수집기를 연결하면 실제 공고로 바뀝니다.</p>}
      <HomeBoard postings={postings} archive={getArchivedPostings()} resources={getResources()} updatedAt={getUpdatedAt()} />
    </>
  );
}
