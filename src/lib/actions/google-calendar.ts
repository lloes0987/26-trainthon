"use server";

import { cookies } from "next/headers";
import {
  applyBusyIntervalsToSlots,
  parseFreeBusyResponse,
} from "@/lib/google-calendar";
import { GOOGLE_TOKEN_COOKIE, getGoogleOAuthConfig } from "@/lib/google-oauth";

export type GoogleCalendarImportResult =
  | { slots: string[] }
  | { error: string; code: "missing" | "auth" | "fetch" };

export async function importGoogleCalendar(input: {
  dates: string[];
  timeStart: string;
  timeEnd: string;
}): Promise<GoogleCalendarImportResult> {
  if (!getGoogleOAuthConfig()) {
    return {
      error: "구글 캘린더 연동을 아직 설정하지 않았어요.",
      code: "missing",
    };
  }

  if (input.dates.length === 0) {
    return { error: "가져올 날짜가 없어요.", code: "fetch" };
  }

  const token = (await cookies()).get(GOOGLE_TOKEN_COOKIE)?.value;
  if (!token) {
    return { error: "auth", code: "auth" };
  }

  const dates = [...input.dates].sort();
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/freeBusy",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin: `${dates[0]}T00:00:00+09:00`,
        timeMax: `${dates[dates.length - 1]}T23:59:59+09:00`,
        timeZone: "Asia/Seoul",
        items: [{ id: "primary" }],
      }),
    },
  );

  if (response.status === 401) {
    return { error: "auth", code: "auth" };
  }
  if (!response.ok) {
    return {
      error: "캘린더를 읽지 못했어요. 다시 시도해주세요.",
      code: "fetch",
    };
  }

  const busy = parseFreeBusyResponse(await response.json());
  return {
    slots: [
      ...applyBusyIntervalsToSlots(
        input.dates,
        input.timeStart,
        input.timeEnd,
        busy,
      ),
    ],
  };
}
