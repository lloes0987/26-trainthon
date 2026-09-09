import type { OverlapRange, TimeSlotKey } from "./types";

const SLOT_MINUTES = 30;

export function parseTime(time: string): number {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function generateTimeSlots(start: string, end: string): string[] {
  const startMin = parseTime(start);
  const endMin = parseTime(end);
  const slots: string[] = [];

  for (let t = startMin; t < endMin; t += SLOT_MINUTES) {
    slots.push(formatTime(t));
  }

  return slots;
}

export function slotKey(date: string, time: string): string {
  return `${date}|${time}`;
}

export function parseSlotKey(key: string): TimeSlotKey {
  const [date, time] = key.split("|");
  return { date, time };
}

export function addSlotDuration(time: string): string {
  return formatTime(parseTime(time) + SLOT_MINUTES);
}

export function formatKoreanDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dow = days[date.getDay()];
  return `${month}월 ${day}일 ${dow}요일`;
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}/${date.getDate()} ${days[date.getDay()]}`;
}

export function formatTime12h(time: string): string {
  const minutes = parseTime(time);
  if (minutes === 24 * 60) return "12:00 AM";
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return m === 0
    ? `${h12}:00 ${period}`
    : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function isHourSlot(time: string): boolean {
  return time.endsWith(":00");
}

export function calculateOverlaps(
  dates: string[],
  times: string[],
  availabilityByParticipant: Map<string, Set<string>>,
  participantCount: number,
): OverlapRange[] {
  const slotCounts = new Map<string, number>();

  for (const slots of availabilityByParticipant.values()) {
    for (const key of slots) {
      slotCounts.set(key, (slotCounts.get(key) ?? 0) + 1);
    }
  }

  const ranges: OverlapRange[] = [];

  for (const date of dates) {
    let rangeStart: string | null = null;
    let rangeCount = 0;

    for (let i = 0; i < times.length; i++) {
      const time = times[i];
      const key = slotKey(date, time);
      const count = slotCounts.get(key) ?? 0;

      if (count > 0) {
        if (rangeStart === null) {
          rangeStart = time;
          rangeCount = count;
        } else {
          rangeCount = Math.max(rangeCount, count);
        }
      } else if (rangeStart !== null) {
        ranges.push({
          date,
          startTime: rangeStart,
          endTime: addSlotDuration(times[i - 1]),
          count: rangeCount,
          rank: 0,
        });
        rangeStart = null;
        rangeCount = 0;
      }
    }

    if (rangeStart !== null) {
      ranges.push({
        date,
        startTime: rangeStart,
        endTime: addSlotDuration(times[times.length - 1]),
        count: rangeCount,
        rank: 0,
      });
    }
  }

  ranges.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  let currentRank = 0;
  let lastCount = -1;
  for (const range of ranges) {
    if (range.count !== lastCount) {
      currentRank++;
      lastCount = range.count;
    }
    range.rank = currentRank;
  }

  const allAvailable = ranges.filter((r) => r.count === participantCount);
  if (allAvailable.length > 0) {
    return allAvailable.map((r, i) => ({ ...r, rank: i + 1 }));
  }

  return ranges.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));
}

export function getSlotCounts(
  availabilityByParticipant: Map<string, Set<string>>,
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const slots of availabilityByParticipant.values()) {
    for (const key of slots) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return counts;
}
