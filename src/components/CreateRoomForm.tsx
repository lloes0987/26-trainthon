"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import DatePickerCalendar from "@/components/DatePickerCalendar";
import { createRoom } from "@/lib/actions/room";
import { markSharePrompt } from "@/lib/share-url";
import { formatTime12h, generateTimeSlots } from "@/lib/time-slots";
import {
  clampEndTime,
  clampStartTime,
  filterEndTimeOptions,
  filterStartTimeOptions,
  hasFieldErrors,
  validateCreateRoom,
  validateTimeRange,
} from "@/lib/validators/create-room";

const TIME_OPTIONS = [...generateTimeSlots("00:00", "24:00"), "24:00"];

const inputOk = "input-field focus:border-brand focus:ring-brand/15";
const inputErr =
  "input-field border-coral focus:border-coral focus:ring-coral/15";

type CreateMode = "time" | "both";

const modeCopy = {
  time: {
    badge: "언제",
    title: "겹치는 시간 찾기",
    description: "날짜를 고르고, 볼 시간대만 정하면 방을 만들어요.",
  },
  both: {
    badge: "여기서언제",
    title: "시간 + 장소 한번에",
    description: "시간을 먼저 정하고, 중간 장소는 방에서 이어서 찾아요.",
  },
} as const;

interface CreateRoomFormProps {
  mode?: CreateMode;
}

export default function CreateRoomForm({ mode = "both" }: CreateRoomFormProps) {
  const router = useRouter();
  const now = new Date();
  const [title, setTitle] = useState("");
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [timeStart, setTimeStart] = useState("09:00");
  const [timeEnd, setTimeEnd] = useState("24:00");
  const enableLocation = mode === "both";
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [touched, setTouched] = useState({
    title: false,
    dates: false,
    timeStart: false,
    timeEnd: false,
  });

  const startOptions = useMemo(
    () => filterStartTimeOptions(TIME_OPTIONS, timeEnd),
    [timeEnd],
  );

  const endOptions = useMemo(
    () => filterEndTimeOptions(TIME_OPTIONS, timeStart),
    [timeStart],
  );

  const fieldErrors = useMemo(
    () =>
      validateCreateRoom({
        title,
        dates: Array.from(selectedDates),
        timeStart,
        timeEnd,
      }),
    [title, selectedDates, timeStart, timeEnd],
  );

  const timeRangeError = validateTimeRange(timeStart, timeEnd);
  const isFormValid = !hasFieldErrors(fieldErrors);

  const goToToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const handleStartChange = (value: string) => {
    setTimeStart(value);
    setTimeEnd((prev) => clampEndTime(value, prev, TIME_OPTIONS));
    setTouched((t) => ({ ...t, timeStart: true, timeEnd: true }));
    setSubmitError("");
  };

  const handleEndChange = (value: string) => {
    setTimeEnd(value);
    setTimeStart((prev) => clampStartTime(prev, value, TIME_OPTIONS));
    setTouched((t) => ({ ...t, timeStart: true, timeEnd: true }));
    setSubmitError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ title: true, dates: true, timeStart: true, timeEnd: true });

    const dates = Array.from(selectedDates).sort();
    const errors = validateCreateRoom({ title, dates, timeStart, timeEnd });
    if (hasFieldErrors(errors)) return;

    setLoading(true);
    setSubmitError("");

    const formData = new FormData();
    formData.set("title", title);
    dates.forEach((d) => formData.append("dates", d));
    formData.set("timeStart", timeStart);
    formData.set("timeEnd", timeEnd);
    if (enableLocation) formData.set("enableLocation", "on");

    const result = await createRoom(formData);

    if (result.error) {
      setSubmitError(result.error);
      setLoading(false);
      return;
    }

    markSharePrompt(result.shareCode!);
    router.push(`/room/${result.shareCode}`);
  };

  const showTimeError =
    touched.timeStart || touched.timeEnd ? timeRangeError : null;

  const copy = modeCopy[mode];

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-1 flex-col"
      noValidate
    >
      <header className="cute-hero relative shrink-0 bg-[#003876] px-5 py-2.5 text-center text-white">
        <p className="text-[11px] font-medium text-white/75">{copy.badge}</p>
        <h1 className="font-cute text-lg leading-tight">{copy.title}</h1>
      </header>

      <div className="cute-sheet -mt-2 flex-1 space-y-5 px-5 pb-8 pt-4">
        <p className="text-xs text-muted">{copy.description}</p>
        <input
          id="title"
          type="text"
          value={title}
          placeholder="약속 이름"
          onChange={(e) => {
            setTitle(e.target.value);
            setSubmitError("");
          }}
          onBlur={() => setTouched((t) => ({ ...t, title: true }))}
          className={`${touched.title && fieldErrors.title ? inputErr : inputOk} mt-0`}
        />
        {touched.title && fieldErrors.title && (
          <p className="-mt-3 text-xs text-coral">{fieldErrors.title}</p>
        )}

        <section>
          <h2 className="text-sm font-bold text-brand-dark">
            어떤 날짜가 가능한가요?
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">
            드래그해서 날짜를 고르세요
          </p>
          <div className="mt-3">
            <DatePickerCalendar
              selected={selectedDates}
              onChange={(dates) => {
                setSelectedDates(dates);
                setTouched((t) => ({ ...t, dates: true }));
                setSubmitError("");
              }}
              viewYear={viewYear}
              viewMonth={viewMonth}
            />
          </div>
          {touched.dates && fieldErrors.dates && (
            <p className="mt-2 text-xs text-coral">{fieldErrors.dates}</p>
          )}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={goToToday} className="btn-secondary">
              오늘
            </button>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 0) {
                  setViewYear(viewYear - 1);
                  setViewMonth(11);
                } else setViewMonth(viewMonth - 1);
              }}
              className="btn-secondary px-3"
              aria-label="이전 달"
            >
              <HiChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 11) {
                  setViewYear(viewYear + 1);
                  setViewMonth(0);
                } else setViewMonth(viewMonth + 1);
              }}
              className="btn-secondary px-3"
              aria-label="다음 달"
            >
              <HiChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-brand-dark">
            어떤 시간이 가능한가요?
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="timeStart" className="text-[11px] text-muted">
                이 시간부터
              </label>
              <select
                id="timeStart"
                value={timeStart}
                onChange={(e) => handleStartChange(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, timeStart: true }))}
                className={showTimeError ? inputErr : inputOk}
              >
                {startOptions.map((t) => (
                  <option key={t} value={t}>
                    {formatTime12h(t)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="timeEnd" className="text-[11px] text-muted">
                이 시간까지
              </label>
              <select
                id="timeEnd"
                value={timeEnd}
                onChange={(e) => handleEndChange(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, timeEnd: true }))}
                className={showTimeError ? inputErr : inputOk}
              >
                {endOptions.map((t) => (
                  <option key={t} value={t}>
                    {formatTime12h(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {showTimeError && (
            <p className="mt-2 text-xs text-coral">{showTimeError}</p>
          )}
          <p className="mt-2 text-[11px] text-muted">시간대 · 서울</p>
        </section>

        {submitError && <p className="text-xs text-coral">{submitError}</p>}

        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="btn-cta w-full"
        >
          {loading ? "만드는 중..." : "약속 만들기"}
        </button>
      </div>
    </form>
  );
}
