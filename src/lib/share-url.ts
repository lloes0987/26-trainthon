export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

export function buildRoomShareUrl(shareCode: string, baseUrl?: string): string {
  const base = (baseUrl ?? getAppBaseUrl()).replace(/\/$/, "");
  return `${base}/room/${shareCode}`;
}

export function buildShareMessage(
  title: string,
  url: string,
  intent: "time" | "location" = "time",
): string {
  if (intent === "location") {
    return `「${title}」 출발지를 입력해 주세요\n${url}`;
  }
  return `「${title}」 약속 시간 맞춰요\n${url}`;
}

/** 서버가 localhost URL을 줬을 때, 실제 접속 origin으로 교정 */
export function resolveClientShareUrl(serverUrl: string, path: string): string {
  if (typeof window === "undefined") return serverUrl;

  try {
    const serverOrigin = new URL(serverUrl).origin;
    const isLocalhost =
      serverOrigin.includes("localhost") ||
      serverOrigin.includes("127.0.0.1");

    if (isLocalhost && window.location.origin !== serverOrigin) {
      return `${window.location.origin}${path}`;
    }
  } catch {
    return `${window.location.origin}${path}`;
  }

  return serverUrl;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export async function shareLink(options: {
  url: string;
  title: string;
  text?: string;
}): Promise<"shared" | "copied" | "failed"> {
  const message = options.text ?? options.title;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: message,
        url: options.url,
      });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "failed";
      }
    }
  }

  const copied = await copyToClipboard(buildShareMessage(options.title, options.url));
  return copied ? "copied" : "failed";
}

export const sharePromptKey = (shareCode: string) => `share_prompt_${shareCode}`;

export function markSharePrompt(shareCode: string) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(sharePromptKey(shareCode), "1");
}

export function consumeSharePrompt(shareCode: string): boolean {
  if (typeof sessionStorage === "undefined") return false;
  const key = sharePromptKey(shareCode);
  if (!sessionStorage.getItem(key)) return false;
  sessionStorage.removeItem(key);
  return true;
}
