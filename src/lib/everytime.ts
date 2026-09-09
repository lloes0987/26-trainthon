import {
  addSlotDuration,
  generateTimeSlots,
  parseTime,
  slotKey,
} from "@/lib/time-slots";

export interface ClassBlock {
  weekday: number;
  start: string;
  end: string;
}

const SHARE_URL =
  /(?:https?:\/\/)?(?:www\.)?everytime\.kr\/@([A-Za-z0-9_-]+)/i;

const KOREAN_DAY: Record<string, number> = {
  일: 0,
  월: 1,
  화: 2,
  수: 3,
  목: 4,
  금: 5,
  토: 6,
};

const IMAGE_GRID_START_MIN = 9 * 60;
const IMAGE_GRID_SPAN_MIN = 12 * 60;

const HTML_HOUR_PX = 60;
const HTML_DAY_START_MIN = 9 * 60;

export function parseEverytimeUrl(input: string): string | null {
  const match = input.trim().match(SHARE_URL);
  return match?.[1] ?? null;
}

function attr(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match?.[1] ?? null;
}

function parseKoreanTimeValues(xml: string): ClassBlock[] {
  const blocks: ClassBlock[] = [];
  const valueRe = /<time\b[^>]*\bvalue="([^"]+)"/gi;
  for (const match of xml.matchAll(valueRe)) {
    const chunks = match[1].split(",");
    for (const chunk of chunks) {
      const parsed = chunk.match(
        /([월화수목금토일])[^/]*\/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/,
      );
      if (!parsed) continue;
      const weekday = KOREAN_DAY[parsed[1]];
      if (weekday === undefined) continue;
      blocks.push({ weekday, start: parsed[2], end: parsed[3] });
    }
  }
  return blocks;
}

function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function everytimeDayToJsWeekday(day: number): number {
  return (day + 1) % 7;
}

export function parseEverytimeXml(xml: string): ClassBlock[] {
  if (/<response>\s*-1\s*<\/response>/.test(xml)) return [];

  const blocks: ClassBlock[] = [];
  const tags = xml.match(/<data\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const day = attr(tag, "day");
    const start = attr(tag, "starttime");
    const end = attr(tag, "endtime");
    if (day === null || start === null || end === null) continue;
    blocks.push({
      weekday: everytimeDayToJsWeekday(Number(day)),
      start: minutesToTime(Number(start) * 5),
      end: minutesToTime(Number(end) * 5),
    });
  }
  if (blocks.length > 0) return blocks;
  return parseKoreanTimeValues(xml);
}

function readStylePx(style: string, prop: string): number | null {
  const match = style.match(new RegExp(`${prop}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)px`));
  return match ? Number(match[1]) : null;
}

export function parseEverytimeHtml(html: string): ClassBlock[] {
  const blocks: ClassBlock[] = [];
  const colRe = /<div([^>]*class="[^"]*\bcols\b[^"]*"[^>]*)>([\s\S]*?)<\/div>/gi;
  let weekday = 1;
  let foundCols = false;

  for (const col of html.matchAll(colRe)) {
    foundCols = true;
    const inner = col[2];
    const subjectRe =
      /<div[^>]*class="[^"]*\bsubject\b[^"]*"[^>]*style="([^"]*)"/gi;
    for (const subject of inner.matchAll(subjectRe)) {
      const top = readStylePx(subject[1], "top");
      const height = readStylePx(subject[1], "height");
      if (top === null || height === null || height <= 0) continue;
      blocks.push({
        weekday,
        start: minutesToTime(
          HTML_DAY_START_MIN + (top / HTML_HOUR_PX) * 60,
        ),
        end: minutesToTime(
          HTML_DAY_START_MIN + ((top + height) / HTML_HOUR_PX) * 60,
        ),
      });
    }
    weekday = weekday === 6 ? 0 : weekday + 1;
  }

  if (!foundCols) {
    const subjectRe =
      /<div[^>]*class="[^"]*\bsubject\b[^"]*"[^>]*style="([^"]*)"/gi;
    for (const subject of html.matchAll(subjectRe)) {
      const top = readStylePx(subject[1], "top");
      const height = readStylePx(subject[1], "height");
      if (top === null || height === null || height <= 0) continue;
      blocks.push({
        weekday: 1,
        start: minutesToTime(
          HTML_DAY_START_MIN + (top / HTML_HOUR_PX) * 60,
        ),
        end: minutesToTime(
          HTML_DAY_START_MIN + ((top + height) / HTML_HOUR_PX) * 60,
        ),
      });
    }
  }

  return blocks;
}

