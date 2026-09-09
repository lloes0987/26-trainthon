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
      <div className="flex items-center gap-1">
        <div className="flex min-w-[5.75rem] flex-1 justify-start">
          <BackButton />
        </div>
        <h1 className="shrink-0 text-center font-cute text-lg leading-tight">
          {title}
        </h1>
        <div className="flex min-w-[5.75rem] flex-1 items-center justify-end gap-1.5">
          {extra}
          <HomeNavLink />
        </div>
      </div>
      {children}
    </header>
  );
}
