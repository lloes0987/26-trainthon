"use client";

import { formatKoreanDate, slotKey } from "@/lib/time-slots";
import { DATE_ONLY_SLOT } from "@/lib/types";

interface DatePollProps {
  dates: string[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  slotCounts?: Map<string, number>;
  maxCount?: number;
  readOnly?: boolean;
  mode?: "personal" | "group";
  onDateHover?: (date: string, count: number) => void;
}

const BRAND_RGB = "0, 56, 118";

function overlapFill(count: number, maxCount: number): string {
  if (count <= 0) return "transparent";
  const ratio = Math.min(1, count / Math.max(maxCount, 1));
  const alpha = 0.18 + ratio * 0.82;
  return `rgba(${BRAND_RGB}, ${alpha.toFixed(3)})`;
}

export default function DatePoll({
  dates,
  selected,
  onChange,
  slotCounts,
  maxCount = 1,
  readOnly = false,
  mode = "personal",
  onDateHover,
}: DatePollProps) {
  const toggle = (date: string) => {
    if (readOnly || mode === "group") return;
    const key = slotKey(date, DATE_ONLY_SLOT);
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };

  return (
    <ul className="overflow-hidden rounded-2xl border border-brand-light">
      {dates.map((date, index) => {
        const key = slotKey(date, DATE_ONLY_SLOT);
        const isSelected = selected.has(key);
        const count = slotCounts?.get(key) ?? 0;
        const groupFill = overlapFill(count, maxCount);
        const groupActive = mode === "group" && count > 0;

        return (
          <li
            key={date}
            className={index > 0 ? "border-t border-brand-light" : ""}
          >
            <button
              type="button"
              onClick={() => {
                if (mode === "group") {
                  onDateHover?.(date, count);
                  return;
                }
                toggle(date);
              }}
              className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors ${
                mode === "personal" && isSelected
                  ? "bg-brand text-white"
                  : mode === "group"
                    ? groupActive
                      ? "text-white"
                      : "bg-white text-brand-dark"
                    : "bg-white text-brand-dark"
              }`}
              style={
                mode === "group" && groupActive
                  ? { backgroundColor: groupFill }
                  : undefined
              }
            >
              <span className="text-sm font-semibold">
                {formatKoreanDate(date)}
              </span>
              {mode === "group" && (
                <span
                  className={`text-xs ${
                    groupActive ? "text-white/85" : "text-muted"
                  }`}
                >
                  {count}명
                </span>
              )}
              {mode === "personal" && (
                <span className="text-xs opacity-80">
                  {isSelected ? "가능" : "선택"}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
