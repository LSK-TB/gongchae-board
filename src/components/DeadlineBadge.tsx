"use client";

import { useEffect, useState } from "react";
import { deadlineLabel, todayKST } from "@/lib/deadline";

/** 마감 D-day 배지. today를 안 주면 방문한 날 기준으로 계산한다 */
export function DeadlineBadge({ deadline, today }: { deadline: string | null; today?: string }) {
  const [clientToday, setClientToday] = useState<string | undefined>(today);
  useEffect(() => {
    if (!today) setClientToday(todayKST());
  }, [today]);
  const { text, tone } = deadlineLabel(deadline, today ?? clientToday);
  return <span className={`badge deadline-${tone}`}>{text}</span>;
}
