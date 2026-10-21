import { JobBoard } from "@/components/JobBoard";
import { getArchivedPostings, getUpdatedAt } from "@/lib/postings";

export const metadata = { title: "보관함 | 공기업 고졸 공채 알림판" };

export default function ArchivePage() {
  return (
    <>
      <h1 className="page-title">보관함</h1>
      <p className="meta">마감 후 14일이 지난 공고를 모아 둡니다. 지난 채용 시기·인원을 참고할 때 쓰세요.</p>
      <JobBoard postings={getArchivedPostings()} updatedAt={getUpdatedAt()} variant="archive" />
    </>
  );
}
