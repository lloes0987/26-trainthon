"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { HiDocumentDuplicate } from "react-icons/hi2";
import {
  buildShareMessage,
  copyToClipboard,
  resolveClientShareUrl,
  shareLink,
} from "@/lib/share-url";

interface SharePromptModalProps {
  url: string;
  title: string;
  sharePath: string;
  intent?: "time" | "location";
  onClose: () => void;
}

export default function SharePromptModal({
  url,
  title,
  sharePath,
  intent = "time",
  onClose,
}: SharePromptModalProps) {
  const [resolvedUrl, setResolvedUrl] = useState(url);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setResolvedUrl(resolveClientShareUrl(url, sharePath));
  }, [url, sharePath]);

  const flash = useCallback((message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2200);
  }, []);

  const handleCopy = async () => {
    const ok = await copyToClipboard(resolvedUrl);
    flash(ok ? "링크가 복사됐어요!" : "복사를 다시 시도해주세요.");
  };

  const handleShareNow = async () => {
    const result = await shareLink({
      url: resolvedUrl,
      title,
      text: buildShareMessage(title, resolvedUrl, intent),
    });
    if (result === "shared") {
      onClose();
      return;
    }
    if (result === "copied") {
      flash("공유 문구가 복사됐어요!");
      return;
    }
    flash("공유를 취소했어요.");
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-prompt-title"
    >
      <div className="relative flex h-full w-full max-w-[430px] flex-col justify-end">
        <button
          type="button"
          className="absolute inset-0"
          aria-label="닫기"
          onClick={onClose}
        />
        <div className="relative rounded-t-[1.75rem] bg-white px-5 pb-7 pt-12 shadow-[0_-12px_40px_rgba(0,56,118,0.16)]">
          <Image
            src="/yonsei-mascot.png"
            alt=""
            width={120}
            height={140}
            unoptimized
            className="pointer-events-none absolute -top-16 left-1/2 h-20 w-auto -translate-x-1/2"
          />
          <h2
            id="share-prompt-title"
            className="text-center font-cute text-xl text-brand-dark"
          >
            약속의 링크가 생성되었어요
          </h2>
          <p className="mt-1 text-center text-sm text-muted">
            {intent === "location"
              ? "공유하고 친구의 출발지를 알아보세요"
              : "공유하고 친구의 일정을 알아보세요"}
          </p>

          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-brand-light bg-brand-soft/60 px-3 py-2.5">
            <p className="min-w-0 flex-1 truncate text-sm text-brand-dark">
              {resolvedUrl}
            </p>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand"
              aria-label="링크 복사"
            >
              <HiDocumentDuplicate className="h-5 w-5" aria-hidden />
            </button>
          </div>

          {feedback && (
            <p className="mt-2 text-center text-xs font-medium text-brand" role="status">
              {feedback}
            </p>
          )}

          <button
            type="button"
            onClick={handleShareNow}
            className="btn-cta mt-5 w-full"
          >
            지금 공유할게요
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full py-2 text-sm text-muted"
          >
            나중에 할게요
          </button>
        </div>
      </div>
    </div>
  );
}
