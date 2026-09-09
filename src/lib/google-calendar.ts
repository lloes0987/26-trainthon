import {
  addSlotDuration,
  generateTimeSlots,
  slotKey,
} from "@/lib/time-slots";

export interface BusyInterval {
  start: string;
  end: string;
}

const SEOUL_OFFSET = "+09:00";

function slotBounds(date: string, time: string): [number, number] {
  const start = new Date(`${date}T${time}:00${SEOUL_OFFSET}`).getTime();
  const end = new Date(
    `${date}T${addSlotDuration(time)}:00${SEOUL_OFFSET}`,
  ).getTime();
  return [start, end];
}

function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && endA > startB;
}

export function applyBusyIntervalsToSlots(
  dates: string[],
  timeStart: string,
  timeEnd: string,
  busy: BusyInterval[],
): Set<string> {
  const times = generateTimeSlots(timeStart, timeEnd);
  const intervals = busy
    .map((item) => ({
      start: new Date(item.start).getTime(),
      end: new Date(item.end).getTime(),
    }))
    .filter((item) => Number.isFinite(item.start) && Number.isFinite(item.end));

  const free = new Set<string>();

  for (const date of dates) {
    for (const time of times) {
      const [slotStart, slotEnd] = slotBounds(date, time);
      const blocked = intervals.some((item) =>
        rangesOverlap(slotStart, slotEnd, item.start, item.end),
      );
      if (!blocked) free.add(slotKey(date, time));
    }
  }

  return free;
}

export function parseFreeBusyResponse(payload: unknown): BusyInterval[] {
  if (!payload || typeof payload !== "object") return [];
  const calendars = (payload as { calendars?: Record<string, unknown> })
    .calendars;
  if (!calendars || typeof calendars !== "object") return [];

  const busy: BusyInterval[] = [];
  for (const calendar of Object.values(calendars)) {
    if (!calendar || typeof calendar !== "object") continue;
    const items = (calendar as { busy?: unknown }).busy;
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const start = (item as { start?: unknown }).start;
      const end = (item as { end?: unknown }).end;
      if (typeof start === "string" && typeof end === "string") {
        busy.push({ start, end });
      }
    }
  }
  return busy;
}
