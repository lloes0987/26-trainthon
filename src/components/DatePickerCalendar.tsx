"use client";

import { useCallback, useRef } from "react";

interface DatePickerCalendarProps {
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  viewYear: number;
  viewMonth: number;
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_NAMES = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function DatePickerCalendar({
  selected,
  onChange,
  viewYear,
  viewMonth,
}: DatePickerCalendarProps) {
  const isDragging = useRef(false);
  const dragMode = useRef<"select" | "deselect">("select");

  const applyDay = useCallback(
    (key: string) => {
      const next = new Set(selected);
      if (dragMode.current === "select") next.add(key);
      else next.delete(key);
      onChange(next);
    },
    [selected, onChange],
  );

  const startDrag = (key: string) => {
    isDragging.current = true;
    dragMode.current = selected.has(key) ? "deselect" : "select";
    applyDay(key);
  };

  const continueDrag = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const el = document.elementFromPoint(clientX, clientY);
    const key = el?.closest("[data-day]")?.getAttribute("data-day");
    if (key) applyDay(key);
  };

  const stopDrag = () => {
    isDragging.current = false;
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div
      className="w-full select-none touch-none"
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      onPointerLeave={stopDrag}
      onPointerMove={(event) => {
        if (event.buttons === 0 && event.pointerType === "mouse") return;
        continueDrag(event.clientX, event.clientY);
      }}
    >
      <p className="mb-2 text-center text-sm font-semibold text-brand-dark">
        {viewYear}년 {MONTH_NAMES[viewMonth]}
      </p>
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            {DAY_LABELS.map((label) => (
              <th
                key={label}
                className="pb-1 text-center text-[11px] font-semibold text-muted"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: cells.length / 7 }, (_, row) => (
            <tr key={row}>
              {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                if (day === null) {
                  return (
                    <td key={col} className="p-0.5">
                      <div className="aspect-square w-full" />
                    </td>
                  );
                }
                const key = dateKey(viewYear, viewMonth, day);
                const isSelected = selected.has(key);
                return (
                  <td key={col} className="p-0.5">
                    <button
                      type="button"
                      data-day={key}
                      className={`flex aspect-square w-full items-center justify-center rounded-lg text-sm ${
                        isSelected
                          ? "bg-brand font-bold text-white"
                          : "bg-brand-soft/70 text-foreground/80"
                      }`}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        startDrag(key);
                      }}
                    >
                      {day}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { MONTH_NAMES };
