import Link from "next/link";
import { HiHome } from "react-icons/hi2";
import BrandLogo from "@/components/BrandLogo";

export default function TopNav() {
  return (
    <nav className="sticky top-0 z-50 shrink-0 bg-[#003876]">
      <div className="flex items-center justify-between px-4 py-1.5">
        <Link href="/" className="flex min-h-8 items-center">
          <BrandLogo size="sm" />
        </Link>
        <Link
          href="/"
          aria-label="홈으로"
          className="inline-flex min-h-7 items-center gap-1 rounded-full bg-white px-2.5 text-xs font-semibold text-[#003876] shadow-sm"
        >
          <HiHome className="h-3.5 w-3.5" aria-hidden />
          처음으로
        </Link>
      </div>
    </nav>
  );
}
