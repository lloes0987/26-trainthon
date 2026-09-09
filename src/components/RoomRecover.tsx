"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { importRoomSnapshot, importSharedRoom } from "@/lib/actions/room";
import { BRAND_NAME } from "@/lib/brand";
import { readRoomSnapshot } from "@/lib/room-snapshot";

export default function RoomRecover({
  code,
  expectLocation = false,
}: {
  code: string;
  expectLocation?: boolean;
}) {
  const router = useRouter();
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const snapshot = readRoomSnapshot(code);
    const encoded = new URLSearchParams(window.location.search).get("r") ?? "";
    const canUseSnapshot =
      snapshot && (!expectLocation || snapshot.room.enable_location);

    if (!canUseSnapshot && !encoded) {
      setMissing(true);
      return;
    }

    let cancelled = false;
    const restore = canUseSnapshot
      ? importRoomSnapshot(snapshot)
      : importSharedRoom(code, encoded);

    restore.then((result) => {
      if (cancelled) return;
      if ("error" in result) {
        setMissing(true);
        return;
      }
      router.refresh();
    });

    return () => {
      cancelled = true;
    };
  }, [code, expectLocation, router]);

  if (!missing) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <p className="text-sm text-muted">약속방을 불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="card p-6 text-center">
        <p className="text-2xl font-bold text-brand">{BRAND_NAME}</p>
        <h1 className="mt-4 text-2xl font-bold text-brand-dark">
          약속방을 찾을 수 없습니다
        </h1>
        <p className="mt-2 text-sm text-muted">
          링크가 올바른지 확인해주세요.
        </p>
        <a href="/" className="btn-primary mt-6 inline-block">
          홈으로 돌아가기
        </a>
      </div>
    </main>
  );
}
