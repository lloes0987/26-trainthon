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
      <div className="flex min-h-7 items-center justify-between gap-1.5">
        <div className="flex shrink-0">
          <BackButton />
        </div>
        <div className="flex shrink-0 items-center justify-end gap-1.5">
          {extra}
          <HomeNavLink />
        </div>
      </div>
      {badge && (
        <p className="mt-1 text-center text-[11px] font-medium leading-none text-white/75">
          {badge}
        </p>
      )}
      <h1 className="mt-1 truncate text-center font-cute text-lg leading-tight">
        {title}
      </h1>
      {children}
    </header>
  );
}