function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && endA > startB;
}

export function applyTimetableToSlots(
  dates: string[],
  timeStart: string,
  timeEnd: string,
  blocks: ClassBlock[],
): Set<string> {
  const times = generateTimeSlots(timeStart, timeEnd);
  const free = new Set<string>();

  for (const date of dates) {
    const weekday = new Date(`${date}T00:00:00`).getDay();
    const dayBlocks = blocks.filter((block) => block.weekday === weekday);

    for (const time of times) {
      const slotStart = parseTime(time);
      const slotEnd = parseTime(addSlotDuration(time));
      const busy = dayBlocks.some((block) =>
        rangesOverlap(
          slotStart,
          slotEnd,
          parseTime(block.start),
          parseTime(block.end),
        ),
      );
      if (!busy) free.add(slotKey(date, time));
    }
  }

  return free;
}

function pixel(data: Uint8ClampedArray, width: number, x: number, y: number) {
  const i = (y * width + x) * 4;
  return { r: data[i], g: data[i + 1], b: data[i + 2] };
}

function isClassColor(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const light = (r + g + b) / 3;
  return sat >= 0.12 && max - min >= 20 && light > 30 && light < 240;
}

function isLightPixel(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const light = (r + g + b) / 3;
  return light > 232 || (sat < 0.08 && light > 200);
}

function rowIsMostlyLight(
  data: Uint8ClampedArray,
  width: number,
  y: number,
): boolean {
  let light = 0;
  for (let x = 0; x < width; x += 4) {
    const { r, g, b } = pixel(data, width, x, y);
    if (isLightPixel(r, g, b)) light += 1;
  }
  return light / Math.ceil(width / 4) > 0.72;
}

function findGridRange(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): { top: number; bottom: number } {
  let top = 0;
  while (top < height - 8 && !rowIsMostlyLight(data, width, top)) top += 1;
  let bottom = height - 1;
  while (bottom > top && !rowIsMostlyLight(data, width, bottom)) bottom -= 1;
  return { top, bottom: bottom + 1 };
}

function snapMinutes(minutes: number): number {
  return Math.round(minutes / 30) * 30;
}

export function extractClassBlocksFromImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): ClassBlock[] {
  if (width < 80 || height < 80) return [];

  const { top, bottom } = findGridRange(data, width, height);
  const gridHeight = bottom - top;
  if (gridHeight < 40) return [];

  const gutter = Math.round(width * 0.12);
  const columns = 5;
  const colWidth = (width - gutter) / columns;
  const blocks: ClassBlock[] = [];

  const isClassPixel = (x: number, y: number) => {
    const { r, g, b } = pixel(data, width, x, y);
    return isClassColor(r, g, b);
  };

  const yToMinutes = (y: number) =>
    IMAGE_GRID_START_MIN +
    ((y - top) / gridHeight) * IMAGE_GRID_SPAN_MIN;

  for (let col = 0; col < columns; col += 1) {
    const weekday = col + 1;
    const x0 = gutter + Math.round(col * colWidth + colWidth * 0.2);
    const x1 = gutter + Math.round(col * colWidth + colWidth * 0.8);
    let runStart: number | null = null;

    for (let y = top; y < bottom; y += 1) {
      let hits = 0;
      let samples = 0;
      for (let x = x0; x < x1; x += 2) {
        samples += 1;
        if (isClassPixel(x, y)) hits += 1;
      }
      const busy = samples > 0 && hits / samples >= 0.28;
      if (busy && runStart === null) runStart = y;
      if (!busy && runStart !== null) {
        const start = snapMinutes(yToMinutes(runStart));
        const end = snapMinutes(yToMinutes(y));
        if (end - start >= 25) {
          blocks.push({
            weekday,
            start: minutesToTime(start),
            end: minutesToTime(end),
          });
        }
        runStart = null;
      }
    }
    if (runStart !== null) {
      const start = snapMinutes(yToMinutes(runStart));
      const end = snapMinutes(yToMinutes(bottom));
      if (end - start >= 25) {
        blocks.push({
          weekday,
          start: minutesToTime(start),
          end: minutesToTime(end),
        });
      }
    }
  }

  return blocks;
}
