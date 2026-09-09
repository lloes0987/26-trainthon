"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildShareMessage,
  copyToClipboard,
  resolveClientShareUrl,
  shareLink,
} from "@/lib/share-url";

interface ShareLinkBarProps {
  url: string;
  title: string;
  sharePath: string;
  variant?: "inline" | "prominent";
  intent?: "time" | "location";
  className?: string;
}

export default function ShareLinkBar({
  url,
  title,
  sharePath,
  variant = "inline",
  intent = "time",
  className = "",
}: ShareLinkBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [resolvedUrl, setResolvedUrl] = useState(url);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setResolvedUrl(resolveClientShareUrl(url, sharePath));
  }, [url, sharePath]);

  const showFeedback = useCallback((message: string) => {
    setFeedback(message);
    const timer = setTimeout(() => setFeedback(""), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(resolvedUrl);
    showFeedback(ok ? "링크가 복사됐어요!" : "복사에 실패했어요. 링크를 직접 선택해주세요.");
    if (!ok) inputRef.current?.select();
  };

  const handleCopyMessage = async () => {
    const message = buildShareMessage(title, resolvedUrl, intent);
    const ok = await copyToClipboard(message);
    showFeedback(ok ? "공유 문구가 복사됐어요!" : "복사에 실패했어요.");
  };

  const handleShare = async () => {
    const result = await shareLink({
      url: resolvedUrl,
      title,
      text: buildShareMessage(title, resolvedUrl, intent),
    });

    if (result === "shared") showFeedback("공유했어요!");
    else if (result === "copied") showFeedback("공유 문구가 복사됐어요!");
    else showFeedback("공유를 취소했어요.");
  };

  const selectUrl = () => {
    inputRef.current?.select();
    inputRef.current?.setSelectionRange(0, resolvedUrl.length);
  };

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className={className}>
      {variant === "prominent" && (
        <p className="mb-3 text-sm font-semibold text-brand-dark">
          친구에게 링크를 보내 시간을 맞춰보세요
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="flex min-w-0 flex-1 items-center rounded-xl border border-brand-light bg-brand-soft/50 px-3 py-2">
          <input
            ref={inputRef}
            readOnly
            value={resolvedUrl}
            onClick={selectUrl}
            onFocus={selectUrl}
            aria-label="약속방 공유 링크"
            className="min-w-0 flex-1 bg-transparent text-sm text-brand-dark outline-none"
          />
        </div>

        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={handleCopyLink} className="btn-secondary flex-1 sm:flex-none">
            링크 복사
          </button>
          {canNativeShare ? (
            <button type="button" onClick={handleShare} className="btn-primary flex-1 sm:flex-none">
              공유하기
            </button>
          ) : (
            <button type="button" onClick={handleCopyMessage} className="btn-primary flex-1 sm:flex-none">
              문구 복사
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <p className="mt-2 text-center text-xs font-medium text-brand" role="status">
          {feedback}
        </p>
      )}

      {variant === "prominent" && (
        <p className="mt-2 text-center text-xs text-muted">
          카카오톡 · 문자 · 슬랙 등 어디든 붙여넣기 하면 돼요
        </p>
      )}
    </div>
  );
}
