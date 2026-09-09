"use client";

import { useState, type FormEvent } from "react";
import { importEverytime } from "@/lib/actions/everytime";
import {
  applyTimetableToSlots,
  extractClassBlocksFromImageData,
  type ClassBlock,
} from "@/lib/everytime";

const IMAGE_ERROR = "다시 올리거나 칸을 직접 골라주세요";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
function isTimetableImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (!file.type) return /\.(png|jpe?g|webp|heic|heif)$/i.test(file.name);
  return false;
}

interface EverytimeImportSheetProps {
  dates: string[];
  timeStart: string;
  timeEnd: string;
  onApply: (slots: Set<string>) => void;
}

export default function EverytimeImportSheet({
  dates,
  timeStart,
  timeEnd,
  onApply,
}: EverytimeImportSheetProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [showCapture, setShowCapture] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const applyBlocks = (blocks: ClassBlock[]) => {
    if (blocks.length === 0) {
      setMessage(IMAGE_ERROR);
      setShowCapture(true);
      return false;
    }
    onApply(applyTimetableToSlots(dates, timeStart, timeEnd, blocks));
    setOpen(false);
    setUrl("");
    setShowCapture(false);
    setMessage("");
    return true;
  };

  const handleUrl = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData();
    formData.set("url", url);
    const result = await importEverytime(formData);
    setLoading(false);

    if ("blocks" in result) {
      applyBlocks(result.blocks);
      return;
    }
    setMessage(result.error);
    if (result.code === "invalid_url") {
      setShowCapture(false);
      return;
    }
    setShowCapture(true);
  };

  const handleImage = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES || !isTimetableImage(file)) {
      setMessage(IMAGE_ERROR);
      setShowCapture(true);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const blocks = await readBlocksFromImage(file);
      applyBlocks(blocks);
    } catch {
      setMessage(IMAGE_ERROR);
      setShowCapture(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setShowCapture(false);
          setMessage("");
        }}
        className="text-sm font-semibold leading-none text-[#f26522]"
      >
        에브리타임
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="everytime-import-title"
        >
          <div className="relative flex h-full w-full max-w-[430px] flex-col justify-end">
            <button
              type="button"
              className="absolute inset-0"
              aria-label="닫기"
              onClick={() => setOpen(false)}
            />
            <div className="relative rounded-t-[1.75rem] bg-white px-5 pb-7 pt-5 shadow-[0_-12px_40px_rgba(0,56,118,0.16)]">
              <h2
                id="everytime-import-title"
                className="text-base font-bold text-brand-dark"
              >
                에브리타임 가져오기
              </h2>
              <p className="mt-1 text-[11px] text-muted">
                에브리타임 시간표에서 URL 공유로 공개한 링크만 됩니다. 안 되면
                시간표 화면을 PNG/JPG로 올려 주세요.
              </p>

              <form onSubmit={handleUrl} className="mt-4 space-y-3">
                <label
                  htmlFor="everytimeUrl"
                  className="text-[11px] text-muted"
                >
                  공개 공유 링크
                </label>
                <input
                  id="everytimeUrl"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://everytime.kr/@..."
                  className="input-field mt-1"
                />
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="btn-cta w-full text-base"
                >
                  {loading ? "가져오는 중..." : "링크로 가져오기"}
                </button>
              </form>

              <div className="mt-4 space-y-2">
                {message && <p className="text-xs text-coral">{message}</p>}
                <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-brand-light bg-brand-soft text-sm font-semibold text-brand-dark">
                  {showCapture ? "시간표 캡처 올리기" : "또는 시간표 캡처 올리기"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    className="sr-only"
                    onChange={(event) => handleImage(event.target.files?.[0])}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function readBlocksFromImage(file: File): Promise<ClassBlock[]> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("canvas"));
          return;
        }
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        resolve(
          extractClassBlocksFromImageData(
            pixels.data,
            pixels.width,
            pixels.height,
          ),
        );
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("image"));
    };
    image.src = objectUrl;
  });
}
