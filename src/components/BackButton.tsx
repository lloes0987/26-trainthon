"use client";

import { useRouter } from "next/navigation";
import { HiChevronLeft } from "react-icons/hi2";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="이전 페이지"
      className="-ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-white active:bg-white/15"
    >
      <HiChevronLeft className="h-6 w-6" aria-hidden />
    </button>
  );
}
