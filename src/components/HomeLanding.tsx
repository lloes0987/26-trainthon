import Image from "next/image";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import CuteSparkles from "@/components/CuteSparkles";
import { BRAND_SUBTITLE } from "@/lib/brand";

export default function HomeLanding() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <section className="cute-hero relative flex min-h-full flex-1 flex-col items-center bg-[#003876] px-5 pb-8 pt-10 text-center text-white">
        <CuteSparkles />

        <p className="relative font-cute text-sm tracking-wide text-white/90">
          {BRAND_SUBTITLE}
        </p>
        <h1 className="relative mt-2">
          <BrandLogo
            size="lg"
            className="justify-center font-cute text-[2.6rem] leading-none"
          />
        </h1>

        <div className="relative mt-4 flex flex-1 items-center justify-center">
          <span className="glass-pill absolute left-0 top-8 animate-float">
            여기서
          </span>
          <span className="glass-pill absolute right-0 top-16 animate-float-delayed">
            언제
          </span>
          <Image
            src="/yonsei-mascot-phone.png"
            alt=""
            width={726}
            height={858}
            unoptimized
            className="absolute -left-2 top-2 h-24 w-auto animate-float"
          />
          <Image
            src="/yonsei-mascot.png"
            alt="연세 마스코트"
            width={601}
            height={664}
            priority
            unoptimized
            className="relative z-10 mx-auto h-56 w-auto animate-bob"
          />
          <Image
            src="/yonsei-mascot-teach.png"
            alt=""
            width={817}
            height={902}
            unoptimized
            className="absolute -right-1 bottom-6 h-28 w-auto animate-float-delayed"
          />
        </div>

        <Link
          href="/start"
          className="relative mt-auto inline-flex min-h-13 w-full max-w-sm items-center justify-center rounded-2xl bg-white text-lg font-bold text-[#003876] shadow-lg"
        >
          시작하기
        </Link>
      </section>
    </div>
  );
}
