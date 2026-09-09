"use server";

import {
  parseEverytimeHtml,
  parseEverytimeUrl,
  parseEverytimeXml,
  type ClassBlock,
} from "@/lib/everytime";

export type EverytimeImportError =
  | "invalid_url"
  | "unreadable"
  | "timeout";

export type EverytimeImportResult =
  | { blocks: ClassBlock[] }
  | { error: string; code: EverytimeImportError };

const FETCH_MS = 8000;

const ERROR_COPY: Record<EverytimeImportError, string> = {
  invalid_url: "공개 공유 링크를 붙여주세요",
  unreadable: "시간표 캡처를 올려주세요",
  timeout: "다시 시도하거나 캡처를 올려주세요",
};

function fail(code: EverytimeImportError): EverytimeImportResult {
  return { error: ERROR_COPY[code], code };
}

async function readWithTimeout(url: string, init?: RequestInit): Promise<string> {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(FETCH_MS),
    headers: {
      Accept: "text/html,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://everytime.kr/",
      Origin: "https://everytime.kr",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`status ${response.status}`);
  }
  return response.text();
}

function blocksFromPayload(payload: string): ClassBlock[] {
  const xmlBlocks = parseEverytimeXml(payload);
  if (xmlBlocks.length > 0) return xmlBlocks;
  return parseEverytimeHtml(payload);
}

export async function importEverytime(
  formData: FormData,
): Promise<EverytimeImportResult> {
  const raw = String(formData.get("url") ?? "");
  const identifier = parseEverytimeUrl(raw);
  if (!identifier) return fail("invalid_url");

  try {
    const xml = await readWithTimeout(
      "https://api.everytime.kr/find/timetable/table/friend",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: new URLSearchParams({
          identifier,
          friendInfo: "true",
        }).toString(),
      },
    );
    const fromApi = parseEverytimeXml(xml);
    if (fromApi.length > 0) return { blocks: fromApi };

    try {
      const page = await readWithTimeout(`https://everytime.kr/@${identifier}`);
      const fromPage = blocksFromPayload(page);
      if (fromPage.length > 0) return { blocks: fromPage };
    } catch {
      // The share page is a shell without class data.
    }
    return fail("unreadable");
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      return fail("timeout");
    }
    return fail("unreadable");
  }
}
