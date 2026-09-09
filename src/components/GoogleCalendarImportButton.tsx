"use client";

import { useEffect, useState } from "react";
import { importGoogleCalendar } from "@/lib/actions/google-calendar";

interface GoogleCalendarImportButtonProps {
  dates: string[];
  timeStart: string;
  timeEnd: string;
  onApply: (slots: Set<string>) => void;
  onMessage?: (message: string) => void;
}

export default function GoogleCalendarImportButton({
  dates,
  timeStart,
  timeEnd,
  onApply,
  onMessage,
}: GoogleCalendarImportButtonProps) {
  const [loading, setLoading] = useState(false);

  const notify = (text: string) => {
    onMessage?.(text);
  };

  const runImport = async () => {
    setLoading(true);
    notify("");

    const result = await importGoogleCalendar({
      dates,
      timeStart,
      timeEnd,
    });

    if ("code" in result && result.code === "auth") {
      const returnTo = `${window.location.pathname}${window.location.hash}`;
      window.location.href = `/api/google/oauth?returnTo=${encodeURIComponent(returnTo)}`;
      return;
    }

    setLoading(false);

    if ("error" in result) {
      notify(result.error);
      return;
    }

    onApply(new Set(result.slots));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("google_calendar");
    if (!flag) return;

    const next = new URL(window.location.href);
    next.searchParams.delete("google_calendar");
    window.history.replaceState({}, "", `${next.pathname}${next.search}${next.hash}`);

    if (flag === "missing") {
      notify("구글 캘린더 연동을 아직 설정하지 않았어요.");
      return;
    }
    if (flag === "denied") {
      notify("구글 로그인을 취소했어요.");
      return;
    }
    if (flag === "error") {
      notify("캘린더를 읽지 못했어요. 다시 시도해주세요.");
      return;
    }
    if (flag === "1") {
      void runImport();
    }
    // Apply once after returning from Google.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      onClick={() => void runImport()}
      disabled={loading}
      className="text-sm font-semibold leading-none text-brand disabled:opacity-60"
    >
      {loading ? "가져오는 중..." : "구글캘린더 가져오기"}
    </button>
  );
}
