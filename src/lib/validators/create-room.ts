import { parseTime } from "@/lib/time-slots";

const MIN_RANGE_MINUTES = 30;

export interface FieldErrors {
  title?: string;
  dates?: string;
  timeStart?: string;
  timeEnd?: string;
  timeRange?: string;
}

export function validateTimeRange(
  timeStart: string,
  timeEnd: string,
): string | null {
  if (!timeStart || !timeEnd) {
    return "시작·종료 시간을 선택해주세요.";
  }

  const start = parseTime(timeStart);
  const end = parseTime(timeEnd);

  if (end <= start) {
    return "종료 시간은 시작 시간보다 늦어야 합니다.";
  }

  if (end - start < MIN_RANGE_MINUTES) {
    return "시간 범위는 최소 30분 이상이어야 합니다.";
  }

  return null;
}

export function validateCreateRoom(input: {
  title: string;
  dates: string[];
  timeStart: string;
  timeEnd: string;
  dateOnly?: boolean;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.title.trim()) {
    errors.title = "약속 이름을 입력해주세요.";
  } else if (input.title.trim().length > 100) {
    errors.title = "약속 이름은 100자 이하로 입력해주세요.";
  }

  if (input.dates.length === 0) {
    errors.dates = "날짜를 하나 이상 선택해주세요.";
  }

  if (!input.dateOnly) {
    const rangeError = validateTimeRange(input.timeStart, input.timeEnd);
    if (rangeError) {
      errors.timeRange = rangeError;
    }
  }

  return errors;
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** 시작 시간보다 늦은 종료 시간 옵션 */
export function filterEndTimeOptions(
  options: string[],
  timeStart: string,
): string[] {
  const minEnd = parseTime(timeStart) + MIN_RANGE_MINUTES;
  return options.filter((t) => parseTime(t) >= minEnd);
}

/** 종료 시간보다 이른 시작 시간 옵션 */
export function filterStartTimeOptions(
  options: string[],
  timeEnd: string,
): string[] {
  const maxStart = parseTime(timeEnd) - MIN_RANGE_MINUTES;
  return options.filter((t) => parseTime(t) <= maxStart);
}

/** 시작 변경 시 유효한 종료 시간으로 보정 */
export function clampEndTime(
  timeStart: string,
  timeEnd: string,
  options: string[],
): string {
  const validEnds = filterEndTimeOptions(options, timeStart);
  if (validEnds.length === 0) return timeEnd;
  if (validEnds.includes(timeEnd)) return timeEnd;
  return validEnds[0];
}

/** 종료 변경 시 유효한 시작 시간으로 보정 */
export function clampStartTime(
  timeStart: string,
  timeEnd: string,
  options: string[],
): string {
  const validStarts = filterStartTimeOptions(options, timeEnd);
  if (validStarts.length === 0) return timeStart;
  if (validStarts.includes(timeStart)) return timeStart;
  return validStarts[validStarts.length - 1];
}
