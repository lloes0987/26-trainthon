export const GOOGLE_TOKEN_COOKIE = "eonje_google_cal";
export const GOOGLE_FREEBUSY_SCOPE =
  "https://www.googleapis.com/auth/calendar.freebusy";

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function googleCallbackUri(origin: string) {
  return `${origin.replace(/\/$/, "")}/api/google/callback`;
}

export function encodeOAuthState(returnTo: string) {
  return Buffer.from(JSON.stringify({ returnTo })).toString("base64url");
}

export function decodeOAuthState(state: string | null): string {
  if (!state) return "/";
  try {
    const parsed = JSON.parse(
      Buffer.from(state, "base64url").toString(),
    ) as { returnTo?: string };
    if (
      typeof parsed.returnTo === "string" &&
      parsed.returnTo.startsWith("/") &&
      !parsed.returnTo.startsWith("//")
    ) {
      return parsed.returnTo;
    }
  } catch {
    /* ignore */
  }
  return "/";
}
