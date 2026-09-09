"use client";

import type { Participant, ParticipantStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

interface ParticipantStatusListProps {
  participants: Participant[];
}

function statusColor(status: ParticipantStatus): string {
  switch (status) {
    case "completed":
      return "text-brand-dark";
    case "in_progress":
      return "text-coral";
    default:
      return "text-muted";
  }
}

export default function ParticipantStatusList({
  participants,
}: ParticipantStatusListProps) {
  if (participants.length === 0) {
    return (
      <div className="card bg-brand-soft/40 p-4">
        <p className="text-sm text-muted">아직 참여자가 없습니다.</p>
      </div>
    );
  }

  const completed = participants.filter((p) => p.status === "completed");
  const inProgress = participants.filter((p) => p.status === "in_progress");
  const notStarted = participants.filter((p) => p.status === "not_started");

  return (
    <div className="card bg-brand-soft/40 p-4">
      <h3 className="mb-3 text-sm font-bold text-brand-dark">현재 입력 현황</h3>
      <p className="mb-3 text-sm text-muted">
        현재 {participants.length}명이 참여 중
      </p>

      <div className="space-y-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="font-medium">{p.display_id}</span>
            <span className={statusColor(p.status)}>
              {STATUS_LABELS[p.status]}
            </span>
          </div>
        ))}
      </div>

      {(completed.length > 0 || inProgress.length > 0) && (
        <div className="mt-3 border-t border-brand-light pt-3 text-xs text-muted">
          {completed.length > 0 && (
            <p>입력 완료: {completed.map((p) => p.display_id).join(", ")}</p>
          )}
          {inProgress.length > 0 && (
            <p>입력 중: {inProgress.map((p) => p.display_id).join(", ")}</p>
          )}
          {notStarted.length > 0 && (
            <p>입력 전: {notStarted.map((p) => p.display_id).join(", ")}</p>
          )}
        </div>
      )}
    </div>
  );
}
