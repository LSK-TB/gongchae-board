import { HomeBoard } from "@/components/HomeBoard";
import { getAllPostings, getArchivedPostings, getResources, getUpdatedAt } from "@/lib/postings";

export const metadata = { title: "지난 공고 보관함 | 고졸 공채 알림판" };

/** 예전 /archive/ 주소도 그대로 열리도록 보관함 탭을 연 상태로 보여준다 */
export default function ArchivePage() {
  return (
    <HomeBoard postings={getAllPostings()} archive={getArchivedPostings()} resources={getResources()} updatedAt={getUpdatedAt()} initialTab="archive" />
  );
}
