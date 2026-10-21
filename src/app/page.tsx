import { JobBoard } from "@/components/JobBoard";
import { getAllPostings, getUpdatedAt } from "@/lib/postings";

export default function HomePage() {
  const postings = getAllPostings();
  const isSample = postings.some((p) => p.source === "sample");
  return (
    <>
      {isSample && (
        <p className="notice">지금 보이는 공고는 화면 확인용 예시입니다. 수집기를 연결하면 실제 공고로 바뀝니다.</p>
      )}
      <JobBoard postings={postings} updatedAt={getUpdatedAt()} />
    </>
  );
}
