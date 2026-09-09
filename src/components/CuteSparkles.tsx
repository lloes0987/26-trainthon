import {
  HiCalendarDays,
  HiClock,
  HiOutlineMegaphone,
  HiOutlineRocketLaunch,
  HiSparkles,
} from "react-icons/hi2";

export default function CuteSparkles({
  variant = "home",
}: {
  variant?: "home" | "page";
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <HiSparkles className="absolute top-6 left-6 h-5 w-5 text-white/70" />
      <HiSparkles className="absolute top-16 right-10 h-4 w-4 text-white/50" />
      <HiSparkles className="absolute top-28 left-1/4 h-3.5 w-3.5 text-white/40" />
      <HiOutlineRocketLaunch className="absolute top-8 right-6 h-6 w-6 text-white/80" />
      {variant === "home" ? (
        <>
          <HiOutlineMegaphone className="absolute top-24 right-8 h-8 w-8 text-white/25" />
          <HiClock className="absolute top-36 left-5 h-8 w-8 text-white/20" />
          <HiCalendarDays className="absolute right-4 bottom-28 h-8 w-8 text-white/20" />
        </>
      ) : (
        <>
          <HiOutlineMegaphone className="absolute top-3 left-6 h-4 w-4 text-white/20" />
          <HiClock className="absolute top-3 right-14 h-4 w-4 text-white/20" />
        </>
      )}
    </div>
  );
}
