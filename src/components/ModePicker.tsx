import Link from "next/link";
import { HiChevronRight } from "react-icons/hi2";
import { MODES } from "@/lib/modes";

export default function ModePicker() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f4f6f8] px-5 pb-8 pt-5">
      <h1 className="text-[22px] font-bold tracking-tight text-brand-dark">
        어떻게 정할까요?
      </h1>
      <p className="mt-1 text-sm text-muted">원하는 방식을 골라 시작하세요</p>

      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,20,50,0.04)]">
        {MODES.map((mode, index) => (
          <Link
            key={mode.href}
            href={mode.href}
            className={`flex items-center gap-3 px-4 py-[18px] transition-colors active:bg-[#f4f6f8] ${
              index > 0 ? "border-t border-[#eef1f4]" : ""
            }`}
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${mode.accent}`}
            >
              <mode.icon className={`h-5 w-5 ${mode.iconClass}`} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[16px] font-semibold leading-5 text-brand-dark">
                {mode.title}
              </h2>
              <p className="mt-1 text-[13px] leading-5 text-muted">
                {mode.description}
              </p>
            </div>
            <HiChevronRight
              className="h-5 w-5 shrink-0 text-[#c5ccd4]"
              aria-hidden
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
