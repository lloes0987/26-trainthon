"use client";

import type { OverlapRange } from "@/lib/types";
import { formatKoreanDate } from "@/lib/time-slots";

interface OverlapResultsProps {
  overlaps: OverlapRange[];
  participantCount: number;
  completedCount: number;
}

export default function OverlapResults({
  overlaps,
  participantCount,
  completedCount,
}: OverlapResultsProps) {
  if (completedCount === 0) {
    return (
      <div className="card p-4 text-sm text-muted">
        아직 입력을 완료한 참여자가 없습니다.
      </div>
    );
  }

  const allMatch = overlaps.some((o) => o.count === participantCount);

  return (
    <div className="card p-4">
      <p className="mb-3 text-sm text-muted">
        현재 {completedCount}명이 입력했어요.
        {allMatch && (
          <span className="ml-1 font-medium text-brand-dark">
            모두 가능한 시간이 있습니다!
          </span>
        )}
      </p>

      <h3 className="mb-2 font-bold text-brand-dark">가장 많이 겹치는 시간</h3>

      {overlaps.length === 0 ? (
        <p className="text-sm text-muted">겹치는 시간이 없습니다.</p>
      ) : (
        <ol className="space-y-2">
          {overlaps.map((range, i) => (
            <li key={`${range.date}-${range.startTime}`} className="text-sm">
              <span className="font-medium text-brand">{i + 1}순위:</span>{" "}
              {formatKoreanDate(range.date)}{" "}
              {range.startTime.slice(0, 5)}~{range.endTime.slice(0, 5)}
              <span className="ml-2 text-muted">({range.count}명 가능)</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
