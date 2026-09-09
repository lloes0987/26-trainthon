import type { ReactNode } from "react";
import BackButton from "@/components/BackButton";
import { HomeNavLink } from "@/components/TopNav";

interface PageHeroProps {
  badge?: string;
  title: string;
  extra?: ReactNode;
  children?: ReactNode;
}

export default function PageHero({
  badge,
  title,
  extra,
  children,
}: PageHeroProps) {
  return (
    <header className="cute-hero sticky top-0 z-50 shrink-0 bg-[#003876] px-3 pb-2.5 pt-2 text-white">
      {badge && (
        <p className="mb-0.5 text-center text-[11px] font-medium leading-none text-white/75">
          {badge}
        </p>
      )}
      <div className="relative flex min-h-7 items-center justify-between gap-1.5">
        <div className="relative z-10 flex shrink-0">
          <BackButton />
        </div>
        <h1 className="pointer-events-none absolute inset-x-0 truncate px-16 text-center font-cute text-lg leading-tight">
          {title}
        </h1>
        <div className="relative z-10 flex shrink-0 items-center justify-end gap-1.5">
          {extra}
          <HomeNavLink />
        </div>
      </div>
      {children}
    </header>
  );
}
