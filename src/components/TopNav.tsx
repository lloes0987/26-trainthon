import type { ReactNode } from "react";
import Link from "next/link";
import { HiHome } from "react-icons/hi2";
import BackButton from "@/components/BackButton";
import BrandLogo from "@/components/BrandLogo";

const navChip =
  "inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-full bg-white/15 px-2.5 text-xs font-semibold leading-none text-white";

export function DirectInputNavLink() {
  return (
    <Link href="/here?mode=self" className={navChip}>
      직접 입력
    </Link>
  );
}

export function HomeNavLink() {
  return (
    <Link
      href="/"
      aria-label="홈으로"
      className="inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-white px-2.5 text-xs font-semibold leading-none text-[#003876] shadow-sm"
    >
      <HiHome className="h-3.5 w-3.5" aria-hidden />
      처음으로
    </Link>
  );
}

export default function TopNav({ extra }: { extra?: ReactNode }) {
  return (
    <nav className="sticky top-0 z-50 shrink-0 bg-[#003876]">
      <div className="flex items-center justify-between px-4 py-1.5">
        <div className="flex min-w-0 items-center gap-0.5">
          <BackButton />
          <Link href="/" className="flex min-h-8 items-center">
            <BrandLogo size="sm" />
          </Link>
        </div>
        <div className="flex items-center gap-1.5">
          {extra}
          <HomeNavLink />
        </div>
      </div>
    </nav>
  );
}
