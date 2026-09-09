"use client";

import { useCallback, useRef, useState } from "react";
import {
  formatDateHeader,
  formatTime12h,
  generateTimeSlots,
  isHourSlot,
  slotKey,
} from "@/lib/time-slots";

interface TimeGridProps {
  dates: string[];
  timeStart: string;
  timeEnd: string;
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  slotCounts?: Map<string, number>;
  maxCount?: number;
  readOnly?: boolean;
  mode?: "personal" | "group";
  onSlotHover?: (date: string, time: string, count: number) => void;
}

const BRAND_RGB = "0, 56, 118";

function overlapFill(count: number, maxCount: number): string {
  if (count <= 0) return "transparent";
  const ratio = Math.min(1, count / Math.max(maxCount, 1));
  const alpha = 0.18 + ratio * 0.82;
  return `rgba(${BRAND_RGB}, ${alpha.toFixed(3)})`;
}

export default function TimeGrid({
  dates,
  timeStart,
  timeEnd,
  selected,
  onChange,
  slotCounts,
  maxCount = 1,
  readOnly = false,
  mode = "personal",
  onSlotHover,
}: TimeGridProps) {
  const times = generateTimeSlots(timeStart, timeEnd);
  const isDragging = useRef(false);
  const dragMode = useRef<"select" | "deselect">("select");
  const [dragging, setDragging] = useState(false);

  const getCellClass = useCallback(
    (date: string, time: string) => {
      const key = slotKey(date, time);
      const isSelected = selected.has(key);
      const count = slotCounts?.get(key) ?? 0;

      if (mode === "group") {
        return "bg-white";
      }

      return isSelected ? "bg-brand" : "bg-brand-soft";
    },
    [selected, slotCounts, maxCount, mode],
  );

  const applySlot = useCallback(
    (date: string, time: string) => {
      if (readOnly || mode === "group") return;
      const key = slotKey(date, time);
      const next = new Set(selected);
      if (dragMode.current === "select") next.add(key);
      else next.delete(key);
      onChange(next);
    },
    [selected, onChange, readOnly, mode],
  );

  const startDrag = (date: string, time: string) => {
    if (readOnly || mode === "group") return;
    isDragging.current = true;
    setDragging(true);
    dragMode.current = selected.has(slotKey(date, time))
      ? "deselect"
      : "select";
    applySlot(date, time);
  };

  const continueDrag = (clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const cell = el?.closest("[data-slot]")?.getAttribute("data-slot");
    if (!cell) return;
    const [date, time] = cell.split("|");
    if (mode === "group" && onSlotHover) {
      onSlotHover(date, time, slotCounts?.get(slotKey(date, time)) ?? 0);
    }
    if (!isDragging.current || readOnly || mode === "group") return;
    applySlot(date, time);
  };

  const stopDrag = () => {
    isDragging.current = false;
    setDragging(false);
  };

  return (
    <div
      className={`overflow-x-auto ${dragging ? "select-none" : ""}`}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      onPointerLeave={stopDrag}
      onPointerMove={(event) => {
        if (!isDragging.current && mode !== "group") return;
        if (event.buttons === 0 && event.pointerType === "mouse" && !isDragging.current) {
          return;
        }
        continueDrag(event.clientX, event.clientY);
      }}
    >
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-14 bg-white p-1.5" />
            {dates.map((date) => (
              <th
                key={date}
                className="min-w-14 border-b border-brand-light px-1 py-2 text-center text-[11px] font-semibold text-brand-dark"
              >
                {formatDateHeader(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {times.map((time) => (
            <tr key={time}>
              <td
                className={`sticky left-0 z-10 bg-white px-1.5 text-right text-[10px] text-muted ${
                  isHourSlot(time) ? "border-t border-brand-light pt-0.5" : ""
                }`}
              >
                {isHourSlot(time) ? formatTime12h(time) : ""}
              </td>
              {dates.map((date) => {
                const count = slotCounts?.get(slotKey(date, time)) ?? 0;
                return (
                <td key={date} className="p-px">
                  <button
                    type="button"
                    data-slot={slotKey(date, time)}
                    style={
                      mode === "group"
                        ? { backgroundColor: overlapFill(count, maxCount) }
                        : undefined
                    }
                    className={`h-4 w-full min-w-10 touch-none border border-white/80 ${getCellClass(date, time)} ${
                      mode === "group" ? "cursor-default" : "cursor-pointer"
                    }`}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      startDrag(date, time);
                    }}
                    aria-label={`${formatDateHeader(date)} ${formatTime12h(time)}${
                      mode === "group" && count > 0 ? ` · ${count}명` : ""
                    }`}
                  />
                </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted">
        {mode === "personal" ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-4 rounded-sm bg-brand-soft" />
              불가능
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-4 rounded-sm bg-brand" />
              가능
            </span>
            <span>드래그해서 시간을 표시하세요</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-4 rounded-sm bg-white ring-1 ring-brand-light" />
              0명
            </span>
            <div className="flex h-3 overflow-hidden rounded-sm ring-1 ring-brand-light">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className="w-4"
                  style={{
                    backgroundColor: overlapFill(step, 4),
                  }}
                />
              ))}
            </div>
            <span>{maxCount}명</span>
          </>
        )}
      </div>
    </div>
  );
}
